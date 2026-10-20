export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

export interface BiblePassageResponse {
  passages: BibleVerse[];
  reference: string;
}

export interface DevotionalContent {
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  prayer?: string;
  application_question?: string;
  source: 'auto_esv' | 'auto_net' | 'manual';
  external_id?: string;
}

// NET Bible API (keyless, CORS-friendly) — works from the native webview
// and from static exports. ESV was removed: it needs a secret key that a
// client-only build cannot ship.
const NET_API_BASE = 'https://labs.bible.org/api';

/**
 * Generate a date-based passage reference for daily devotional
 */
export function getDailyPassageReference(date: Date = new Date()): string {
  const passages = [
    'John 3:16-17',
    'Psalm 23:1-6',
    'Philippians 4:6-7',
    'Romans 8:28-30',
    'Jeremiah 29:11-13',
    'Isaiah 40:28-31',
    'Matthew 6:25-34',
    'Proverbs 3:5-6',
    'Isaiah 53:4-6',
    '1 Corinthians 13:4-8',
    'Ephesians 2:8-10',
    'Hebrews 11:1-3',
    'James 1:2-4',
    '1 Peter 5:6-7',
    'Colossians 3:12-14',
    'Psalm 46:1-3',
    '2 Corinthians 12:9-10',
    'Galatians 5:22-23',
    'Joshua 1:8-9',
    'Psalm 119:105-106',
    'John 15:5-8',
    'Romans 12:1-2',
    'Lamentations 3:22-23',
    '1 John 4:7-10',
    'Psalm 139:13-16',
    '2 Timothy 3:16-17',
    'John 14:27',
    'Isaiah 26:3-4',
    'Psalm 37:4-5',
    'Micah 6:8',
    'Revelation 21:3-5',
  ] as const;

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return passages[dayOfYear % passages.length] as string;
}

/**
 * Fetch passage from NET Bible API
 */
export async function fetchNETPassage(reference: string): Promise<BiblePassageResponse | null> {
  try {
    const params = new URLSearchParams({
      passage: reference,
      type: 'json',
      formating: 'plain',
    });

    const response = await fetch(`${NET_API_BASE}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || !data.length) return null;

    const verse = data[0];
    const bookname = verse.bookname ?? '';
    const chapter = verse.chapter ?? '';
    const verseNum = verse.verse ?? '';
    const text = verse.text ?? '';
    return {
      reference: `${bookname} ${chapter}:${verseNum}`,
      passages: [{
        reference: `${bookname} ${chapter}:${verseNum}`,
        text: text.trim(),
        translation: 'NET',
      }],
    };
  } catch (error) {
    console.error('[NET Bible API] Fetch error:', error);
    return null;
  }
}

/**
 * Generate reflection using template approach
 */
export function generateReflection(passage: BibleVerse): string {
  const text = passage.text;
  const ref = passage.reference;
  const templates = [
    `Today's passage from ${ref} reminds us that ${passage.text.slice(0, 100)}... God's Word is living and active, piercing to the division of soul and spirit. As you meditate on this truth today, consider how it applies to your current circumstances.`,
    `In ${ref}, we read: "${text.slice(0, 120)}..." This promise stands firm across all generations. Whatever you're facing today, remember that the God who spoke these words is the same yesterday, today, and forever.`,
    `The Scripture in ${ref} declares: "${text.slice(0, 100)}..." Let this truth anchor your heart today. When circumstances shift, God's Word remains unshakeable.`,
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return templates[dayOfYear % templates.length] as string;
}

/**
 * Generate a closing prayer based on the passage
 */
export function generatePrayer(passage: BibleVerse): string {
  const ref = passage.reference;
  const prayers = [
    `Heavenly Father, thank You for the truth of ${ref}. Help us to not only hear Your Word but to live it out today. Give us the grace to trust Your promises and walk in obedience. In Jesus' name, Amen.`,
    `Lord, as we reflect on ${ref}, open our hearts to receive Your truth. May this Scripture transform our thinking and guide our steps today. Strengthen our faith and deepen our love for You. Amen.`,
    `Gracious God, thank You for speaking to us through ${ref}. Plant this Word deep in our hearts that it may bear fruit in our lives. Give us courage to apply it and wisdom to share it. In Christ's name, Amen.`,
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return prayers[dayOfYear % prayers.length] as string;
}

/**
 * Generate an application question
 */
export function generateApplicationQuestion(passage: BibleVerse): string {
  const ref = passage.reference;
  const questions = [
    `How does ${ref} challenge your current perspective on a situation you're facing?`,
    `What specific step of obedience is God calling you to take in light of ${ref}?`,
    `How can you share the truth of ${ref} with someone who needs encouragement today?`,
    `What area of your life needs to be surrendered to the truth found in ${ref}?`,
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return questions[dayOfYear % questions.length] as string;
}

/**
 * Main function to fetch or generate today's devotional content
 */
export async function fetchTodaysDevotional(date: Date = new Date()): Promise<{
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  prayer?: string;
  application_question?: string;
  source: 'auto_esv' | 'auto_net' | 'manual';
  external_id?: string;
}> {
  const reference = getDailyPassageReference(date);

  // NET API is keyless and CORS-friendly — safe for client-only builds.
  let passageData: BiblePassageResponse | null = await fetchNETPassage(reference);
  const source: 'auto_esv' | 'auto_net' = 'auto_net';

  // Fallback: generate from reference if both APIs fail
  if (!passageData) {
    passageData = {
      reference,
      passages: [{
        reference,
        text: `[Passage: ${reference} - Please add your Bible API keys to enable auto-fetch]`,
        translation: 'MANUAL',
      }],
    };
  }

  // Safe access to passage
  const passage = passageData?.passages?.[0] ?? {
    reference: reference,
    text: `[Passage: ${reference} - API unavailable]`,
    translation: 'MANUAL',
  };

  const title = `Daily Bread — ${date.toISOString().split('T')[0]}`;

  return {
    title,
    scripture_reference: passage.reference,
    scripture_text: passage.text,
    reflection: generateReflection(passage),
    prayer: generatePrayer(passage),
    application_question: generateApplicationQuestion(passage),
    source,
    external_id: `${source}:${reference}:${date.toISOString().split('T')[0]}`,
  };
}