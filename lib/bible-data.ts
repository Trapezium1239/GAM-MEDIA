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

export type BibleTranslationId =
  | 'kjv' | 'web' | 'igbo' | 'yoruba' | 'hausa'
  | 'acv' | 'akjv' | 'asv' | 'anderson' | 'bbe' | 'bsb' | 'cpdv' | 'drc' | 'darby'
  | 'geneva1599' | 'haweis' | 'jps' | 'jubilee2000' | 'kjvpce' | 'leb' | 'litv'
  | 'mkjv' | 'nheb' | 'nhebje' | 'nhebme' | 'noyes' | 'oeb' | 'oebcth' | 'rlt'
  | 'rnkjv' | 'rwebster' | 'webster' | 'ylt';

export const BIBLE_TRANSLATIONS: { id: BibleTranslationId; label: string; file: string }[] = [
  // English
  { id: 'kjv', label: 'KJV — King James Version', file: '/bible/kjv.json' },
  { id: 'web', label: 'WEB — World English Bible', file: '/bible/web.json' },
  { id: 'asv', label: 'ASV — American Standard Version', file: '/bible/asv.json' },
  { id: 'bbe', label: 'BBE — Bible in Basic English', file: '/bible/bbe.json' },
  { id: 'bsb', label: 'BSB — Berean Standard Bible', file: '/bible/bsb.json' },
  { id: 'ylt', label: 'YLT — Young’s Literal Translation', file: '/bible/ylt.json' },
  { id: 'darby', label: 'Darby Bible', file: '/bible/darby.json' },
  { id: 'drc', label: 'DRC — Douay-Rheims (Challoner)', file: '/bible/drc.json' },
  { id: 'cpdv', label: 'CPDV — Catholic Public Domain Version', file: '/bible/cpdv.json' },
  { id: 'geneva1599', label: 'Geneva Bible 1599', file: '/bible/geneva1599.json' },
  { id: 'akjv', label: 'AKJV — American King James Version', file: '/bible/akjv.json' },
  { id: 'kjvpce', label: 'KJV Pure Cambridge Edition', file: '/bible/kjvpce.json' },
  { id: 'leb', label: 'LEB — Lexham English Bible', file: '/bible/leb.json' },
  { id: 'litv', label: 'LITV — Literal Translation', file: '/bible/litv.json' },
  { id: 'mkjv', label: 'MKJV — Modern King James Version', file: '/bible/mkjv.json' },
  { id: 'acv', label: 'ACV — A Conservative Version', file: '/bible/acv.json' },
  { id: 'anderson', label: 'Anderson NT (1864)', file: '/bible/anderson.json' },
  { id: 'haweis', label: 'Haweis NT', file: '/bible/haweis.json' },
  { id: 'jps', label: 'JPS — Jewish Publication Society', file: '/bible/jps.json' },
  { id: 'jubilee2000', label: 'Jubilee 2000', file: '/bible/jubilee2000.json' },
  { id: 'nheb', label: 'NHEB — New Heart English Bible', file: '/bible/nheb.json' },
  { id: 'nhebje', label: 'NHEBJE — Jehovah Edition', file: '/bible/nhebje.json' },
  { id: 'nhebme', label: 'NHEBME — Messianic Edition', file: '/bible/nhebme.json' },
  { id: 'noyes', label: 'Noyes Translation', file: '/bible/noyes.json' },
  { id: 'oeb', label: 'OEB — Open English Bible', file: '/bible/oeb.json' },
  { id: 'oebcth', label: 'OEB (Commonwealth spelling)', file: '/bible/oebcth.json' },
  { id: 'rlt', label: 'RLT — Revised Literal Translation', file: '/bible/rlt.json' },
  { id: 'rnkjv', label: 'RNKJV — Restored Name KJV', file: '/bible/rnkjv.json' },
  { id: 'rwebster', label: 'Revised Webster Bible', file: '/bible/rwebster.json' },
  { id: 'webster', label: 'Webster Bible', file: '/bible/webster.json' },
  // Nigerian languages
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
