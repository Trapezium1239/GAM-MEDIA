import { get, set, del, keys } from 'idb-keyval';

const AUDIO_PREFIX = 'audio_';
const VAULT_PREFIX = 'vault_';
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB

export interface CachedAudio {
  id: string;
  title: string;
  artist: string;
  blob: Blob;
  mimeType: string;
  cachedAt: number;
  size: number;
}

export interface VaultItem {
  id: string;
  type: 'sermon' | 'music' | 'program';
  data: unknown;
  cachedAt: number;
}

/**
 * Cache an audio blob for offline playback
 */
export async function cacheAudio(
  id: string,
  blob: Blob,
  metadata: { title: string; artist: string; mimeType: string }
): Promise<void> {
  if (blob.size > MAX_AUDIO_SIZE) {
    throw new Error(`Audio file exceeds ${MAX_AUDIO_SIZE / 1024 / 1024}MB limit`);
  }

  const totalSize = await getTotalCacheSize();
  if (totalSize + blob.size > MAX_TOTAL_SIZE) {
    await evictOldestAudio(blob.size);
  }

  const item: CachedAudio = {
    id,
    ...metadata,
    blob,
    cachedAt: Date.now(),
    size: blob.size,
  };

  await set(`${AUDIO_PREFIX}${id}`, item);
}

/**
 * Retrieve cached audio blob
 */
export async function getCachedAudio(id: string): Promise<CachedAudio | undefined> {
  return await get(`${AUDIO_PREFIX}${id}`);
}

/**
 * Check if audio is cached
 */
export async function isAudioCached(id: string): Promise<boolean> {
  const item = await get(`${AUDIO_PREFIX}${id}`);
  return !!item;
}

/**
 * Remove cached audio
 */
export async function removeCachedAudio(id: string): Promise<void> {
  await del(`${AUDIO_PREFIX}${id}`);
}

/**
 * Get all cached audio IDs
 */
export async function getCachedAudioIds(): Promise<string[]> {
  const allKeys = await keys() as string[];
  return allKeys
    .filter((k: string) => k.startsWith(AUDIO_PREFIX))
    .map((k: string) => k.replace(AUDIO_PREFIX, ''));
}

/**
 * Get total cache size in bytes
 */
export async function getTotalCacheSize(): Promise<number> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  let total = 0;
  for (const key of allKeys) {
    if (key.startsWith(AUDIO_PREFIX)) {
      const item = await get(key);
      if (item && 'size' in item) total += (item as CachedAudio).size;
    }
  }
  return total;
}

/**
 * Evict oldest audio until enough space freed
 */
async function evictOldestAudio(requiredSpace: number): Promise<void> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  const audioItems: { key: string; cachedAt: number; size: number }[] = [];

  for (const key of allKeys) {
    if (key.startsWith(AUDIO_PREFIX)) {
      const item = await get(key);
      if (item && 'cachedAt' in item && 'size' in item) {
        audioItems.push({
          key,
          cachedAt: (item as CachedAudio).cachedAt,
          size: (item as CachedAudio).size,
        });
      }
    }
  }

  audioItems.sort((a, b) => a.cachedAt - b.cachedAt);

  let freed = 0;
  for (const item of audioItems) {
    if (freed >= requiredSpace) break;
    await del(item.key);
    freed += item.size;
  }
}

/**
 * Clear all cached audio
 */
export async function clearAudioCache(): Promise<void> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  const audioKeys = allKeys.filter((k) => k.startsWith(AUDIO_PREFIX));
  await Promise.all(audioKeys.map((k) => del(k)));
}

/**
 * Vault storage for sermon/music/program data (metadata, not blobs)
 */
export async function cacheVaultItem(id: string, type: VaultItem['type'], data: unknown): Promise<void> {
  const item: VaultItem = {
    id,
    type,
    data,
    cachedAt: Date.now(),
  };
  await set(`${VAULT_PREFIX}${id}`, item);
}

export async function getVaultItem(id: string): Promise<VaultItem | undefined> {
  return await get(`${VAULT_PREFIX}${id}`);
}

export async function getAllVaultItems(): Promise<VaultItem[]> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  const items: VaultItem[] = [];
  for (const key of allKeys) {
    if (key.startsWith(VAULT_PREFIX)) {
      const item = await get(key);
      if (item) items.push(item as VaultItem);
    }
  }
  return items;
}

export async function clearVaultCache(): Promise<void> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  const vaultKeys = allKeys.filter((k) => k.startsWith(VAULT_PREFIX));
  await Promise.all(vaultKeys.map((k) => del(k)));
}

/**
 * Get storage usage stats
 */
export async function getStorageStats(): Promise<{
  audioCount: number;
  audioSize: number;
  vaultCount: number;
}> {
  const allKeys = (await keys()).filter((k): k is string => typeof k === 'string');
  let audioCount = 0;
  let audioSize = 0;
  let vaultCount = 0;

  for (const key of allKeys) {
    if (key.startsWith(AUDIO_PREFIX)) {
      audioCount++;
      const item = await get(key);
      if (item && 'size' in item) audioSize += (item as CachedAudio).size;
    } else if (key.startsWith(VAULT_PREFIX)) {
      vaultCount++;
    }
  }

  return { audioCount, audioSize, vaultCount };
}