import Link from 'next/link'
import { ChevronRight, BookOpen } from 'lucide-react'
import Image from 'next/image'
import { StructuredData } from '@/components/seo/structured-data'

export default function HomePage() {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center text-center gap-8 py-16">
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Church',
          name: 'Glorious Assembly Ministries International',
          description: 'Community, Word, and Spiritual Growth — All in One Vault',
        }}
      />
      <div className="space-y-4">
        <Image
          src="/icon-192.png"
          alt="GAM Church logo"
          width={80}
          height={80}
          className="mx-auto rounded-3xl border border-cream-300"
          unoptimized
        />
        <div>
          <h1 className="text-2xl font-bold text-wine-900">GAM Church</h1>
          <p className="text-sm text-wine-500 mt-2">
            Community, Word, and Spiritual Growth — All in One Vault
          </p>
        </div>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <Link
          href="/bible"
          className="btn-secondary h-12 w-full px-8 flex items-center justify-center gap-2 touch-manipulation"
          aria-label="Bible reading"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Bible Reading
        </Link>

        <Link
          href="/login"
          className="btn-primary h-12 w-full px-8 flex items-center justify-center gap-2 touch-manipulation"
        >
          Continue
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
