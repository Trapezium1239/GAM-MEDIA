'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = (localStorage.getItem('theme') as Theme) || 'system'
    setTheme(stored)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) return null

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-cream-200 dark:bg-wine-800/60">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition touch-manipulation ${
            theme === value
              ? 'bg-cream-50 dark:bg-wine-700 text-wine-900 dark:text-cream-50 shadow-sm'
              : 'text-wine-500 dark:text-cream-300 hover:text-wine-700 dark:hover:text-cream-100'
          }`}
          aria-pressed={theme === value}
          aria-label={`${label} theme`}
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
