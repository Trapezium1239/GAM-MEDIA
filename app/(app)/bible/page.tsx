'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  BookMarked,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  BIBLE_TRANSLATIONS,
  loadBible,
  searchBible,
  type BibleJson,
  type BibleSearchResult,
  type BibleTranslationId,
} from '@/lib/bible-data';
import { triggerHaptic } from '@/lib/native/haptics';

const STORAGE_KEY = 'bible:translation';

export default function BiblePage() {
  const [translation, setTranslation] = useState<BibleTranslationId>('kjv');
  const [bible, setBible] = useState<BibleJson | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [bookIndex, setBookIndex] = useState(42); // John
  const [chapter, setChapter] = useState(1);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [bookFilter, setBookFilter] = useState('');
  const [pendingBook, setPendingBook] = useState<number | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const chapterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(STORAGE_KEY) as BibleTranslationId | null;
    if (saved && BIBLE_TRANSLATIONS.some((t) => t.id === saved)) setTranslation(saved);
  }, []);

  // Lazy-load the selected translation (bundled JSON — works offline).
  useEffect(() => {
    let cancelled = false;
    setBible(null);
    setLoadError(null);
    loadBible(translation)
      .then((data) => {
        if (!cancelled) setBible(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load Bible');
      });
    return () => {
      cancelled = true;
    };
  }, [translation, reloadToken]);

  const book = bible?.books[bookIndex];
  const chapterData = book?.chapters.find((c) => c.chapter === chapter);

  // Book picker: searchable list split by testament (KJV order: OT 0–38, NT 39–65).
  const bookQuery = bookFilter.trim().toLowerCase();
  const allBooks = (bible?.books ?? []).map((b, i) => ({ name: b.name, index: i }));
  const otBooks = allBooks.slice(0, 39).filter((x) => x.name.toLowerCase().includes(bookQuery));
  const ntBooks = allBooks.slice(39).filter((x) => x.name.toLowerCase().includes(bookQuery));
  const pendingBookData = pendingBook != null ? bible?.books[pendingBook] : undefined;

  const goTo = useCallback(
    (nextBook: number, nextChapter: number, verse: number | null = null) => {
      void triggerHaptic('light');
      setBookIndex(nextBook);
      setChapter(nextChapter);
      setHighlightVerse(verse);
      setShowBookPicker(false);
      setPendingBook(null);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (verse != null) {
              document
                .getElementById(`verse-${verse}`)
                ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else {
              chapterRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
          });
        });
      }
    },
    []
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      if (!bible) return;
      let nextBook = bookIndex;
      let nextChapter = chapter + direction;
      const current = bible.books[bookIndex];
      if (!current) return;
      const chapters = current.chapters;
      const maxChapter = chapters[chapters.length - 1]?.chapter ?? 1;
      if (nextChapter > maxChapter) {
        nextBook = Math.min(bookIndex + 1, bible.books.length - 1);
        nextChapter = 1;
      } else if (nextChapter < 1) {
        nextBook = Math.max(bookIndex - 1, 0);
        const prev = bible.books[nextBook];
        const prevChapters = prev?.chapters ?? [];
        nextChapter = prevChapters[prevChapters.length - 1]?.chapter ?? 1;
      }
      goTo(nextBook, nextChapter);
    },
    [bible, bookIndex, chapter, goTo]
  );

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!bible || !query.trim()) return;
    void triggerHaptic('light');
    setSearching(true);
    // Yield a frame so the UI can show the searching state on long scans.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setResults(searchBible(bible, query));
        setSearching(false);
      }, 10);
    }
  };

  const switchTranslation = (id: BibleTranslationId) => {
    if (id === translation) return;
    void triggerHaptic('light');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    setTranslation(id);
    setResults(null);
  };

  if (!mounted) {
    return (
      <div className="space-y-4 py-4 pb-32" ref={chapterRef}>
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-wine-600" />
              Holy Bible
            </h1>
            <p className="text-xs text-wine-500 mt-1">Loading...</p>
          </div>
        </header>
        <div className="empty-state">
          <Loader2 className="empty-state-icon animate-spin" />
          <p className="empty-state-title">Loading Bible...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 pb-32" ref={chapterRef}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-wine-600" />
            Holy Bible
          </h1>
          <p className="text-xs text-wine-500 mt-1">
            {bible ? bible.translation : 'Offline — public domain translations'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void triggerHaptic('light');
            setShowTranslationPicker(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-wine-600 text-cream-50 touch-manipulation max-w-[150px]"
          aria-haspopup="listbox"
        >
          <span className="truncate">
            {BIBLE_TRANSLATIONS.find((t) => t.id === translation)?.label ?? 'Bible'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        </button>
      </header>

      {/* Search words or a reference like "John 3:16" */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search words or "John 3:16"'
            className="input-base pl-9"
            inputMode="search"
          />
        </div>
        <button type="submit" disabled={!bible || searching} className="btn-primary h-11 px-4">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
        </button>
      </form>

      {results !== null && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-wine-600 uppercase tracking-wider">
              {results.length === 0
                ? 'No matches'
                : `${results.length} result${results.length === 1 ? '' : 's'}`}
            </h2>
            <button type="button" onClick={() => setResults(null)} className="btn-ghost text-xs flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
          <div className="space-y-2">
            {results.map((r) => (
              <button
                key={`${r.bookIndex}-${r.chapter}-${r.verse}`}
                type="button"
                onClick={() => goTo(r.bookIndex, r.chapter, r.verse)}
                className="card-compact w-full text-left space-y-1 touch-manipulation"
              >
                <p className="text-xs uppercase tracking-wider text-wine-500 font-semibold">
                  {r.bookName} {r.chapter}:{r.verse}
                </p>
                <p className="text-xs text-wine-800 line-clamp-3">{r.text}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Book picker trigger + chapter chips */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void triggerHaptic('light');
            setBookFilter('');
            setPendingBook(null);
            setShowBookPicker(true);
          }}
          className="btn-secondary flex-1 h-11 flex items-center justify-between touch-manipulation"
        >
          <span className="font-semibold">{book?.name ?? '…'}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {book && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Chapters">
          {book.chapters.map((c) => (
            <button
              key={c.chapter}
              type="button"
              onClick={() => goTo(bookIndex, c.chapter)}
              className={`min-w-[40px] h-9 rounded-lg text-xs font-semibold transition flex-shrink-0 touch-manipulation ${
                c.chapter === chapter
                  ? 'bg-wine-600 text-cream-50'
                  : 'bg-cream-200/70 text-wine-700 hover:bg-cream-200'
              }`}
              aria-current={c.chapter === chapter ? 'page' : undefined}
            >
              {c.chapter}
            </button>
          ))}
        </div>
      )}

      {/* Chapter body */}
      {loadError ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="text-sm font-semibold text-wine-700">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((n) => n + 1)}
            className="btn-secondary mt-3 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : !bible || !chapterData ? (
        <div className="empty-state">
          <Loader2 className="empty-state-icon animate-spin" />
          <p className="empty-state-title">Loading Scripture…</p>
        </div>
      ) : (
        <article className="card space-y-3 border-cream-300/60">
          <h2 className="text-base font-bold text-wine-900">
            {book!.name} {chapterData.chapter}
          </h2>
          <div className="space-y-2.5">
            {chapterData.verses.map((v) => (
              <p
                key={v.verse}
                id={`verse-${v.verse}`}
                className={`rounded-lg px-2 -mx-2 py-1 transition-colors duration-700 ${
                  highlightVerse === v.verse ? 'bg-amber-500/20' : ''
                }`}
              >
                <sup className="text-xs font-bold text-wine-600 mr-1 select-none">{v.verse}</sup>
                <span className="text-sm text-wine-800 leading-relaxed">{v.text}</span>
              </p>
            ))}
          </div>
        </article>
      )}

      {/* Prev / next chapter */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!bible || (bookIndex === 0 && chapter <= 1)}
          className="btn-secondary flex-1 h-11 flex items-center justify-center gap-1.5 touch-manipulation disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={
            !bible ||
            (bookIndex === bible.books.length - 1 &&
              chapter >= (book?.chapters[book.chapters.length - 1]?.chapter ?? 1))
          }
          className="btn-secondary flex-1 h-11 flex items-center justify-center gap-1.5 touch-manipulation disabled:opacity-40"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-center text-xs text-wine-500 pt-2">
        Scripture texts: King James Version (public domain) · World English Bible
        (public domain) · Igbo, Yorùbá & Hausa contemporary translations ©
        Biblica, Inc. (CC BY-SA 4.0)
      </p>

      {/* Translation picker sheet */}
      {showTranslationPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Choose a translation">
          <button
            type="button"
            className="absolute inset-0 bg-wine-900/40 backdrop-blur-sm"
            aria-label="Close translation picker"
            onClick={() => setShowTranslationPicker(false)}
          />
          <div className="relative w-full max-w-md max-h-[75dvh] overflow-y-auto bg-cream-50 border-t border-cream-300 rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-cream-50 py-1">
              <h3 className="text-sm font-bold text-wine-900">Choose translation</h3>
              <button type="button" onClick={() => setShowTranslationPicker(false)} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5" role="listbox" aria-label="Bible translations">
              {BIBLE_TRANSLATIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={translation === t.id}
                  onClick={() => {
                    switchTranslation(t.id);
                    setShowTranslationPicker(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition touch-manipulation ${
                    translation === t.id
                      ? 'bg-wine-600 text-cream-50'
                      : 'bg-cream-200/60 text-wine-800 hover:bg-cream-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Book + chapter picker sheet */}
      {showBookPicker && bible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Choose a book and chapter">
          <button
            type="button"
            className="absolute inset-0 bg-wine-900/40 backdrop-blur-sm"
            aria-label="Close book picker"
            onClick={() => setShowBookPicker(false)}
          />
          <div className="relative w-full max-w-md max-h-[75dvh] overflow-y-auto bg-cream-50 border-t border-cream-300 rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-cream-50 py-1">
              <h3 className="text-sm font-bold text-wine-900">
                {pendingBookData ? `${pendingBookData.name} — choose chapter` : 'Books of the Bible'}
              </h3>
              <button type="button" onClick={() => setShowBookPicker(false)} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pendingBookData ? (
              <>
                <button
                  type="button"
                  onClick={() => setPendingBook(null)}
                  className="btn-ghost text-xs mb-3 inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> All books
                </button>
                <div className="grid grid-cols-5 gap-1.5">
                  {pendingBookData.chapters.map((c) => (
                    <button
                      key={c.chapter}
                      type="button"
                      onClick={() => goTo(pendingBook!, c.chapter)}
                      className={`h-11 rounded-xl text-sm font-bold transition touch-manipulation ${
                        pendingBook === bookIndex && c.chapter === chapter
                          ? 'bg-wine-600 text-cream-50'
                          : 'bg-cream-200/60 text-wine-800 hover:bg-cream-200'
                      }`}
                    >
                      {c.chapter}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-500" />
                  <input
                    value={bookFilter}
                    onChange={(e) => setBookFilter(e.target.value)}
                    placeholder="Type a book… e.g. John, Psalm, Genesis"
                    className="input-base pl-9"
                    inputMode="search"
                    aria-label="Find a book"
                  />
                </div>
                {otBooks.length + ntBooks.length === 0 ? (
                  <p className="text-center text-xs text-wine-500 py-6">
                    No book matches “{bookFilter.trim()}”.
                  </p>
                ) : (
                  <>
                    {otBooks.length > 0 && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-wider text-wine-500 mb-1.5">
                          Old Testament
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          {otBooks.map((b) => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => {
                                void triggerHaptic('light');
                                setPendingBook(b.index);
                              }}
                              className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition touch-manipulation ${
                                b.index === bookIndex
                                  ? 'bg-wine-600 text-cream-50'
                                  : 'bg-cream-200/60 text-wine-800 hover:bg-cream-200'
                              }`}
                            >
                              {b.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {ntBooks.length > 0 && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-wider text-wine-500 mb-1.5">
                          New Testament
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ntBooks.map((b) => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => {
                                void triggerHaptic('light');
                                setPendingBook(b.index);
                              }}
                              className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition touch-manipulation ${
                                b.index === bookIndex
                                  ? 'bg-wine-600 text-cream-50'
                                  : 'bg-cream-200/60 text-wine-800 hover:bg-cream-200'
                              }`}
                            >
                              {b.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}