'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search, X, Filter, ChevronDown, Loader2, Keyboard, ArrowUp, ArrowDown, Music } from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';
import { createClient } from '@/lib/supabase/client';

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
  topic_id: string | null;
  topics?: { name: string; slug: string } | null;
}

interface SermonSearchProps {
  initialSermons: Sermon[];
  topics: { id: string; name: string; slug: string }[];
  serverSearchEnabled?: boolean;
  serverSearchThreshold?: number;
}

export function SermonSearch({ 
  initialSermons, 
  topics, 
  serverSearchEnabled = true,
  serverSearchThreshold = 100
}: SermonSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [serverResults, setServerResults] = useState<Sermon[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resultsRef = useRef<HTMLDivElement>(null);

  const totalCount = initialSermons.length;
  const shouldUseServer = serverSearchEnabled && totalCount >= serverSearchThreshold;

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Client-side filtering (fallback or when below threshold)
  const clientFiltered = useMemo(() => {
    return initialSermons.filter((sermon) => {
      const matchesQuery = !debouncedQuery || 
        sermon.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        sermon.preacher.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        sermon.topics?.name?.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      const matchesTopic = selectedTopic === 'all' || sermon.topic_id === selectedTopic;
      
      return matchesQuery && matchesTopic;
    });
  }, [initialSermons, debouncedQuery, selectedTopic]);

  // MOBILE-ONLY: Supabase full-text RPC directly (no /api routes in static export)
  const performServerSearch = useCallback(async () => {
    if (!shouldUseServer || debouncedQuery.length < 2) {
      setServerResults(null);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const supabase = createClient();
      const fn = 'search_sermons';
      const { data, error } = await supabase.rpc(fn, {
        p_query: debouncedQuery,
        p_topic_id: selectedTopic !== 'all' ? selectedTopic : null,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw new Error(error.message);

      setServerResults((data || []) as Sermon[]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setServerResults(null);
    } finally {
      setSearching(false);
    }
  }, [debouncedQuery, selectedTopic, shouldUseServer]);

  // Trigger server search when debounced query/topic changes
  useEffect(() => {
    if (shouldUseServer) {
      performServerSearch();
    }
  }, [performServerSearch, shouldUseServer]);

  // Use server results when available, otherwise client
  const sermons = shouldUseServer && serverResults !== null ? serverResults : clientFiltered;
  const filteredCount = sermons.length;
  const isUsingServer = shouldUseServer && serverResults !== null;

  // Keyboard navigation for results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCount === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCount - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          break;
        case 'Escape':
          setSelectedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCount]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-sermon-id]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCount]);

  const grouped = useMemo(() => {
    return sermons.reduce((acc, sermon) => {
      const key = sermon.topics?.slug || 'uncategorized';
      const label = sermon.topics?.name || 'Uncategorized';
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(sermon);
      return acc;
    }, {} as Record<string, { label: string; items: typeof sermons }>);
  }, [sermons]);

  const hasResults = filteredCount > 0;

  function format(dateStr: string) {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={debouncedQuery}
            onChange={(e) => setDebouncedQuery(e.target.value)}
            placeholder={shouldUseServer ? 'Search title, preacher, topic... (server)' : 'Search title, preacher, topic...'}
            className="input-base pl-10 pr-10"
            disabled={searching}
            aria-label="Search sermons"
            autoComplete="off"
          />
          {debouncedQuery && (
            <button
              onClick={() => { setDebouncedQuery(''); setSelectedTopic('all'); setServerResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searching && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Topic Filter */}
      {topics.length > 0 && (
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="input-base pl-10 appearance-none cursor-pointer"
            disabled={searching}
          >
            <option value="all">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {filteredCount} of {totalCount} sermons
          {isUsingServer && <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Server</span>}
        </span>
        {(debouncedQuery || selectedTopic !== 'all') && (
          <button
            onClick={() => { setDebouncedQuery(''); setSelectedTopic('all'); setServerResults(null); }}
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
        {searchError && (
          <span className="text-red-400 ml-2">{searchError}</span>
        )}
      </div>

      {/* Results */}
      {hasResults ? (
        <div ref={resultsRef} className="space-y-6">
          {Object.entries(grouped).map(([key, group]) => (
            <section key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{group.label}</h2>
                <span className="text-xs text-zinc-500">{group.items.length} results</span>
              </div>
              <div className="space-y-2">
                {group.items.map((sermon, index) => (
                  <article 
                    key={sermon.id} 
                    className="card space-y-2"
                    data-sermon-id={sermon.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const audioBtn = e.currentTarget.querySelector('[data-play-btn]') as HTMLButtonElement;
                        audioBtn?.click();
                      }
                    }}
                    style={selectedIndex === index ? { outline: '2px solid #f59e0b', outlineOffset: '2px' } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {sermon.video_link ? (
                          <svg className="w-6 h-6 text-zinc-500 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        ) : (
                          <svg className="w-6 h-6 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{sermon.title}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          {sermon.preacher} • {format(sermon.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                      {sermon.audio_url && (
                        <PlaySermonButton 
                          track={{
                            id: sermon.id,
                            title: sermon.title,
                            artist: sermon.preacher,
                            audioUrl: sermon.audio_url
                          }}
                          className="flex-1 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition touch-manipulation flex items-center justify-center gap-1.5"
                          data-play-btn
                        />
                      )}
                      {sermon.video_link && (
                        <a href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg text-center hover:bg-amber-500/20 transition touch-manipulation">
                          Watch Video
                        </a>
                      )}
                      {(!sermon.audio_url && !sermon.video_link) && (
                        <span className="flex-1 py-2 text-xs text-zinc-500 text-center bg-zinc-800 rounded-lg">No media available</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state py-12">
          <Search className="empty-state-icon text-zinc-600" />
          <p className="empty-state-title">No sermons found</p>
          <p className="empty-state-desc">
            {debouncedQuery ? `No results for "${debouncedQuery}"` : 'Try adjusting your filters'}
            {shouldUseServer && ' • Check spelling or try broader terms'}
          </p>
        </div>
      )}
    </div>
  );
}