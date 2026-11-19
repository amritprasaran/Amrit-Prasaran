import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  News,
  Video,
  Newspaper,
  Category,
  Comment,
  BreakingNewsItem,
  SocialLink,
  SiteSettings,
  ActivityItem,
  UserProfile,
  Bookmark,
  NewsTip,
  EditorInvite,
  Subscriber,
  SponsorAd,
  ContactInquiry,
  PushTokenRecord,
} from '../types';

export const DATA_UPDATED_EVENT = 'amrit:data-updated';

export function emitDataUpdated(scope: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT, { detail: { scope } }));
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean as T;
}

export function subscribePublicCollections(
  isAdmin: boolean,
  callbacks: {
    onNews: (items: News[]) => void;
    onCategories: (items: Category[]) => void;
    onNewspapers: (items: Newspaper[]) => void;
    onBreaking: (items: BreakingNewsItem[]) => void;
    onVideos: (items: Video[]) => void;
    onSettings: (item: SiteSettings) => void;
    onSocialLinks: (items: SocialLink[]) => void;
    onComments: (items: Comment[]) => void;
    onAds?: (items: SponsorAd[]) => void;
    onArticleViews?: (views: Record<string, number>) => void;
    onNewsTips?: (items: NewsTip[]) => void;
    onSubscribers?: (items: Subscriber[]) => void;
    onInquiries?: (items: ContactInquiry[]) => void;
    onPushTokenCount?: (count: number) => void;
    onActivity?: (items: ActivityItem[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  const newsQuery = isAdmin
    ? query(collection(db, 'news'))
    : query(collection(db, 'news'), where('isPublished', '==', true));

  unsubs.push(
    onSnapshot(
      newsQuery,
      snap => {
        if (!snap.empty) {
          const items = snap.docs
            .map(d => d.data() as News)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
          callbacks.onNews(items);
        }
      },
      err => {
        console.warn('News listener warning:', err.message);
      }
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'categories'),
      snap => {
        if (!snap.empty) {
          const items = snap.docs
            .map(d => d.data() as Category)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          callbacks.onCategories(items);
        }
      },
      err => console.warn('Categories listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'newspapers'),
      snap => {
        if (!snap.empty) {
          const items = snap.docs
            .map(d => d.data() as Newspaper)
            .sort((a, b) => b.date.localeCompare(a.date));
          callbacks.onNewspapers(items);
        }
      },
      err => console.warn('Newspapers listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'breakingNews'),
      snap => {
        if (!snap.empty) {
          callbacks.onBreaking(snap.docs.map(d => d.data() as BreakingNewsItem));
        }
      },
      err => console.warn('Breaking listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'videos'),
      snap => {
        if (!snap.empty) {
          const items = snap.docs
            .map(d => d.data() as Video)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
          callbacks.onVideos(items);
        }
      },
      err => console.warn('Videos listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'siteConfig', 'general'),
      snap => {
        if (snap.exists()) {
          callbacks.onSettings(snap.data() as SiteSettings);
        }
      },
      err => console.warn('Site settings listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'socialLinks'),
      snap => {
        if (!snap.empty) {
          callbacks.onSocialLinks(snap.docs.map(d => d.data() as SocialLink));
        }
      },
      err => console.warn('Social links listener warning:', err.message)
    )
  );

  if (callbacks.onAds) {
    unsubs.push(
      onSnapshot(
        collection(db, 'ads'),
        snap => {
          const items = snap.docs
            .map(d => d.data() as SponsorAd)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          callbacks.onAds?.(items);
        },
        err => console.warn('Ads listener warning:', err.message)
      )
    );
  }

  const commentsQuery = isAdmin
    ? query(collection(db, 'comments'))
    : query(collection(db, 'comments'), where('status', '==', 'approved'));

  unsubs.push(
    onSnapshot(
      commentsQuery,
      snap => {
        const items = snap.docs
          .map(d => d.data() as Comment)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        callbacks.onComments(items);
      },
      err => console.warn('Comments listener warning:', err.message)
    )
  );

  if (callbacks.onArticleViews) {
    unsubs.push(
      onSnapshot(
        collection(db, 'articleViews'),
        snap => {
          const viewMap: Record<string, number> = {};
          snap.docs.forEach(d => {
            const data = d.data() as { newsId?: string; count?: number };
            if (typeof data.count === 'number') {
              viewMap[data.newsId || d.id] = data.count;
            }
          });
          callbacks.onArticleViews?.(viewMap);
        },
        err => console.warn('Article views listener warning:', err.message)
      )
    );
  }

  if (isAdmin && callbacks.onNewsTips) {
    const tipsQuery = query(collection(db, 'newsTips'), orderBy('createdAt', 'desc'));
    unsubs.push(
      onSnapshot(
        tipsQuery,
        snap => {
          callbacks.onNewsTips?.(snap.docs.map(d => d.data() as NewsTip));
        },
        err => console.warn('News tips listener warning:', err.message)
      )
    );
  }

  if (isAdmin && callbacks.onSubscribers) {
    const subsQuery = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
    unsubs.push(
      onSnapshot(
        subsQuery,
        snap => {
          callbacks.onSubscribers?.(snap.docs.map(d => d.data() as Subscriber));
        },
        err => console.warn('Subscribers listener warning:', err.message)
      )
    );
  }

  if (isAdmin && callbacks.onInquiries) {
    const inqQuery = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    unsubs.push(
      onSnapshot(
        inqQuery,
        snap => {
          callbacks.onInquiries?.(snap.docs.map(d => d.data() as ContactInquiry));
        },
        err => console.warn('Inquiries listener warning:', err.message)
      )
    );
  }

  if (isAdmin && callbacks.onPushTokenCount) {
    unsubs.push(
      onSnapshot(
        collection(db, 'pushTokens'),
        snap => {
          callbacks.onPushTokenCount?.(snap.size);
        },
        err => console.warn('Push tokens listener warning:', err.message)
      )
    );
  }

  if (isAdmin && callbacks.onActivity) {
    const actQuery = query(collection(db, 'adminActivity'), orderBy('timestamp', 'desc'));
    unsubs.push(
      onSnapshot(
        actQuery,
        snap => {
          callbacks.onActivity?.(snap.docs.map(d => d.data() as ActivityItem).slice(0, 15));
        },
        err => console.warn('Activity listener warning:', err.message)
      )
    );
  }

  return () => {
    unsubs.forEach(u => u());
  };
}

export function subscribeUserPrivateData(
  uid: string,
  callbacks: {
    onProfile: (profile: UserProfile | null) => void;
    onBookmarks: (bookmarks: Bookmark[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid, 'private', 'profile'),
      snap => {
        callbacks.onProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      },
      err => console.warn('Profile listener warning:', err.message)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'users', uid, 'bookmarks'),
      snap => {
        const items = snap.docs
          .map(d => d.data() as Bookmark)
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
        callbacks.onBookmarks(items);
      },
      err => console.warn('Bookmarks listener warning:', err.message)
    )
  );

  return () => unsubs.forEach(u => u());
}

async function syncCollectionList<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  if (!auth.currentUser) return;
  try {
    const existingSnap = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    const nextIds = new Set(items.map(i => i.id));

    existingSnap.docs.forEach(d => {
      if (!nextIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    items.forEach(item => {
      const ref = doc(db, collectionName, item.id);
      batch.set(ref, stripUndefined(item as unknown as Record<string, unknown>));
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

export async function pushNewsToCloud(items: News[]) {
  const normalized = items.map(item => ({
    ...item,
    isPublished: item.isPublished !== false,
  }));
  await syncCollectionList('news', normalized);
}

export async function pushCategoriesToCloud(items: Category[]) {
  await syncCollectionList('categories', items);
}

export async function pushNewspapersToCloud(items: Newspaper[]) {
  await syncCollectionList('newspapers', items);
}

export async function pushBreakingToCloud(items: BreakingNewsItem[]) {
  await syncCollectionList('breakingNews', items);
}

export async function pushVideosToCloud(items: Video[]) {
  await syncCollectionList('videos', items);
}

export async function pushSocialLinksToCloud(items: SocialLink[]) {
  await syncCollectionList('socialLinks', items);
}

export async function pushAdsToCloud(items: SponsorAd[]) {
  await syncCollectionList('ads', items);
}

export async function pushSiteSettingsToCloud(settings: SiteSettings) {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'siteConfig', 'general'), stripUndefined({ ...settings }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteConfig/general');
  }
}

export async function pushActivityToCloud(item: ActivityItem) {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'adminActivity', item.id), stripUndefined({ ...item }));
  } catch {
    // Non-blocking audit log
  }
}

export async function incrementArticleViewInCloud(newsId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(newsId)) return;
  const viewRef = doc(db, 'articleViews', newsId);
  const nowIso = new Date().toISOString();
  try {
    const existing = await getDoc(viewRef);
    if (!existing.exists()) {
      await setDoc(viewRef, {
        newsId,
        count: 1,
        updatedAt: nowIso,
      });
    } else {
      await updateDoc(viewRef, {
        count: increment(1),
        updatedAt: nowIso,
      });
    }
  } catch (err) {
    console.warn('Article view increment warning:', err);
  }
}

export async function submitNewsTipInCloud(tip: NewsTip) {
  try {
    await setDoc(doc(db, 'newsTips', tip.id), stripUndefined({ ...tip, status: 'pending' }));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `newsTips/${tip.id}`);
  }
}

export async function updateNewsTipStatusInCloud(
  tipId: string,
  status: 'pending' | 'reviewed' | 'converted'
) {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'newsTips', tipId), {
      status,
      reviewedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `newsTips/${tipId}`);
  }
}

export async function deleteNewsTipInCloud(tipId: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'newsTips', tipId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `newsTips/${tipId}`);
  }
}

export async function createSubscriberInCloud(sub: Subscriber) {
  try {
    await setDoc(doc(db, 'subscribers', sub.id), stripUndefined({ ...sub }));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `subscribers/${sub.id}`);
  }
}

export async function deleteSubscriberInCloud(subId: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'subscribers', subId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `subscribers/${subId}`);
  }
}

