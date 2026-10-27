'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Command, ArrowUp, ArrowDown, BookOpen, Music, Calendar, Users, Settings, Globe, Play } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

const SHORTCUT_KEY = 'k';
const MODIFIER_KEY = 'meta'; // Cmd on Mac, Ctrl on Windows

const defaultCommands: CommandItem[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Go to landing page',
    icon: <Globe className="w-4 h-4" />,
    action: () => window.location.href = '/',
    keywords: ['home', 'landing', 'start'],
    shortcut: 'H',
  },
  {
    id: 'app',
    label: 'Open App',
    description: 'Go to member feed',
    icon: <Play className="w-4 h-4" />,
    action: () => window.location.href = '/app',
    keywords: ['app', 'feed', 'vault'],
    shortcut: 'A',
  },
  {
    id: 'sermons',
    label: 'Word Vault',
    description: 'Browse sermons and teachings',
    icon: <BookOpen className="w-4 h-4" />,
    action: () => window.location.href = '/sermons',
    keywords: ['sermon', 'word', 'teaching', 'bible', 'preacher'],
    shortcut: 'S',
  },
  {
    id: 'music',
    label: 'GAM Music',
    description: 'Listen to worship and choir',
    icon: <Music className="w-4 h-4" />,
    action: () => window.location.href = '/music',
    keywords: ['music', 'song', 'worship', 'choir', 'praise'],
    shortcut: 'M',
  },
  {
    id: 'programs',
    label: 'Programs & Events',
    description: 'Upcoming and past events',
    icon: <Calendar className="w-4 h-4" />,
    action: () => window.location.href = '/programs',
    keywords: ['event', 'program', 'calendar', 'schedule', 'upcoming'],
    shortcut: 'P',
  },
  {
    id: 'welcome',
    label: 'First Time Here?',
    description: 'Submit your details',
    icon: <Users className="w-4 h-4" />,
    action: () => window.location.href = '/welcome',
    keywords: ['welcome', 'new', 'visitor', 'first', 'connect'],
    shortcut: 'W',
  },
  {
    id: 'giving',
    label: 'Give & Support',
    description: 'Bank details for tithes and offerings',
    icon: <Globe className="w-4 h-4" />,
    action: () => window.location.href = '/giving',
    keywords: ['give', 'tithe', 'offering', 'donate', 'bank', 'seed'],
    shortcut: 'G',
  },
  {
    id: 'devotional',
    label: 'Daily Devotional',
    description: 'Today\'s Bible passage',
    icon: <BookOpen className="w-4 h-4" />,
    action: () => window.location.href = '/devotional',
    keywords: ['devotional', 'daily', 'bible', 'scripture', 'verse'],
    shortcut: 'D',
  },
];

export function CommandPalette({ 
  extraCommands = [],
  onOpenChange 
}: { 
  extraCommands?: CommandItem[];
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = useMemo(() => [...defaultCommands, ...extraCommands], [extraCommands]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q)) ||
      cmd.shortcut?.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          close();
        }
        break;
      case 'Tab':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === SHORTCUT_KEY.toLowerCase()) {
        e.preventDefault();
        open();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setQuery('');
      onOpenChange?.(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = 'hidden';
    } else {
      onOpenChange?.(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => { setIsOpen(false); setQuery(''); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-950/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-4">
        {/* Input */}
        <div className="p-4 border-b border-zinc-800/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-base"
              autoFocus
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-mono rounded">
              {SHORTCUT_KEY.toUpperCase()} + {MODIFIER_KEY === 'meta' ? '⌘' : 'Ctrl'}
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <X className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">No commands found for "{query}"</p>
              <p className="text-xs text-zinc-600 mt-1">Try a different search</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/50">
              {filteredCommands.map((cmd, index) => (
                <li key={cmd.id}>
                  <button
                    onClick={() => { cmd.action(); close(); }}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-amber-500/10'
                        : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-white truncate">{cmd.label}</p>
                      {cmd.description && <p className="text-xs text-zinc-500 truncate">{cmd.description}</p>}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs font-mono rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-zinc-800/50 text-center text-xs text-zinc-600">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">↓</kbd>
            navigate •
            <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">Enter</kbd>
            select •
            <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">Esc</kbd>
            close
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';