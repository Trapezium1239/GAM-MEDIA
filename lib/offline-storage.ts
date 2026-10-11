import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface AudioCacheEntry {
  id: string;
  blob: Blob;
  metadata: { title: string; artist: string; mimeType: string; cachedAt: number; size: number };
}

interface VaultCacheEntry {
  id: string;
  type: 'sermon' | 'music' | 'program';
  data: unknown;
  cachedAt: number;
}

interface OfflineStorageDB extends DBSchema {
  audioCache: {
    key: string;
    value: AudioCacheEntry;
    indexes: { 'by-cached-at': number; 'by-size': number };
  };
  vaultCache: {
    key: string;
    value: VaultCacheEntry;
    indexes: { 'by-cached-at': number };
  };
}

const MAX_STORAGE_BYTES = 200 * 1024 * 1024; // 200MB
const TARGET_STORAGE_BYTES = 150 * 1024 * 1024; // 150MB after eviction
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB per file

let dbPromise: Promise<IDBPDatabase<OfflineStorageDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineStorageDB>('gam-offline-cache', 1, {
      upgrade(db) {
        const audioStore = db.createObjectStore('audioCache', { keyPath: 'id' });
        audioStore.createIndex('by-cached-at', 'metadata.cachedAt');
        audioStore.createIndex('by-size', 'metadata.size');

        const vaultStore = db.createObjectStore('vaultCache', { keyPath: 'id' });
        vaultStore.createIndex('by-cached-at', 'cachedAt');
      },
    });
  }
  return dbPromise;
}

/**
 * Cache an audio blob for offline playback with LRU eviction
 */
export async function cacheAudio(
  id: string,
  blob: Blob,
  metadata: { title: string; artist: string; mimeType: string }
): Promise<string> {
  if (blob.size > MAX_AUDIO_SIZE) {
    throw new Error(`Audio file exceeds ${MAX_AUDIO_SIZE / 1024 / 1024}MB limit`);
  }

  const db = await getDB();
  await enforceQuota(db, blob.size);

  const entry: AudioCacheEntry = {
    id,
    blob,
    metadata: { ...metadata, cachedAt: Date.now(), size: blob.size },
  };

  await db.put('audioCache', entry);
  return URL.createObjectURL(blob);
}

/**
 * Retrieve cached audio blob and update access time (LRU)
 */
export async function getCachedAudio(id: string): Promise<{ objectUrl: string; entry: AudioCacheEntry } | null> {
  const db = await getDB();
  const entry = await db.get('audioCache', id);
  if (!entry) return null;

  // Update access time for LRU
  entry.metadata.cachedAt = Date.now();
  await db.put('audioCache', entry);

  return { objectUrl: URL.createObjectURL(entry.blob), entry };
}

/**
 * Check if audio is cached
 */
export async function isAudioCached(id: string): Promise<boolean> {
  const db = await getDB();
  return (await db.get('audioCache', id)) !== null;
}

/**
 * Remove cached audio
 */
export async function removeCachedAudio(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('audioCache', id);
  if (entry) {
    URL.revokeObjectURL(URL.createObjectURL(entry.blob));
  }
  await db.delete('audioCache', id);
}

/**
 * Get all cached audio IDs
 */
export async function getCachedAudioIds(): Promise<string[]> {
  const db = await getDB();
  const entries = await db.getAllKeys('audioCache');
  return entries as string[];
}

/**
 * Get total cache size in bytes
 */
export async function getTotalCacheSize(): Promise<number> {
  const db = await getDB();
  const entries = await db.getAll('audioCache');
  return entries.reduce((sum, e) => sum + e.metadata.size, 0);
}

/**
 * Enforce storage quota with LRU eviction
 */
async function enforceQuota(db: IDBPDatabase<OfflineStorageDB>, incomingSize: number): Promise<void> {
  let currentSize = 0;
  const entries = await db.getAllFromIndex('audioCache', 'by-size');
  currentSize = entries.reduce((sum, e) => sum + e.metadata.size, 0);

  if (currentSize + incomingSize <= MAX_STORAGE_BYTES) return;

  // Evict LRU until under target
  const lruEntries = await db.getAllFromIndex('audioCache', 'by-cached-at');
  for (const entry of lruEntries) {
    if (currentSize <= TARGET_STORAGE_BYTES) break;
    await db.delete('audioCache', entry.id);
    currentSize -= entry.metadata.size;
    URL.revokeObjectURL(URL.createObjectURL(entry.blob));
  }
}

/**
 * Clear all cached audio
 */
export async function clearAudioCache(): Promise<void> {
  const db = await getDB();
  const entries = await db.getAll('audioCache');
  for (const entry of entries) {
    URL.revokeObjectURL(URL.createObjectURL(entry.blob));
  }
  await db.clear('audioCache');
}

/**
 * Vault storage for sermon/music/program metadata
 */
export async function cacheVaultItem(id: string, type: VaultCacheEntry['type'], data: unknown): Promise<void> {
  const db = await getDB();
  const entry: VaultCacheEntry = { id, type, data, cachedAt: Date.now() };
  await db.put('vaultCache', entry);
}

export async function getVaultItem(id: string): Promise<VaultCacheEntry | null> {
  const db = await getDB();
  const entry = await db.get('vaultCache', id);
  return entry ?? null;
}

export async function getAllVaultItems(): Promise<VaultCacheEntry[]> {
  const db = await getDB();
  return await db.getAll('vaultCache');
}

export async function clearVaultCache(): Promise<void> {
  const db = await getDB();
  await db.clear('vaultCache');
}

/**
 * Get storage usage stats
 */
export async function getStorageStats(): Promise<{
  audioCount: number;
  audioSize: number;
  vaultCount: number;
}> {
  const db = await getDB();
  const [audioEntries, vaultEntries] = await Promise.all([
    db.getAll('audioCache'),
    db.getAll('vaultCache'),
  ]);

  return {
    audioCount: audioEntries.length,
    audioSize: audioEntries.reduce((sum, e) => sum + e.metadata.size, 0),
    vaultCount: vaultEntries.length,
  };
}