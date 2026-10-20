import Link from 'next/link'
import { Mail, Shield } from 'lucide-react'

export default function LegalFooter() {
  return (
    <footer className="mt-12 border-t border-cream-300 pt-6 pb-8 text-center">
      <p className="text-xs text-wine-500">
        Glorious Assembly Ministries International
      </p>
      <nav className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold" aria-label="Legal">
        <Link href="/privacy" className="inline-flex items-center gap-1 text-wine-700 hover:text-wine-900">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-wine-700 hover:text-wine-900">
          Terms of Service
        </Link>
        <a href="mailto:info@gam.church" className="inline-flex items-center gap-1 text-wine-700 hover:text-wine-900">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Contact
        </a>
      </nav>
    </footer>
  )
}
