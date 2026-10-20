import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import MiniSearch from 'minisearch'

export interface SearchIndexRecord {
  id: string
  title: string
  preacher: string
  date: string
  duration?: string
  r2_key?: string
  audio_url?: string
  topic_name: string
}

interface SearchIndexDB extends DBSchema {
  searchIndex: {
    key: string
    value: { id: string; documents: SearchIndexRecord[]; cachedAt: number }
  }
}

const CACHE_KEY = 'sermons'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

let dbPromise: Promise<IDBPDatabase<SearchIndexDB>> | null = null
let enginePromise: Promise<MiniSearch<SearchIndexRecord>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SearchIndexDB>('gam-search-index', 1, {
      upgrade(db) {
        db.createObjectStore('searchIndex', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

async function loadDocuments(): Promise<SearchIndexRecord[]> {
  try {
    const db = await getDB()
    const cached = await db.get('searchIndex', CACHE_KEY)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS && cached.documents.length > 0) {
      return cached.documents
    }
  } catch {
    // IndexedDB unavailable — fetch the bundled index
  }

  const res = await fetch('/search-index.json')
  if (!res.ok) throw new Error('Could not load the sermon search index')
  const documents = (await res.json()) as SearchIndexRecord[]
  if (!Array.isArray(documents)) throw new Error('Search index is invalid')

  try {
    const db = await getDB()
    await db.put('searchIndex', { id: CACHE_KEY, documents, cachedAt: Date.now() })
  } catch {
    // Cache is optional
  }

  return documents
}

export async function getSermonSearchEngine(): Promise<MiniSearch<SearchIndexRecord>> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const documents = await loadDocuments()
      const miniSearch = new MiniSearch<SearchIndexRecord>({
        fields: ['title', 'preacher', 'topic_name'],
        storeFields: ['id', 'title', 'preacher', 'date', 'duration', 'r2_key', 'audio_url', 'topic_name'],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 2, preacher: 1.5 },
        },
      })
      miniSearch.addAll(documents)
      return miniSearch
    })()
  }
  return enginePromise
}

export async function searchCachedSermons(query: string, limit = 50): Promise<SearchIndexRecord[]> {
  if (!query.trim()) return []
  const engine = await getSermonSearchEngine()
  return engine.search(query).slice(0, limit).map((hit) => {
    const doc = hit as unknown as SearchIndexRecord & { id: string }
    return {
      id: doc.id,
      title: String(doc.title ?? ''),
      preacher: String(doc.preacher ?? ''),
      date: String(doc.date ?? ''),
      duration: doc.duration,
      r2_key: doc.r2_key,
      audio_url: doc.audio_url ?? doc.r2_key,
      topic_name: String(doc.topic_name ?? ''),
    }
  })
}
