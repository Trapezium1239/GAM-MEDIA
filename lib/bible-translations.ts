export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  copyright: 'public_domain' | 'esv' | 'net';
  year: number;
  description: string;
}

export const PUBLIC_DOMAIN_TRANSLATIONS: BibleTranslation[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    copyright: 'public_domain',
    year: 1769,
    description: 'Classic Authorized Version (1769 Blayney edition). Public domain worldwide.',
  },
  {
    id: 'asv',
    name: 'American Standard Version',
    abbreviation: 'ASV',
    copyright: 'public_domain',
    year: 1901,
    description: 'American revision of the KJV. Highly literal. Public domain.',
  },
  {
    id: 'web',
    name: 'World English Bible',
    abbreviation: 'WEB',
    copyright: 'public_domain',
    year: 2000,
    description: 'Modern English update of ASV. Public domain, no copyright restrictions.',
  },
  {
    id: 'ylt',
    name: 'Young\'s Literal Translation',
    abbreviation: 'YLT',
    copyright: 'public_domain',
    year: 1898,
    description: 'Ultra-literal translation by Robert Young. Public domain.',
  },
];

export const COPYRIGHTED_TRANSLATIONS = {
  esv: {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    copyright: 'esv' as const,
    year: 2001,
    requiresKey: true,
  },
  net: {
    id: 'net',
    name: 'New English Translation',
    abbreviation: 'NET',
    copyright: 'net' as const,
    year: 2005,
    requiresKey: true,
  },
} as const;

export type TranslationId = 'kjv' | 'asv' | 'web' | 'ylt' | 'esv' | 'net';

export function getAvailableTranslations(): { id: TranslationId; name: string; abbreviation: string; isPublicDomain: boolean; requiresKey: boolean }[] {
  return [
    ...PUBLIC_DOMAIN_TRANSLATIONS.map(t => ({
      id: t.id as TranslationId,
      name: t.name,
      abbreviation: t.abbreviation,
      isPublicDomain: true,
      requiresKey: false,
    })),
    { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', isPublicDomain: false, requiresKey: true },
    { id: 'net', name: 'New English Translation', abbreviation: 'NET', isPublicDomain: false, requiresKey: true },
  ];
}