'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  X,
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Volume2,
  Layers,
} from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';
import { createClient } from '@/lib/supabase/client';
import { groupSermons, type GroupMode, type SermonGroup } from '@/lib/sermon-groups';

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

/** Cards shown per group before "Show all". Groups can hold hundreds of rows. */
const GROUP_PREVIEW = 8;

/** Escape characters that would break a PostgREST `or=` filter. */
function sanitize(term: string): string {
  return term.replace(/[,()%*"\\]/g, ' ').trim();
}

function displayDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'MMM d, yyyy');
}

const isPlayable = (audioUrl: string | null): boolean => (audioUrl || '').startsWith('http');

interface SermonCardProps {
  sermon: Sermon;
  topicName?: string;
  level?: 'h2' | 'h3';
}

function SermonCard({ sermon, topicName, level = 'h2' }: SermonCardProps) {
  const Heading = level;
  const topic = sermon.topics?.name ?? topicName;

  return (
    <li className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Heading className="text-sm font-semibold text-wine-900 leading-snug">{sermon.title}</Heading>
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
        {topic && (
          <span className="flex-shrink-0 rounded-full bg-wine-600/10 px-2 py-0.5 text-xs font-medium text-wine-700">
            {topic}
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
  );
}

interface GroupSectionProps {
  group: SermonGroup<Sermon>;
  topicNameFor: (topicId: string | null) => string | undefined;
}

function GroupSection({ group, topicNameFor }: GroupSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? group.sermons : group.sermons.slice(0, GROUP_PREVIEW);
  const audioCount = group.sermons.filter((s) => isPlayable(s.audio_url)).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-cream-300 pb-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-wine-900">{group.label}</h2>
          {group.detail && <p className="mt-0.5 text-xs text-wine-500">{group.detail}</p>}
        </div>
        <span className="flex-shrink-0 text-xs text-wine-500">
          {group.sermons.length} {group.sermons.length === 1 ? 'sermon' : 'sermons'}
          {audioCount > 0 && ` · ${audioCount} with audio`}
        </span>
      </div>

      <ul className="space-y-3">
        {visible.map((sermon) => (
          <SermonCard key={sermon.id} sermon={sermon} topicName={topicNameFor(sermon.topic_id)} level="h3" />
        ))}
      </ul>

      {group.sermons.length > GROUP_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full rounded-xl border border-cream-300 bg-cream-100 px-3 py-2 text-xs font-medium text-wine-600 transition hover:border-wine-400 hover:text-wine-800"
        >
          {expanded ? 'Show fewer' : `Show all ${group.sermons.length} sermons`}
        </button>
      )}
    </section>
  );
}

