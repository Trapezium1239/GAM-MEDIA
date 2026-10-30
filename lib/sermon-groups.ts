/**
 * Grouping logic for the sermon library.
 *
 * Two of the three dimensions are derived from the title, because the data has
 * no structured series/preacher columns:
 *
 *  - `month`    uses `date`, which is reliable (3,772 of 3,972 titles carry a
 *               parseable date and the date column has been repaired from them).
 *  - `service`  is the service/series header at the start of the title
 *               ("TUESDAY BIBLE STUDY (HQ)", "GLORIOUS SUNDAY SERVICE (HQ.)"…).
 *  - `preacher` is the `preacher` column, which the Telegram import filled with
 *               the *sender* of each recording rather than the minister. Names
 *               that are really segment labels ("MESSAGE", "SNR PST MINISTRATION",
 *               "DAY 1") are folded into "Unspecified" instead of becoming junk
 *               groups. The UI labels this honestly.
 */

export type GroupMode = 'none' | 'month' | 'service' | 'preacher';

export interface GroupableSermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
}

export interface SermonGroup<T extends GroupableSermon> {
  key: string;
  label: string;
  /** Optional extra context shown next to the count. */
  detail?: string;
  sermons: T[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Clean the decorations the Telegram import left on some titles: an "AUDIO:"
 * prefix, a "[ Voice message : … ]" wrapper, and letter-O year typos ("2O24").
 */
function normalizeTitle(title: string): string {
  return (title || '')
    .replace(/^AUDIO[:\s]+/i, '')
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/(\d)[oO](\d)/g, (_m, a: string, b: string) => `${a}0${b}`)
    .trim();
}

/** Strip a leading service date from a title ("29TH FEBRUARY 2024: …"). */
function stripLeadingDate(title: string): string {
  return normalizeTitle(title)
    .replace(/^\d{1,2}\s*(?:ST|ND|RD|TH)?\s+(?:OF\s+)?[A-Z]{3,9}\s*,?\s*\d{4}\s*[:\-–]?\s*/i, '')
    .replace(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*[:\-–]?\s*/, '')
    .replace(/^[.\-–—:;\s]+/, '')
    .trim();
}

/** The part of the title before the first " - " / ":" separator. */
function serviceHeader(title: string): string {
  const rest = stripLeadingDate(title);
  const first = rest.split(/\s+[-–—]\s*|[-–—]\s+|:\s+/)[0] || '';
  return first
    .replace(/\(\s*HQ\.?\s*\)|\[\s*HQ\.?\s*\]|\{\s*HQ\.?\s*\}/gi, '')
    .replace(/[.\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SERVICE_RULES: Array<[RegExp, string]> = [
  // Recurring weekly services — the bulk of the library.
  [/\bTUESDAY\b.*\bBIB|\bBIBLE\s*STUDY\b|\bBIBE\b|\bBIBLESTUDY\b/, 'Tuesday Bible Study'],
  [/\bTHURSDAY\b.*\bREVIV|\bREVIVAL\s*HOUR\b|\bREVIVIAL\b/, 'Thursday Revival Hour'],
  [/\bREVIVAL\b/, 'Revival Service'],
  [/\bPRAISE\s*(NIGHT|EVENING)\b/, 'Praise Night'],
  [/\bSUNDAY\b/, 'Sunday Service'],
  [/\bWEDNESDAY\b/, 'Wednesday Service'],
  [/\bFRIDAY\b/, 'Friday Service'],
  [/\bSATURDAY\b/, 'Saturday Service'],
  [/\bTUESDAY\b/, 'Tuesday Service'],
  [/\bCHOIR\b/, 'Choir'],
  // Named annual / one-off programmes.
  [/\bWORKERS\b/, "Workers' Programme"],
  [/\bSNR\.?\s*PST'?S?\s+MEETING\b/, "Senior Pastor's Meetings"],
  [/\bWORTHY\s+ALBUM\b/, 'Worthy Album Launch'],
  [/\bEARLY\s+MORNING\b/, 'Early Morning Glory'],
  [/\bNEW\s+YEAR\b/, 'New Year Service'],
  [/\bRETREAT\b/, 'Prayer Retreat'],
  [/\bCROSSOVER\b/, 'Crossover Service'],
  [/\bPROPHETIC\b/, 'Prophetic Service'],
  [/\bCONFERENCE\b/, 'Conference'],
  [/\bCRUSADE\b/, 'Crusade'],
  [/\bDRAMA\b/, 'Drama Night'],
  [/\bBEULAH\b/, 'Beulah Voices Anniversary'],
  [/\bABRAHAMIC\b/, 'Abrahamic Covenant Service'],
  [/\bEKO\s+BIBELI\b/, 'Eko Bibeli (Yoruba Bible Study)'],
  [/\bCHRISTMAS\b/, 'Christmas Service'],
  [/\bJUBILEE\b/, 'Golden Jubilee'],
  [/\bTHANKSGIVING\b|\bTHANKSGIVNG\b/, 'Thanksgiving Service'],
  [/\bWEDDING\b/, 'Wedding'],
  [/\bYES\s+OF\s+GOD\b/, 'Yes of God'],
  [/\bREBIRTH\b/, 'Rebirth'],
  [/\bSHILOH\b/, 'Shiloh'],
  [/\bPERFECT\s+VICTORY\b/, 'Perfect Victory'],
  [/\bCHILDREN/, "Children's Day"],
  [/\bYOUTH\b/, 'Youth Service'],
  [/\bBIRTHDAY\b/, 'Birthday Celebration'],
  [/\bMARVO\b/, 'Marvo Day'],
  [/\bHOLY\s+GHOST\s+NIGHT\b/, 'Holy Ghost Night'],
  [/\bROUND\s*UP\b|\bISEYIN\b/, 'Branch Round-Up'],
  [/\bMESSAGE\s*&\s*PRAYER\b/, 'Message & Prayer'],
];

/** Human label for the series/service a sermon belongs to. */
export function serviceGroupLabel(title: string): string {
  const header = serviceHeader(title).toUpperCase();
  if (!header) return 'Other services';
  for (const [pattern, label] of SERVICE_RULES) {
    if (pattern.test(header)) return label;
  }
  // Announcement-only rows (Zoom IDs, "Join us live on Facebook…") are not services.
  if (/HTTP|WWW\.|ZOOM\s+MEETING|JOIN\s+US\s+LIVE|TELEGRAM|PASSCODE/.test(header)) return 'Other services';
  // No rule matched: keep the (cleaned) header so nothing is silently hidden,
  // but cap the length so a stray sentence cannot blow up the group header.
  const cleaned = header
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 42 ? `${cleaned.slice(0, 42).trim()}…` : cleaned || 'Other services';
}

/**
 * Values that describe a part of the service rather than a person. The import
 * stored these in `preacher`, so they must not become "preacher" groups.
 */
const SEGMENT_LABEL = new RegExp(
  [
    '^MESSAGE',
    '^SNR\\.?\\s*PST',
    '^MINISTRATION',
    '^ANNOUNCEMENT',
    '^PRAYERS?\\s+ON',
    '^DAY\\s+\\d',
    '^REVIEW\\s+OF',
    '^SPECIAL',
    '^REASONS\\b',
    '^SONG\\s+WITH',
    '^OUR\\s+CHILDREN',
    '^AFTER\\s+THIS\\s+WORLD',
    '^REACHING\\s+THE',
    '^TAKING\\s+RESPONSIBILITY',
    '^BIBLE\\s+STUDY',
    '^CHOIR',
    '^(GLORIOUS\\s+)?(SUNDAY|REDEMPTIVE|FAMILY|WEDDING|THANKSGIVING|THANKSGIVNG)\\b',
    '^(TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)',
    '^(EDA\\s+ONIYO|SHILOH|PERFECT\\s+VICTORY|MARVO|REBIRTH|YES\\s+OF\\s+GOD)',
    '^FRIDAY\\s+PRAISE',
    '^70TH\\s+BIRTHDAY',
    '^FAMILY\\s+SUNDAY',
  ].join('|'),
  'i'
);

/** Sender/uploader labels that are real names, folded to one spelling each. */
const PREACHER_ALIASES: Array<[RegExp, string]> = [
  [/FUNKE\s+ADARAMOLA/i, 'Sis Funke Adaramola'],
  [/GLORIOUS\s+NEWS/i, 'Glorious News'],
  [/ADEBUKOLA/i, 'Pst Adebukola'],
  [/SIMILOLUWA/i, 'Similoluwa'],
  [/ESTHER\s+ADELEKE/i, 'Sis Esther Adeleke'],
  [/DANIEL\s+PETER|MAYOWA\s+DANIEL\s+PETER/i, 'Daniel Peter'],
  [/DANIEL\s+HENRY/i, 'Daniel Henry'],
  [/MAYOWA/i, 'Bro Mayowa'],
  [/MINISTRY\s+WORD/i, 'Ministry Word'],
  [/^A\.?\s*O\.?$/i, 'A. O.'],
];

/** Human label for the recording's recorded preacher/sender value. */
export function preacherGroupLabel(raw: string): string {
  const value = (raw || '').replace(/\s+/g, ' ').trim();
  if (!value) return 'Unspecified';
  for (const [pattern, label] of PREACHER_ALIASES) {
    if (pattern.test(value)) return label;
  }
  if (/^GAM$/i.test(value)) return 'GAM (ministry)';
  if (SEGMENT_LABEL.test(value)) return 'Unspecified';
  // Everything left is a one-off caption or an unknown sender: keeping it
  // would create dozens of single-sermon groups, so fold it in.
  return 'Unspecified';
}

/** "YYYY-MM" for a valid date, or null. */
function monthKey(date: string): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(date || '');
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

/**
 * Group sermons for display. Groups are ordered newest-first for `month` and
 * by size for `service`/`preacher`; sermons inside a group keep their incoming
 * order (the caller passes them already sorted by date, newest first).
 */
export function groupSermons<T extends GroupableSermon>(sermons: T[], mode: GroupMode): SermonGroup<T>[] {
  if (mode === 'none') return [];

  const buckets = new Map<string, SermonGroup<T>>();

  for (const sermon of sermons) {
    let key: string;
    let label: string;
    let detail: string | undefined;

    if (mode === 'month') {
      const k = monthKey(sermon.date);
      key = k ?? 'undated';
      label = k ? monthLabel(k) : 'Undated';
      detail = k ? undefined : 'No date in title or metadata';
    } else if (mode === 'service') {
      label = serviceGroupLabel(sermon.title);
      key = label.toLowerCase();
    } else {
      label = preacherGroupLabel(sermon.preacher);
      key = label.toLowerCase();
    }

    const existing = buckets.get(key);
    if (existing) {
      existing.sermons.push(sermon);
    } else {
      buckets.set(key, { key, label, detail, sermons: [sermon] });
    }
  }

  const groups = [...buckets.values()];
  if (mode === 'month') {
    groups.sort((a, b) => (a.key === 'undated' ? 1 : b.key === 'undated' ? -1 : b.key.localeCompare(a.key)));
  } else {
    groups.sort((a, b) => b.sermons.length - a.sermons.length || a.label.localeCompare(b.label));
  }
  return groups;
}
