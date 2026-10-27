'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, BookOpen, Calendar, Image, Music, Settings, ChevronRight, Mail, Wifi, RotateCcw, Target, Sun, Loader2 } from 'lucide-react';
import Link from 'next/link';

const adminLinks = [
  { href: '/admin/sermons', label: 'Sermons', icon: BookOpen, color: 'text-blue-400 bg-blue-500/10' },
  { href: '/admin/programs', label: 'Programs', icon: Calendar, color: 'text-green-400 bg-green-500/10' },
  { href: '/admin/gallery', label: 'Gallery', icon: Image, color: 'text-purple-400 bg-purple-500/10' },
  { href: '/admin/music', label: 'Music', icon: Music, color: 'text-amber-400 bg-amber-500/10' },
  { href: '/admin/alerts', label: 'Alerts', icon: Megaphone, color: 'text-red-400 bg-red-500/10' },
  { href: '/admin/first-timers', label: 'First-Timers', icon: Mail, color: 'text-emerald-400 bg-emerald-500/10' },
  { href: '/admin/bridge', label: 'Bridge Relay', icon: Wifi, color: 'text-cyan-400 bg-cyan-500/10' },
  { href: '/admin/roster', label: 'Shift Roster', icon: RotateCcw, color: 'text-emerald-400 bg-emerald-500/10' },
  { href: '/admin/milestones', label: 'Milestones', icon: Target, color: 'text-primary bg-primary/10' },
  { href: '/admin/devotionals', label: 'Daily Devotional', icon: Sun, color: 'text-amber-400 bg-amber-500/10' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, color: 'text-zinc-400 bg-zinc-500/10' },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<{ label: string; value: number }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      try {
        const [sermonsCount, programsCount, galleryCount, musicCount, activeAlerts] = await Promise.all([
          supabase.from('sermons').select('id', { count: 'exact', head: true }),
          supabase.from('programs').select('id', { count: 'exact', head: true }),
          supabase.from('gallery_items').select('id', { count: 'exact', head: true }),
          supabase.from('church_music').select('id', { count: 'exact', head: true }),
          supabase.from('alerts').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
        ]);
        if (cancelled) return;
        setStats([
          { label: 'Sermons', value: sermonsCount.count ?? 0 },
          { label: 'Programs', value: programsCount.count ?? 0 },
          { label: 'Gallery', value: galleryCount.count ?? 0 },
          { label: 'Music', value: musicCount.count ?? 0 },
          { label: 'Active Alerts', value: activeAlerts.count ?? 0 },
        ]);
      } catch {
        if (!cancelled) setStats([
          { label: 'Sermons', value: 0 },
          { label: 'Programs', value: 0 },
          { label: 'Gallery', value: 0 },
          { label: 'Music', value: 0 },
          { label: 'Active Alerts', value: 0 },
        ]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (stats === null) {
    return (
      <div className="empty-state">
        <Loader2 className="empty-state-icon animate-spin" />
        <p className="empty-state-title">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage all GAM App content</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <nav className="space-y-2" aria-label="Admin sections">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 transition hover:border-zinc-700 touch-manipulation"
            >
              <span className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 font-medium text-white text-sm">{link.label}</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}