export async function createInquiryInCloud(inquiry: ContactInquiry) {
  try {
    await setDoc(doc(db, 'inquiries', inquiry.id), stripUndefined({ ...inquiry, status: 'new' }));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `inquiries/${inquiry.id}`);
  }
}

export async function updateInquiryStatusInCloud(
  inquiryId: string,
  status: 'new' | 'resolved'
) {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
      status,
      resolvedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `inquiries/${inquiryId}`);
  }
}

export async function deleteInquiryInCloud(inquiryId: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'inquiries', inquiryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `inquiries/${inquiryId}`);
  }
}

export async function upsertPushTokenInCloud(record: PushTokenRecord) {
  try {
    await setDoc(doc(db, 'pushTokens', record.id), stripUndefined({ ...record }));
  } catch (err) {
    console.warn('Push token sync warning:', err);
  }
}

export function subscribeEditorInvites(
  onInvites: (invites: EditorInvite[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'editorInvites'),
    snap => {
      const list = snap.docs
        .map(d => d.data() as EditorInvite)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
      onInvites(list);
    },
    err => console.warn('Editor invites listener warning:', err.message)
  );
}

export async function upsertEditorInviteInCloud(invite: EditorInvite) {
  if (!auth.currentUser) return;
  const normalizedEmail = invite.email.trim().toLowerCase();
  try {
    await setDoc(doc(db, 'editorInvites', normalizedEmail), {
      ...invite,
      email: normalizedEmail,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `editorInvites/${normalizedEmail}`);
  }
}

export async function deleteEditorInviteInCloud(email: string) {
  if (!auth.currentUser) return;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    await deleteDoc(doc(db, 'editorInvites', normalizedEmail));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `editorInvites/${normalizedEmail}`);
  }
}

