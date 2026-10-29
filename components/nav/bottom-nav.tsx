'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, BookMarked, Heart, MoreHorizontal, Music, Calendar, BookOpen as DailyIcon, User, X } from 'lucide-react'
import { triggerHaptic } from '@/lib/native/haptics'

const primaryItems = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/sermons', label: 'Word', icon: BookOpen },
  { href: '/bible', label: 'Bible', icon: BookMarked },
  { href: '/giving', label: 'Giving', icon: Heart },
]

const moreItems = [
  { href: '/music', label: 'Music', icon: Music },
  { href: '/programs', label: 'Events', icon: Calendar },
  { href: '/devotional', label: 'Daily', icon: DailyIcon },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  if (pathname.startsWith('/admin') || pathname === '/login' || pathname.startsWith('/login/')) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-cream-100 border-t border-cream-300 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => void triggerHaptic('light')}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors duration-200 touch-manipulation min-w-[48px] ${
                  active ? 'text-wine-700' : 'text-wine-500 hover:text-wine-800'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-wide">{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => { void triggerHaptic('light'); setMoreOpen(true); }}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors duration-200 touch-manipulation min-w-[48px] ${
              moreItems.some((m) => isActive(m.href)) ? 'text-wine-700' : 'text-wine-500 hover:text-wine-800'
            }`}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-wine-950/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-cream-100 rounded-t-2xl border-t border-cream-300 p-4 pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-wine-900">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl text-wine-500 hover:text-wine-800 hover:bg-cream-200 transition touch-manipulation"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { void triggerHaptic('light'); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors touch-manipulation ${
                      active ? 'bg-wine-100 text-wine-700' : 'text-wine-600 hover:bg-cream-200'
                    }`}
                  >
                    <Icon className="w-6 h-6" aria-hidden="true" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BottomNav
