'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Music, Calendar, User, Heart } from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/sermons', label: 'Word', icon: BookOpen },
  { href: '/music', label: 'Music', icon: Music },
  { href: '/programs', label: 'Events', icon: Calendar },
  { href: '/devotional', label: 'Daily Word', icon: BookOpen },
  { href: '/giving', label: 'Giving', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname === '/login') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream-100/80 backdrop-blur-xl border-t border-cream-300/50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 touch-manipulation min-w-[56px] ${
                isActive
                  ? 'text-wine-600'
                  : 'text-cream-500 hover:text-wine-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Icon className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              {isActive && (
                <>
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-wine-500 to-wine-600" />
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-wine-500" />
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}