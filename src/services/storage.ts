/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentItem, ReadingHistoryItem, AppPreferences, BookmarkItem } from '../types/document';

const DB_NAME = 'paperwren_offline_db';
const DB_VERSION = 1;

const DEFAULT_PREFERENCES: AppPreferences = {
  themeMode: 'system',
  glassEffect: true,
  motoG45DeviceFrame: false,
  accentColor: '#f59e0b',
  storagePermissionGranted: false,
  defaultSortBy: 'date',
  defaultSortOrder: 'desc',
  viewLayout: 'grid',
  autoSaveProgress: true,
  readerSettings: {
    theme: 'light',
    fontScale: 1.0,
    fitMode: 'fit-width',
    rotation: 0,
    continuousScroll: true,
    distractionFree: false,
    hapticFeedback: true,
  },
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('format', 'format', { unique: false });
        docStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        docStore.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('openedAt', 'openedAt', { unique: false });
        historyStore.createIndex('documentId', 'documentId', { unique: false });
      }

      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getDocumentById(id: string): Promise<DocumentItem | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDocument(document: DocumentItem): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    const request = store.put(document);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateDocument(id: string, updates: Partial<DocumentItem>): Promise<DocumentItem> {
  const existing = await getDocumentById(id);
  if (!existing) {
    throw new Error(`Document ${id} not found`);
  }
  const updated: DocumentItem = { ...existing, ...updates };
  await saveDocument(updated);
  return updated;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['documents', 'history'], 'readwrite');
    const docStore = tx.objectStore('documents');
    docStore.delete(id);

    const histStore = tx.objectStore('history');
    const histIndex = histStore.index('documentId');
    const histReq = histIndex.getAllKeys(id);

    histReq.onsuccess = () => {
      const keys = histReq.result;
      keys.forEach((key) => histStore.delete(key));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const doc = await getDocumentById(id);
  if (!doc) return false;
  const newFav = !doc.isFavorite;
  await updateDocument(id, { isFavorite: newFav });
  return newFav;
}

export async function addBookmark(docId: string, pageNumber: number, label: string): Promise<BookmarkItem> {
  const doc = await getDocumentById(docId);
  if (!doc) throw new Error('Document not found');

  const newBookmark: BookmarkItem = {
    id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    documentId: docId,
    pageNumber,
    label: label.trim() || `Page ${pageNumber}`,
    createdAt: Date.now(),
  };

  const currentBookmarks = doc.bookmarks || [];
  await updateDocument(docId, {
    bookmarks: [...currentBookmarks, newBookmark],
  });

  return newBookmark;
}

export async function removeBookmark(docId: string, bookmarkId: string): Promise<void> {
  const doc = await getDocumentById(docId);
  if (!doc) return;

  const current = doc.bookmarks || [];
  await updateDocument(docId, {
    bookmarks: current.filter((b) => b.id !== bookmarkId),
  });
}

export async function recordReadingProgress(
  docId: string,
  pageNumber: number,
  totalPages?: number
): Promise<void> {
  const doc = await getDocumentById(docId);
  if (!doc) return;

  const total = totalPages || doc.pageCount || 1;
  const progressPercent = Math.min(100, Math.round((pageNumber / total) * 100));

  await updateDocument(docId, {
    lastPageRead: pageNumber,
    lastOpenedAt: Date.now(),
    pageCount: total,
  });

  const db = await getDb();
  const tx = db.transaction('history', 'readwrite');
  const store = tx.objectStore('history');

  const historyItem: ReadingHistoryItem = {
    id: 'hist_' + docId,
    documentId: docId,
    documentName: doc.name,
    format: doc.format,
    openedAt: Date.now(),
    lastPage: pageNumber,
    totalPages: total,
    progressPercent,
  };

  store.put(historyItem);
}

export async function getReadingHistory(): Promise<ReadingHistoryItem[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const request = store.getAll();

    request.onsuccess = () => {
      const list: ReadingHistoryItem[] = request.result || [];
      list.sort((a, b) => b.openedAt - a.openedAt);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearReadingHistory(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearThumbnailCache(): Promise<void> {
  const docs = await getAllDocuments();
  for (const doc of docs) {
    if (doc.thumbnailDataUrl) {
      await updateDocument(doc.id, { thumbnailDataUrl: undefined });
    }
  }
}

export async function getPreferences(): Promise<AppPreferences> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('preferences', 'readonly');
      const store = tx.objectStore('preferences');
      const request = store.get('app_prefs');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_PREFERENCES, ...request.result.value });
        } else {
          resolve(DEFAULT_PREFERENCES);
        }
      };
      request.onerror = () => resolve(DEFAULT_PREFERENCES);
    });
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    const request = store.put({ key: 'app_prefs', value: preferences });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageStats(): Promise<{
  totalSizeBytes: number;
  docCount: number;
  formatBreakdown: Record<string, number>;
}> {
  const docs = await getAllDocuments();
  let totalSizeBytes = 0;
  const formatBreakdown: Record<string, number> = {};

  for (const doc of docs) {
    totalSizeBytes += doc.sizeBytes;
    formatBreakdown[doc.format] = (formatBreakdown[doc.format] || 0) + 1;
  }

  return {
    totalSizeBytes,
    docCount: docs.length,
    formatBreakdown,
  };
}
