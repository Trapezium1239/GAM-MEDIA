import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface QueuedMutation {
  id: string;
  kind: 'first_timer';
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

interface OfflineQueueDB extends DBSchema {
  mutations: {
    key: string;
    value: QueuedMutation;
    indexes: { 'by-created-at': number };
  };
}

let queueDbPromise: Promise<IDBPDatabase<OfflineQueueDB>> | null = null;

function getQueueDB() {
  if (!queueDbPromise) {
    queueDbPromise = openDB<OfflineQueueDB>('gam-offline-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('mutations', { keyPath: 'id' });
        store.createIndex('by-created-at', 'createdAt');
      },
    });
  }
  return queueDbPromise;
}

function genQueueId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Queue an offline mutation (e.g. first-timer submission made while offline). */
export async function queueOfflineMutation(
  kind: QueuedMutation['kind'],
  payload: Record<string, unknown>
): Promise<string> {
  const db = await getQueueDB();
  const entry: QueuedMutation = {
    id: genQueueId(),
    kind,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  };
  await db.put('mutations', entry);
  return entry.id;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await getQueueDB();
    return await db.getAllFromIndex('mutations', 'by-created-at');
  } catch {
    return [];
  }
}

export async function removeQueuedMutation(id: string): Promise<void> {
  try {
    const db = await getQueueDB();
    await db.delete('mutations', id);
  } catch {
    // silent — queue is best-effort
  }
}

/** Attempt to flush queued first-timer submissions via the server action endpoint. */
export async function flushOfflineQueue(): Promise<{ flushed: number; pending: number }> {
  const queued = await getQueuedMutations();
  if (queued.length === 0) return { flushed: 0, pending: 0 };

  let flushed = 0;
  for (const item of queued) {
    try {
      if (item.kind === 'first_timer') {
        const formData = new FormData();
        for (const [key, value] of Object.entries(item.payload)) {
          if (value !== undefined && value !== null) formData.append(key, String(value));
        }
        const { submitFirstTimer } = await import('@/app/actions/first-timer');
        const result = await submitFirstTimer(formData);
        if ('error' in result && result.error) throw new Error(result.error);
      }
      await removeQueuedMutation(item.id);
      flushed += 1;
    } catch (err) {
      try {
        const db = await getQueueDB();
        await db.put('mutations', {
          ...item,
          attempts: item.attempts + 1,
          lastError: err instanceof Error ? err.message : 'Sync failed',
        });
      } catch {
        // silent
      }
    }
  }

  const remaining = await getQueuedMutations();
  return { flushed, pending: remaining.length };
}

export async function getOfflineQueueCount(): Promise<number> {
  const queued = await getQueuedMutations();
  return queued.length;
}
