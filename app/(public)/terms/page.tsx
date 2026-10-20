import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for the GAM Church app.',
}

export default function TermsPage() {
  return (
    <div className="py-10 space-y-6">
      <header className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 text-wine-700 font-semibold">
          <Shield className="h-5 w-5" aria-hidden="true" />
          GAM App
        </Link>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center justify-center gap-2">
          <FileText className="h-6 w-6 text-wine-600" aria-hidden="true" />
          Terms of Service
        </h1>
        <p className="text-xs text-wine-500">Last updated: January 2026</p>
      </header>

      <article className="card space-y-4 text-sm text-wine-800 leading-relaxed">
        <p>
          By using the GAM Church app you agree to use it for worship, learning, and church community
          purposes. Do not misuse accounts, copy audio without permission, or attempt to access
          leadership tools you have not been granted.
        </p>
        <p>
          Content is provided for spiritual growth. Sermons, music, and devotionals remain the
          property of Glorious Assembly Ministries International unless otherwise noted.
        </p>
        <p>
          Questions:{' '}
          <a href="mailto:info@gam.church" className="font-semibold text-wine-700 underline">
            info@gam.church
          </a>
        </p>
      </article>
    </div>
  )
}
