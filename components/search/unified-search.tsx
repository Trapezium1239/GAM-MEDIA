'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter, ChevronDown, Loader2, Music, Calendar, BookOpen } from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';

interface SearchResult {
  id: string;
  title: string;
  preacher?: string;
  artist_choir?: string;
  date?: string | null;
  event_date?: string | null;
  release_date?: string | null;
  audio_url?: string | null;
  video_link?: string | null;
  venue?: string | null;
  _type: 'sermons' | 'music' | 'programs';
  topics?: { name: string; slug: string } | null;
  rank?: number;
}

interface SearchTopic {
  id: string;
  name: string;
  slug: string;
}

interface UnifiedSearchProps {
  initialResults: SearchResult[];
  topics: SearchTopic[];
  type: 'sermons' | 'music' | 'programs' | 'all';
  serverSearchEnabled?: boolean;
  serverSearchThreshold?: number;
  onResultClick?: (result: SearchResult) => void;
}

export function UnifiedSearch({ 
  initialResults, 
  topics, 
  type = 'all',
  serverSearchEnabled = true,
  serverSearchThreshold = 100,
  onResultClick
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [serverResults, setServerResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const totalCount = initialResults.length;
  const shouldUseServer = serverSearchEnabled && totalCount >= serverSearchThreshold;

  // Client-side filtering
  const clientFiltered = useMemo(() => {
    return initialResults.filter((result) => {
      const searchText = [
        result.title,
        result.preacher,
        result.artist_choir,
        result.venue,
        result.topics?.name,
      ].join(' ').toLowerCase();
      
      const matchesQuery = !query || searchText.includes(query.toLowerCase());
      const matchesTopic = selectedTopic === 'all' || result.topics?.slug === selectedTopic;
      
      return matchesQuery && matchesTopic;
    });
  }, [initialResults, query, selectedTopic]);

  // Server-side search
  const performServerSearch = useCallback(async () => {
    if (!shouldUseServer || query.length < 2) {
      setServerResults(null);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        type: type,
        limit: '50',
        offset: '0',
      });
      if (selectedTopic !== 'all') params.set('topic_id', selectedTopic);

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Search failed');

      setServerResults(data.results || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setServerResults(null);
    } finally {
      setSearching(false);
    }
  }, [query, selectedTopic, type, shouldUseServer]);

  // Trigger server search
  useMemo(() => {
    if (shouldUseServer) {
      performServerSearch();
    }
  }, [performServerSearch, shouldUseServer]);

  // Use server results when available, otherwise client
  const results = shouldUseServer && serverResults !== null ? serverResults : clientFiltered;
  const filteredCount = results.length;
  const isUsingServer = shouldUseServer && serverResults !== null;

  const getTypeIcon = (resultType: string) => {
    switch (resultType) {
      case 'sermons': return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'music': return <Music className="w-5 h-5 text-amber-400" />;
      case 'programs': return <Calendar className="w-5 h-5 text-green-400" />;
      default: return <Search className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getTypeLabel = (resultType: string) => {
    switch (resultType) {
      case 'sermons': return 'Sermon';
      case 'music': return 'Music';
      case 'programs': return 'Event';
      default: return 'Result';
    }
  };

  const getDate = (result: SearchResult) => {
    return result.date || result.event_date || result.release_date;
  };

  const format = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={shouldUseServer ? `Search ${type}... (server)` : `Search ${type}...`}
            className="input-base pl-10 pr-10"
            disabled={searching}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSelectedTopic('all'); setServerResults(null); }}
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
      {topics.length > 0 && type !== 'all' && (
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
          {filteredCount} of {totalCount} {type === 'all' ? 'items' : type}
          {isUsingServer && <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">Server</span>}
        </span>
        {(query || selectedTopic !== 'all') && (
          <button
            onClick={() => { setQuery(''); setSelectedTopic('all'); setServerResults(null); }}
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
      {filteredCount > 0 ? (
        <div className="space-y-3">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="card-compact flex items-center gap-3 touch-manipulation text-left w-full"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                {getTypeIcon(result._type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{result.title}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">
                    {getTypeLabel(result._type)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1 truncate">
                  {result.preacher && (
                    <>
                      <span className="font-medium">{result.preacher}</span>
                      <span>•</span>
                    </>
                  )}
                  {result.artist_choir && (
                    <>
                      <span className="font-medium">{result.artist_choir}</span>
                      <span>•</span>
                    </>
                  )}
                  {getDate(result) && (
                    <>
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {format(getDate(result)!)}
                    </>
                  )}
                  {result.venue && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{result.venue}</span>
                    </>
                  )}
                </p>
              </div>
              {result.audio_url && (
                <PlaySermonButton
                  track={{ 
                    id: result.id, 
                    title: result.title, 
                    artist: result.preacher || result.artist_choir || '', 
                    audioUrl: result.audio_url 
                  }}
                />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state py-12">
          <Search className="empty-state-icon text-zinc-600" />
          <p className="empty-state-title">No results found</p>
          <p className="empty-state-desc">
            {query ? `No results for "${query}"` : 'Try adjusting your filters'}
            {shouldUseServer && ' • Check spelling or try broader terms'}
          </p>
        </div>
      )}
    </div>
  );
}

function format(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}