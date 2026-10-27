'use client';

import { useMemo, useState } from 'react';
import { Search, X, Music, Calendar, BookOpen } from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';

export interface SearchResult {
  id: string;
  title: string;
  preacher?: string;
  artist_choir?: string;
  description?: string | null;
  date?: string | null;
  event_date?: string | null;
  release_date?: string | null;
  audio_url?: string | null;
  video_link?: string | null;
  venue?: string | null;
  _type: 'sermons' | 'music' | 'programs';
  topics?: { name: string; slug: string } | null;
}

interface UnifiedSearchProps {
  initialResults: SearchResult[];
  type: 'sermons' | 'music' | 'programs' | 'all';
  onResultClick?: (result: SearchResult) => void;
}

const TYPE_ICON = {
  sermons: BookOpen,
  music: Music,
  programs: Calendar,
} as const;

const TYPE_LABEL = {
  sermons: 'Sermon',
  music: 'Music',
  programs: 'Event',
} as const;

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Client-side search over an already-loaded list. The lists this serves
 * (music ~70, programs ~dozens) are small, so no server round-trip is needed —
 * which also means search works offline in the Capacitor shell.
 */
export function UnifiedSearch({ initialResults, type, onResultClick }: UnifiedSearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return initialResults;
    return initialResults.filter((result) =>
      [
        result.title,
        result.preacher,
        result.artist_choir,
        result.description,
        result.venue,
        result.topics?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [initialResults, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${type === 'all' ? 'media' : type}...`}
          className="input-base pl-10 pr-10"
          aria-label={`Search ${type}`}
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
      </div>

      {query && (
        <p className="text-xs text-wine-500">
          {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
        </p>
      )}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((result) => {
            const Icon = TYPE_ICON[result._type];
            const date = result.date || result.event_date || result.release_date;
            const subtitle = result.preacher || result.artist_choir || result.description || result.venue;

            return (
              <li key={`${result._type}-${result.id}`} className="card-compact flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cream-200">
                  <Icon className="h-4 w-4 text-wine-600" aria-hidden="true" />
                </div>

                <div
                  className={`min-w-0 flex-1 ${onResultClick ? 'cursor-pointer' : ''}`}
                  {...(onResultClick
                    ? {
                        role: 'button',
                        tabIndex: 0,
                        onClick: () => onResultClick(result),
                        onKeyDown: (event: React.KeyboardEvent) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onResultClick(result);
                          }
                        },
                      }
                    : {})}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-wine-900">{result.title}</h3>
                    <span className="flex-shrink-0 rounded-full bg-cream-200 px-1.5 py-0.5 text-xs text-wine-600">
                      {TYPE_LABEL[result._type]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-wine-500">
                    {subtitle}
                    {date && ` · ${formatDate(date)}`}
                  </p>
                </div>

                {result.audio_url && (
                  <div className="flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                    <PlaySermonButton
                      track={{
                        id: result.id,
                        title: result.title,
                        artist: result.preacher || result.artist_choir || 'GAM Media',
                        audioUrl: result.audio_url,
                      }}
                      className="whitespace-nowrap"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state py-10">
          <Search className="empty-state-icon text-wine-300" aria-hidden="true" />
          <p className="empty-state-title">No results found</p>
          <p className="empty-state-desc">No match for “{query}”</p>
        </div>
      )}
    </div>
  );
}
