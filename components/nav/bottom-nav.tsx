'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Music, Calendar, User, Heart } from 'lucide-react'
import { triggerHaptic } from '@/lib/native/haptics'

const navItems = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/sermons', label: 'Word', icon: BookOpen },
  { href: '/music', label: 'Music', icon: Music },
  { href: '/programs', label: 'Events', icon: Calendar },
  { href: '/devotional', label: 'Daily', icon: BookOpen },
  { href: '/giving', label: 'Giving', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname === '/login' || pathname.startsWith('/login/')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream-100 border-t border-cream-300 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => void triggerHaptic('light')}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors duration-200 touch-manipulation min-w-[48px] ${
                isActive ? 'text-wine-700' : 'text-wine-500 hover:text-wine-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
