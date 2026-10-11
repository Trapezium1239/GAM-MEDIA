'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import MiniSearch from 'minisearch';

interface SermonRecord {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  r2_key: string;
  topic_name: string;
}

export function InstantSearch() {
  const [searchEngine, setSearchEngine] = useState<MiniSearch<SermonRecord> | null>(null);
  const [results, setResults] = useState<SermonRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [indexedCount, setIndexedCount] = useState(0);

  useEffect(() => {
    async function loadIndex() {
      try {
        const res = await fetch('/search-index.json');
        if (!res.ok) throw new Error('Failed to load search index');
        const documents = await res.json();
        
        const miniSearch = new MiniSearch<SermonRecord>({
          fields: ['title', 'preacher', 'topic_name'],
          storeFields: ['id', 'title', 'preacher', 'date', 'duration', 'r2_key', 'topic_name'],
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 2, preacher: 1.5 },
          },
        });

        miniSearch.addAll(documents);
        setSearchEngine(miniSearch);
        setIndexedCount(documents.length);
      } catch (err) {
        console.error('Search index load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadIndex();
  }, []);

  useEffect(() => {
    if (!searchEngine || !query.trim()) {
      setResults([]);
      return;
    }
    const found = searchEngine.search(query);
    const results = found.slice(0, 20).map(r => r.doc as SermonRecord);
    setResults(results);
  }, [query, searchEngine]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            disabled
            placeholder="Loading search index..."
            className="w-full px-4 py-3 rounded-lg border border-cream-300 bg-cream-100 text-cream-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400">
            <div className="w-5 h-5 border-2 border-cream-300 border-t-wine-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${indexedCount} sermons instantly...`}
          className="w-full px-10 py-3 rounded-lg border border-cream-300 bg-cream-50 text-wine-900 placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-wine-500/50 focus:border-wine-500/40"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400 hover:text-wine-600"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
          {results.map((item) => (
            <div 
              key={item.id} 
              className="p-3 bg-cream-100 rounded-lg border border-cream-200 hover:border-wine-300/50 transition-colors cursor-pointer"
              onClick={() => {
                // Could trigger playback or navigation
                console.log('Play:', item.r2_key);
              }}
            >
              <h4 className="font-semibold text-wine-900 truncate">{item.title}</h4>
              <p className="text-sm text-wine-700 flex items-center gap-2 mt-1">
                <span>{item.preacher}</span>
                <span className="text-cream-400">•</span>
                <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-cream-400">•</span>
                <span>{item.duration}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && !loading && (
        <div className="mt-4 text-center text-cream-500 text-sm py-4">
          No sermons found for "{query}"
        </div>
      )}
    </div>
  );
}