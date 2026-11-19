import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

const DB_NAME = 'amrit_prasaran_epaper_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';
const INDEXEDDB_PREFIX = 'indexeddb://';
const FIRESTORE_PREFIX = 'firestore://';
const CHUNK_BINARY_BYTES = 320 * 1024; // ~427KB base64 per chunk (< 1MB Firestore doc limit)
const MAX_CHUNKS = 24; // ~7.6MB PDF ceiling for chunked Firestore sync

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const dbInst = request.result;
      if (!dbInst.objectStoreNames.contains(STORE_NAME)) {
        dbInst.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putInIndexedDb(id: string, buffer: ArrayBuffer): Promise<void> {
  const dbInst = await openDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(buffer, id);
    tx.oncomplete = () => {
      dbInst.close();
      resolve();
    };
    tx.onerror = () => {
      dbInst.close();
      reject(tx.error);
    };
  });
}

async function getFromIndexedDb(id: string): Promise<ArrayBuffer | null> {
  const dbInst = await openDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      dbInst.close();
      const result = req.result;
      if (result instanceof ArrayBuffer) {
        resolve(result.slice(0));
      } else if (result instanceof Blob) {
        result.arrayBuffer().then(resolve).catch(reject);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => {
      dbInst.close();
      reject(req.error);
    };
  });
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    const slice = bytes.subarray(i, i + step);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function savePdfFileToStorage(id: string, file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  await putInIndexedDb(id, buffer);

  // Sync PDF binary across devices in safe <1MB Firestore chunks when authenticated
  if (auth.currentUser) {
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_BINARY_BYTES);
    if (totalChunks <= MAX_CHUNKS) {
      try {
        const bytes = new Uint8Array(buffer);
        // Upload in batches of 5 chunks to stay under Firestore commit limits
        for (let start = 0; start < totalChunks; start += 5) {
          const batch = writeBatch(db);
          const end = Math.min(totalChunks, start + 5);
          for (let idx = start; idx < end; idx++) {
            const slice = bytes.subarray(
              idx * CHUNK_BINARY_BYTES,
              Math.min(bytes.length, (idx + 1) * CHUNK_BINARY_BYTES)
            );
            const chunkRef = doc(db, 'newspapers', id, 'chunks', idx.toString());
            batch.set(chunkRef, {
              index: idx,
              totalChunks,
              data: uint8ToBase64(slice),
            });
          }
          await batch.commit();
        }
        return `${FIRESTORE_PREFIX}${id}`;
      } catch (err) {
        console.warn('Cloud chunk upload fell back to local storage:', err);
      }
    }
  }

  return `${INDEXEDDB_PREFIX}${id}`;
}

export async function deletePdfFileFromStorage(pdfUrl: string): Promise<void> {
  let id: string | null = null;
  if (pdfUrl.startsWith(INDEXEDDB_PREFIX)) {
    id = pdfUrl.slice(INDEXEDDB_PREFIX.length);
  } else if (pdfUrl.startsWith(FIRESTORE_PREFIX)) {
    id = pdfUrl.slice(FIRESTORE_PREFIX.length);
  }
  if (!id) return;

  try {
    const dbInst = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = dbInst.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id as string);
      tx.oncomplete = () => {
        dbInst.close();
        resolve();
      };
      tx.onerror = () => {
        dbInst.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore cleanup errors
  }

  if (pdfUrl.startsWith(FIRESTORE_PREFIX) && auth.currentUser) {
    try {
      const chunksSnap = await getDocs(collection(db, 'newspapers', id, 'chunks'));
      if (!chunksSnap.empty) {
        const batch = writeBatch(db);
        chunksSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `newspapers/${id}/chunks`);
    }
  }
}

export async function getPdfArrayBuffer(pdfUrl: string): Promise<ArrayBuffer> {
  if (pdfUrl.startsWith(INDEXEDDB_PREFIX)) {
    const id = pdfUrl.slice(INDEXEDDB_PREFIX.length);
    const cached = await getFromIndexedDb(id);
    if (cached) return cached;
    throw new Error('Stored PDF file not found in local browser storage.');
  }

  if (pdfUrl.startsWith(FIRESTORE_PREFIX)) {
    const id = pdfUrl.slice(FIRESTORE_PREFIX.length);
    const cached = await getFromIndexedDb(id);
    if (cached) return cached;

    try {
      const chunksQuery = query(
        collection(db, 'newspapers', id, 'chunks'),
        orderBy('index', 'asc')
      );
      const snap = await getDocs(chunksQuery);
      if (snap.empty) {
        throw new Error('Cloud E-Paper PDF chunks not found.');
      }

      const byteChunks = snap.docs.map(d => base64ToUint8(String(d.data().data || '')));
      const totalLength = byteChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of byteChunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const buffer = combined.buffer;
      await putInIndexedDb(id, buffer.slice(0));
      return buffer;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, `newspapers/${id}/chunks`);
      }
      throw err;
    }
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF (${response.status})`);
  }
  return response.arrayBuffer();
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
