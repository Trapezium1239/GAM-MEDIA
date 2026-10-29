'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search, X, Filter, ChevronDown, Loader2, AlertCircle, User, Calendar, Volume2 } from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';
import { createClient } from '@/lib/supabase/client';

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
  topic_id: string | null;
  duration?: string | null;
  topics?: { name: string; slug: string } | null;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
}

interface SermonSearchProps {
  initialSermons: Sermon[];
  topics: Topic[];
  totalSermons: number;
}

/** Escape characters that would break a PostgREST `or=` filter. */
function sanitize(term: string): string {
  return term.replace(/[,()%*"\\]/g, ' ').trim();
}

function displayDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'MMM d, yyyy');
}

export function SermonSearch({ initialSermons, topics, totalSermons }: SermonSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [audioOnly, setAudioOnly] = useState(false);
  const [results, setResults] = useState<Sermon[]>(initialSermons);
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isFiltering = debouncedQuery.length > 0 || selectedTopic !== 'all' || audioOnly;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async () => {
    const term = sanitize(debouncedQuery);

    if (!term && selectedTopic === 'all' && !audioOnly) {
      setResults(initialSermons);
      setFilteredTotal(null);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);

    const supabase = createClient();
    let request = supabase
      .from('sermons')
      .select('id, title, preacher, date, duration, audio_url, video_link, topic_id, topics(name, slug)', {
        count: 'exact',
      })
      .order('date', { ascending: false })
      .limit(100);

    // Real recordings are the only rows whose audio_url starts with http;
    // placeholders (`audio/...`) and dead desktop paths (`local://...`) do not.
    if (audioOnly) request = request.like('audio_url', 'http%');
    if (term) request = request.or(`title.ilike.%${term}%,preacher.ilike.%${term}%`);
    if (selectedTopic !== 'all') request = request.eq('topic_id', selectedTopic);

    const { data, error, count } = await request;

    setFilteredTotal(count ?? null);
    if (error) {
      setSearchError(error.message);
      setResults([]);
    } else {
      setResults((data ?? []) as unknown as Sermon[]);
    }
    setSearching(false);
  }, [debouncedQuery, selectedTopic, audioOnly, initialSermons]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedTopic('all');
    setAudioOnly(false);
  };

  /** True when at least one sermon in the initially-loaded window is playable. */
  const initialHasAudio = useMemo(
    () => initialSermons.some((s) => (s.audio_url || '').startsWith('http')),
    [initialSermons]
  );

  const countLabel = useMemo(() => {
    if (!isFiltering) return `${totalSermons} sermons`;
    const shown = filteredTotal ?? results.length;
    if (audioOnly && !debouncedQuery && selectedTopic === 'all') {
      const hidden = shown - results.length;
      return `${shown} sermons with audio${hidden > 0 ? ` · showing ${results.length}` : ''}`;
    }
    return `${shown} result${shown === 1 ? '' : 's'}`;
  }, [isFiltering, audioOnly, debouncedQuery, selectedTopic, filteredTotal, results.length, totalSermons]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, preacher, topic..."
          className="input-base pl-10 pr-10"
          aria-label="Search sermons"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-400 hover:text-wine-700"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {searching && (
          <Loader2
            className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400 animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAudioOnly((v) => !v)}
          aria-pressed={audioOnly}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
            audioOnly
              ? 'border-wine-600 bg-wine-600 text-cream-50'
              : 'border-cream-300 bg-cream-100 text-wine-600 hover:border-wine-400 hover:text-wine-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          With audio
        </button>
      </div>

      {topics.length > 0 && (
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400"
            aria-hidden="true"
          />
          <select
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
            className="input-base pl-10 appearance-none cursor-pointer"
            aria-label="Filter by topic"
          >
            <option value="all">All topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-wine-500">
        <span>{countLabel}</span>
        {isFiltering && (
          <button type="button" onClick={clearFilters} className="text-wine-700 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {!isFiltering && !initialHasAudio && (
        <div className="flex items-start gap-2 rounded-xl border border-cream-300 bg-cream-100 px-3 py-2.5 text-xs text-wine-600">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-wine-400" aria-hidden="true" />
          <span>
            The newest sermons have no uploaded recording yet.{' '}
            <button
              type="button"
              onClick={() => setAudioOnly(true)}
              className="font-semibold text-wine-800 underline hover:text-wine-900"
            >
              Show sermons with audio
            </button>
          </span>
        </div>
      )}

      {searchError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{searchError}</span>
        </div>
      )}

      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((sermon) => (
            <li key={sermon.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-wine-900 leading-snug">{sermon.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-wine-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" aria-hidden="true" />
                      {sermon.preacher || 'GAM Media'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {displayDate(sermon.date)}
                    </span>
                  </div>
                </div>
                {sermon.topics?.name && (
                  <span className="flex-shrink-0 rounded-full bg-wine-600/10 px-2 py-0.5 text-xs font-medium text-wine-700">
                    {sermon.topics.name}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PlaySermonButton
                  track={{
                    id: sermon.id,
                    title: sermon.title,
                    artist: sermon.preacher || 'GAM Media',
                    audioUrl: sermon.audio_url ?? '',
                  }}
                />
                {sermon.video_link && (
                  <a
                    href={sermon.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-wine-600 px-3 py-2 text-xs font-semibold text-white hover:bg-wine-700"
                  >
                    Watch video
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !searching && (
          <div className="empty-state py-12">
            <Search className="empty-state-icon text-wine-300" aria-hidden="true" />
            <p className="empty-state-title">
              {audioOnly && !debouncedQuery && selectedTopic === 'all'
                ? 'No recordings available yet'
                : 'No sermons found'}
            </p>
            <p className="empty-state-desc">
              {audioOnly && !debouncedQuery && selectedTopic === 'all'
                ? 'Audio has not been uploaded for this selection.'
                : debouncedQuery
                  ? `No results for "${debouncedQuery}"`
                  : 'Try a different topic'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
