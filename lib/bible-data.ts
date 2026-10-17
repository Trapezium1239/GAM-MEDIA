// Bundled offline Bible data (public-domain translations shipped in the
// app binary under /bible/*.json — format: scrollmapper/bible_databases
// 2025 schema). Loaded lazily at runtime; cached per translation.

export interface BibleVerseJson {
  verse: number;
  text: string;
}

export interface BibleChapterJson {
  chapter: number;
  verses: BibleVerseJson[];
}

export interface BibleBookJson {
  name: string;
  chapters: BibleChapterJson[];
}

export interface BibleJson {
  translation: string;
  books: BibleBookJson[];
}

export type BibleTranslationId = 'kjv' | 'web' | 'igbo' | 'yoruba' | 'hausa';

export const BIBLE_TRANSLATIONS: { id: BibleTranslationId; label: string; file: string }[] = [
  { id: 'kjv', label: 'KJV', file: '/bible/kjv.json' },
  { id: 'web', label: 'WEB', file: '/bible/web.json' },
  { id: 'igbo', label: 'Igbo', file: '/bible/igbo.json' },
  { id: 'yoruba', label: 'Yorùbá', file: '/bible/yoruba.json' },
  { id: 'hausa', label: 'Hausa', file: '/bible/hausa.json' },
];

const cache = new Map<BibleTranslationId, Promise<BibleJson>>();

export function loadBible(id: BibleTranslationId): Promise<BibleJson> {
  let pending = cache.get(id);
  if (!pending) {
    const entry = BIBLE_TRANSLATIONS.find((t) => t.id === id)!;
    pending = (async () => {
      const res = await fetch(entry.file);
      if (!res.ok) throw new Error(`Could not load ${entry.label} text`);
      const data = (await res.json()) as BibleJson;
      if (!data?.books?.length) throw new Error(`${entry.label} text is empty`);
      return data;
    })();
    cache.set(id, pending);
  }
  return pending;
}

export interface BibleSearchResult {
  bookName: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
}

// Matches "John 3:16", "1 John 1:9", "II Timothy 1:7", "Psalm 23", …
// Group 1: optional arabic (1-3) or roman (i–iii) book prefix.
const REFERENCE_RE = /^([1-3]|i{1,3})?\s*([a-z]+\.?)\s+(\d+)(?::(\d+))?$/i;

// Normalizes book names for matching. Handles both arabic ("1 John")
// and roman ("I John") numeral prefixes — the bundled KJV uses romans.
const NUMERAL_TO_ROMAN: Record<string, string> = { '1': 'i', '2': 'ii', '3': 'iii' };

function normalizeBook(part: string): string {
  const collapsed = part.toLowerCase().replace(/[.\s]/g, '');
  return collapsed.replace(/^([123])/, (digit) => NUMERAL_TO_ROMAN[digit] ?? digit);
}

// Full-text or reference search ("John 3:16", "Psalm 23", or any phrase).
export function searchBible(
  bible: BibleJson,
  rawQuery: string,
  limit = 80
): BibleSearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  // Reference search: "Book Ch[:Vs]"
  const match = query.match(REFERENCE_RE);
  const [, numeral, bookRaw, chapterRaw, verseRaw] = match ?? [];
  if (bookRaw && chapterRaw) {
    const bookPart = normalizeBook(`${numeral ?? ''}${bookRaw}`);
    const bookIndex = bible.books.findIndex(
      (b) => normalizeBook(b.name).startsWith(bookPart)
    );
    const book = bookIndex >= 0 ? bible.books[bookIndex] : undefined;
    if (book) {
      const chapterNo = parseInt(chapterRaw, 10);
      const chapter = book.chapters.find((c) => c.chapter === chapterNo);
      if (chapter) {
        const verseNo = verseRaw ? parseInt(verseRaw, 10) : null;
        const verses = verseNo
          ? chapter.verses.filter((v) => v.verse === verseNo)
          : chapter.verses;
        return verses.map((v) => ({
          bookName: book.name,
          bookIndex,
          chapter: chapter.chapter,
          verse: v.verse,
          text: v.text,
        }));
      }
    }
  }

  // Free-text search across the loaded translation.
  const q = query.toLowerCase();
  const results: BibleSearchResult[] = [];
  for (let bookIndex = 0; bookIndex < bible.books.length; bookIndex++) {
    const book = bible.books[bookIndex];
    if (!book) continue;
    for (const chapter of book.chapters) {
      for (const v of chapter.verses) {
        if (v.text.toLowerCase().includes(q)) {
          results.push({
            bookName: book.name,
            bookIndex,
            chapter: chapter.chapter,
            verse: v.verse,
            text: v.text,
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}