export async function createCommentInCloud(comment: Comment) {
  try {
    const payload: Comment = {
      ...comment,
      status: 'approved',
      ...(auth.currentUser?.uid ? { uid: auth.currentUser.uid } : {}),
    };
    await setDoc(doc(db, 'comments', comment.id), stripUndefined({ ...payload }));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `comments/${comment.id}`);
  }
}

export async function updateCommentStatusInCloud(
  commentId: string,
  status: 'approved' | 'hidden'
) {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'comments', commentId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `comments/${commentId}`);
  }
}

export async function deleteCommentInCloud(commentId: string) {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
  }
}

export async function pushUserProfileToCloud(uid: string, profile: UserProfile) {
  try {
    const payload = stripUndefined({
      ...profile,
      uid,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', uid, 'private', 'profile'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/private/profile`);
  }
}

export async function pushBookmarkToCloud(uid: string, bookmark: Bookmark) {
  try {
    await setDoc(
      doc(db, 'users', uid, 'bookmarks', bookmark.newsId),
      stripUndefined({ ...bookmark })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/bookmarks/${bookmark.newsId}`);
  }
}

export async function deleteBookmarkFromCloud(uid: string, newsId: string) {
  try {
    await deleteDoc(doc(db, 'users', uid, 'bookmarks', newsId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/bookmarks/${newsId}`);
  }
}

export async function seedCloudIfEmpty(defaults: {
  news: News[];
  categories: Category[];
  newspapers: Newspaper[];
  breakingNews: BreakingNewsItem[];
  videos: Video[];
  settings: SiteSettings;
  socialLinks: SocialLink[];
}) {
  if (!auth.currentUser) return;
  try {
    const newsSnap = await getDocs(collection(db, 'news'));
    if (newsSnap.empty && defaults.news.length > 0) {
      await pushNewsToCloud(defaults.news);
    }
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty && defaults.categories.length > 0) {
      await pushCategoriesToCloud(defaults.categories);
    }
    const paperSnap = await getDocs(collection(db, 'newspapers'));
    if (paperSnap.empty && defaults.newspapers.length > 0) {
      await pushNewspapersToCloud(defaults.newspapers);
    }
    const breakSnap = await getDocs(collection(db, 'breakingNews'));
    if (breakSnap.empty && defaults.breakingNews.length > 0) {
      await pushBreakingToCloud(defaults.breakingNews);
    }
    const vidSnap = await getDocs(collection(db, 'videos'));
    if (vidSnap.empty && defaults.videos.length > 0) {
      await pushVideosToCloud(defaults.videos);
    }
    const socialSnap = await getDocs(collection(db, 'socialLinks'));
    if (socialSnap.empty && defaults.socialLinks.length > 0) {
      await pushSocialLinksToCloud(defaults.socialLinks);
    }
    await pushSiteSettingsToCloud(defaults.settings);
  } catch (err) {
    console.warn('Initial cloud seed skipped or deferred:', err);
  }
}