export function SermonSearch({ initialSermons, topics, totalSermons }: SermonSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [audioOnly, setAudioOnly] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupMode>('none');
  const [results, setResults] = useState<Sermon[]>(initialSermons);
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Grouping needs the whole library, otherwise the counts would describe only
  // the 200-row window the page happens to have loaded. Fetched once, on demand.
  const [groupIndex, setGroupIndex] = useState<Sermon[] | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const indexRequested = useRef(false);

  const isFiltering = debouncedQuery.length > 0 || selectedTopic !== 'all' || audioOnly;
  const isGrouped = groupBy !== 'none';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async () => {
    // Grouped results are filtered client-side from the full index below.
    if (isGrouped) {
      setSearching(false);
      return;
    }

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
  }, [debouncedQuery, selectedTopic, audioOnly, initialSermons, isGrouped]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  // Load the complete, lightweight sermon index the first time grouping is used.
  useEffect(() => {
    if (!isGrouped || indexRequested.current) return;
    indexRequested.current = true;

    let cancelled = false;
    setIndexLoading(true);
    setIndexError(null);

    (async () => {
      const supabase = createClient();
      const all: Sermon[] = [];
      const PAGE = 1000;

      for (let from = 0; from < 20000; from += PAGE) {
        const { data, error } = await supabase
          .from('sermons')
          .select('id, title, preacher, date, duration, audio_url, video_link, topic_id')
          .order('date', { ascending: false })
          .order('id', { ascending: true })
          .range(from, from + PAGE - 1);

        if (error) {
          if (!cancelled) {
            setIndexError(error.message);
            setIndexLoading(false);
            indexRequested.current = false; // allow a retry
          }
          return;
        }

        all.push(...((data ?? []) as unknown as Sermon[]));
        if (!data || data.length < PAGE) break;
      }

      if (!cancelled) {
        setGroupIndex(all);
        setIndexLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGrouped]);

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedTopic('all');
    setAudioOnly(false);
  };

  /** True when at least one sermon in the initially-loaded window is playable. */
  const initialHasAudio = useMemo(
    () => initialSermons.some((s) => isPlayable(s.audio_url)),
    [initialSermons]
  );

  /** The full index narrowed by the same filters the flat list applies. */
  const groupSource = useMemo(() => {
    if (!groupIndex) return [];
    const term = debouncedQuery.toLowerCase();
    return groupIndex.filter((sermon) => {
      if (audioOnly && !isPlayable(sermon.audio_url)) return false;
      if (selectedTopic !== 'all' && sermon.topic_id !== selectedTopic) return false;
      if (term && !`${sermon.title} ${sermon.preacher}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [groupIndex, audioOnly, selectedTopic, debouncedQuery]);

  const groups = useMemo(() => groupSermons(groupSource, groupBy), [groupSource, groupBy]);

  const topicNameFor = useCallback(
    (topicId: string | null) => (topicId ? topics.find((t) => t.id === topicId)?.name : undefined),
    [topics]
  );

  const countLabel = useMemo(() => {
    if (isGrouped) {
      const shown = groupSource.length;
      return `${shown} ${shown === 1 ? 'sermon' : 'sermons'} · ${groups.length} ${
        groups.length === 1 ? 'group' : 'groups'
      }`;
    }
    if (!isFiltering) return `${totalSermons} sermons`;
    const shown = filteredTotal ?? results.length;
    if (audioOnly && !debouncedQuery && selectedTopic === 'all') {
      const hidden = shown - results.length;
      return `${shown} sermons with audio${hidden > 0 ? ` · showing ${results.length}` : ''}`;
    }
    return `${shown} result${shown === 1 ? '' : 's'}`;
  }, [
    isGrouped,
    groupSource.length,
    groups.length,
    isFiltering,
    audioOnly,
    debouncedQuery,
    selectedTopic,
    filteredTotal,
    results.length,
    totalSermons,
  ]);

  const error = searchError ?? indexError;

  const emptyState = (
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
  );

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

      <div className={`grid gap-2 ${topics.length > 0 ? 'sm:grid-cols-2' : ''}`}>
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

        <div className="relative">
          <Layers
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400"
            aria-hidden="true"
          />
          <select
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as GroupMode)}
            className="input-base pl-10 appearance-none cursor-pointer"
            aria-label="Group sermons"
          >
            <option value="none">No grouping</option>
            <option value="month">Group by month &amp; year</option>
            <option value="service">Group by service / series</option>
            <option value="preacher">Group by preacher / sender</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {groupBy === 'preacher' && (
        <p className="text-xs leading-relaxed text-wine-500">
          The preacher field records who sent each recording, so some groups show a ministry or channel
          rather than a minister. Sermons whose value is a service label are grouped as
          &ldquo;Unspecified&rdquo;.
        </p>
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

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {isGrouped ? (
        indexLoading && !groupIndex ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-wine-500">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Loading all sermons…
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <GroupSection key={group.key} group={group} topicNameFor={topicNameFor} />
            ))}
          </div>
        ) : (
          !indexLoading && emptyState
        )
      ) : results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((sermon) => (
            <SermonCard
              key={sermon.id}
              sermon={sermon}
              topicName={topicNameFor(sermon.topic_id)}
              level="h2"
            />
          ))}
        </ul>
      ) : (
        !searching && emptyState
      )}
    </div>
  );
}
