'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Headphones, Search, X } from 'lucide-react';
import { PlaySermonButton } from '@/components/audio/play-button';

interface YorubaChapter { chapter: number; url: string; }
interface YorubaBook { index: number; name: string; yorubaName: string; chapters: YorubaChapter[]; }
interface YorubaManifest { language: string; label: string; books: YorubaBook[]; }
interface ChapterItem { id: string; bookIndex: number; bookName: string; yorubaName: string; chapter: number; url: string; }

export default function YorubaBiblePage() {
  const [manifest, setManifest] = useState<YorubaManifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch('/yoruba-bible.json')
      .then((res) => { if (!res.ok) throw new Error('Could not load Yoruba Audio Bible manifest'); return res.json() as Promise<YorubaManifest>; })
      .then((data) => { if (!cancelled) setManifest(data); })
      .catch((err) => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const allChapters = useMemo<ChapterItem[]>(() => {
    if (!manifest) return [];
    return manifest.books.flatMap((book) => book.chapters.map((c) => ({ id: `yoruba-${book.index}-${c.chapter}`, bookIndex: book.index, bookName: book.name, yorubaName: book.yorubaName, chapter: c.chapter, url: c.url })));
  }, [manifest]);

  const needle = query.trim().toLowerCase();
  const filteredChapters = useMemo(() => {
    if (!needle) return null;
    return allChapters.filter((item) => `${item.bookName} ${item.yorubaName} chapter ${item.chapter}`.toLowerCase().includes(needle));
  }, [allChapters, needle]);

  const selectedBookData = manifest?.books.find((b) => b.index === selectedBook) ?? null;

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Headphones className="w-6 h-6 text-wine-600" aria-hidden="true" />
          Yoruba Audio Bible
        </h1>
        <p className="text-xs text-wine-500 mt-1">{manifest ? `${manifest.books.length} books - ${allChapters.length} chapters` : 'Loading...'}</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-400" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search book or chapter... e.g. Genesis 1" className="input-base pl-10 pr-10" aria-label="Search Yoruba Audio Bible" />
        {query && (<button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-400 hover:text-wine-700" aria-label="Clear search"><X className="w-4 h-4" aria-hidden="true" /></button>)}
      </div>

      {loading && (<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="card h-16 animate-pulse bg-cream-200/60" />))}</div>)}

      {loadError && (<div className="card text-center py-8"><p className="text-sm text-wine-700">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-xl bg-wine-600 text-cream-50 text-sm font-semibold">Retry</button></div>)}

      {!loading && !loadError && manifest && (
        <>
          {filteredChapters ? (
            <section className="space-y-2">
              <p className="text-xs text-wine-500">{filteredChapters.length} {filteredChapters.length === 1 ? 'result' : 'results'}</p>
              {filteredChapters.length === 0 ? (<div className="card text-center py-10"><p className="text-sm text-wine-700">No matching chapter found.</p></div>) : (
                <ul className="space-y-2">{filteredChapters.map((item) => (<li key={item.id}><PlaySermonButton track={{ id: item.id, title: `${item.bookName} ${item.chapter}`, artist: `${item.yorubaName} - Yoruba Audio Bible`, audioUrl: item.url }} /><a href={item.url} download className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-wine-700 hover:text-wine-900"><Download className="w-3.5 h-3.5" aria-hidden="true" />Download file</a></li>))}</ul>
              )}
            </section>
          ) : selectedBookData ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-wine-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-wine-600" aria-hidden="true" />{selectedBookData.name}<span className="text-sm font-normal text-wine-500">({selectedBookData.yorubaName})</span></h2>
                <button type="button" onClick={() => setSelectedBook(null)} className="text-xs font-semibold text-wine-700 hover:text-wine-900">All books</button>
              </div>
              <ul className="space-y-2">{selectedBookData.chapters.map((c) => { const item: ChapterItem = { id: `yoruba-${selectedBookData.index}-${c.chapter}`, bookIndex: selectedBookData.index, bookName: selectedBookData.name, yorubaName: selectedBookData.yorubaName, chapter: c.chapter, url: c.url }; return (<li key={item.id}><PlaySermonButton track={{ id: item.id, title: `${item.bookName} ${item.chapter}`, artist: `${item.yorubaName} - Yoruba Audio Bible`, audioUrl: item.url }} /><a href={item.url} download className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-wine-700 hover:text-wine-900"><Download className="w-3.5 h-3.5" aria-hidden="true" />Download file</a></li>); })}</ul>
            </section>
          ) : (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-wine-500 mb-3">Books</h2>
              <div className="grid grid-cols-2 gap-2">{manifest.books.map((book) => (<button key={book.index} type="button" onClick={() => setSelectedBook(book.index)} className="card-interactive text-left p-3"><p className="text-sm font-semibold text-wine-900 truncate">{book.name}</p><p className="text-xs text-wine-500 truncate">{book.yorubaName}</p><p className="text-xs text-wine-400 mt-1">{book.chapters.length} ch.</p></button>))}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

