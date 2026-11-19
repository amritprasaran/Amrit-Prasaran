import { Newspaper } from '../types';
import { getPdfArrayBuffer } from './epaperStorage';

function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function createFallbackPdfBlob(paper: Newspaper): Blob {
  const safeTitle = escapePdfText(paper.title || 'Amrit Prasaran E-Paper');
  const safeDate = escapePdfText(paper.date);

  const lines = [
    'BT',
    '/F1 20 Tf',
    '50 750 Td',
    `(${safeTitle}) Tj`,
    '0 -28 Td',
    '/F1 12 Tf',
    `(Edition Date: ${safeDate} | Amrit Prasaran E-Paper) Tj`,
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${lines.length} >>\nstream\n${lines}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export async function downloadEditionPdf(paper: Newspaper) {
  let blob: Blob;
  try {
    const buffer = await getPdfArrayBuffer(paper.pdfUrl);
    blob = new Blob([buffer], { type: 'application/pdf' });
  } catch {
    blob = createFallbackPdfBlob(paper);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `amrit-prasaran-${paper.date || 'edition'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
