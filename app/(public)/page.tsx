import Link from 'next/link'
import { ChevronRight, BookOpen, Music, Calendar, Heart, Users, Shield, Sparkles, Cross, Book, Home } from 'lucide-react'
import Image from 'next/image'
import { StructuredData } from '@/components/seo/structured-data'

const features = [
  { href: '/devotional', icon: Cross, title: "Daily Word", desc: "Fresh devotionals every morning with Scripture, reflection & prayer" },
  { href: '/bible', icon: Book, title: "Bible Reading", desc: "5 translations (KJV, WEB, Igbo, Yoruba, Hausa) — fully offline" },
  { href: '/music', icon: Music, title: "Worship Music", desc: "Stream & download choir tracks, lyrics included" },
  { href: '/programs', icon: Calendar, title: "Events", desc: "Never miss a service, conference, or fellowship" },
  { href: '/giving', icon: Heart, title: "Giving", desc: "Secure tithes & offerings with one tap" },
  { href: '/community', icon: Users, title: "Community", desc: "Directory, roster, prayer requests & welcome desk" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Church',
          name: 'Glorious Assembly Ministries International',
          description: 'Community, Word, and Spiritual Growth — All in One Vault',
        }}
      />

      {/* Hero */}
      <header className="relative min-h-[70dvh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="absolute inset-0 bg-[url('/hero-loop.mp4')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-50/90 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-wine-100/30 to-transparent" />

        <div className="relative z-10 px-6 py-20 text-center">
          <div className="animate-slide-up max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-wine-100/80 px-4 py-1.5 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-wine-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-wine-700">Glorious Assembly Ministries International</span>
            </div>

            <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <Image
                src="/icon-192.png"
                alt="GAM Church logo"
                width={100}
                height={100}
                className="mx-auto rounded-3xl border-2 border-wine-200 shadow-glow"
                unoptimized
              />
            </div>

            <h1 className="text-4xl font-bold text-wine-900 tracking-tight animate-fade-in" style={{ animationDelay: '200ms' }}>
              GAM Church App
            </h1>
            <p className="mt-4 text-lg text-wine-600 max-w-md mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
              Community, Word, and Spiritual Growth — All in One Vault
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <Link
                href="/login"
                className="btn-primary h-12 px-8 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Enter the App
              </Link>
              <Link
                href="/bible"
                className="btn-secondary h-12 px-8 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Read the Bible
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-wine-400 rotate-90" aria-hidden="true" />
        </div>
      </header>

      {/* Features */}
      <section className="py-16 px-6 bg-cream-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-wine-900">Everything You Need for Spiritual Growth</h2>
            <p className="mt-3 text-lg text-wine-500 max-w-2xl mx-auto">
              From daily devotionals to worship music, Bible study to church events — the GAM App puts your entire spiritual toolkit in your pocket.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="card-interactive group animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-wine-100 flex items-center justify-center group-hover:bg-wine-200 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-wine-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wine-900">{feature.title}</h3>
                    <p className="mt-1 text-sm text-wine-500">{feature.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-16 px-6 bg-wine-600">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="animate-fade-in">
            <div className="text-4xl font-bold text-cream-50">400+</div>
            <div className="text-cream-200 text-sm mt-1">Sermons Archived</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-4xl font-bold text-cream-50">5</div>
            <div className="text-cream-200 text-sm mt-1">Bible Translations</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-4xl font-bold text-cream-50">100%</div>
            <div className="text-cream-200 text-sm mt-1">Offline Capable</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-4xl font-bold text-cream-50">500+</div>
            <div className="text-cream-200 text-sm mt-1">Active Members</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-cream-50">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-wine-900">Ready to Grow?</h2>
          <p className="mt-3 text-wine-500">Join thousands growing in faith with the GAM App. Free forever.</p>
          <div className="mt-8">
            <Link
              href="/login"
              className="btn-primary h-12 px-10 flex items-center justify-center gap-2 touch-manipulation inline-flex"
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Get Started Free
            </Link>
          </div>
          <p className="mt-4 text-xs text-cream-500">No credit card required · Works offline · Data stays private</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-wine-900 text-center">
        <p className="text-cream-400 text-sm">
          © {new Date().getFullYear()} Glorious Assembly Ministries International. All rights reserved.
        </p>
        <p className="mt-1 text-xs text-cream-600">
          Built with prayer & TypeScript
        </p>
      </footer>
    </div>
  )
}

