import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { AlertTicker } from '@/components/alerts/alert-ticker';
import { UrgentAlertModal } from '@/components/alerts/urgent-modal';
import { Calendar, Music, Video, BookOpen, Users, Clock, ChevronRight, UserPlus, Home } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlaySermonButton } from '@/components/audio/play-button';
import Image from 'next/image';
const PlayMusicButton = dynamic(() => import('@/components/audio/play-button').then((m) => ({ default: m.PlayMusicButton })));

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist_choir: string;
  audio_url: string;
}

export default async function AppHomePage() {
  const supabase = await createClient();

  const { data: bundle } = await supabase.rpc('get_home_vault_bundle');

  const sermons = ((bundle as any)?.sermons || []) as Sermon[];
  const programs = ((bundle as any)?.programs || []) as Program[];
  const music = ((bundle as any)?.music || []) as MusicTrack[];
  const hasContent = sermons.length > 0 || programs.length > 0 || music.length > 0;

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-center justify-between mb-6">
        <div className="space-y-0.5 flex items-center gap-3">
          <Link href="/" className="btn-ghost text-xs py-1.5 px-3 mb-2 inline-flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" />
            Back to Landing
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src="/icon-192.png"
              alt="GAMI Logo"
              width={40}
              height={40}
              className="rounded-xl ring-2 ring-amber-500/30"
              unoptimized
            />
            <div>
              <h1 className="text-2xl font-bold text-gradient tracking-tight">Glorious Assembly Ministries International</h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                GAM App
              </p>
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="h-10 bg-zinc-900 rounded-lg mb-4" />}>
        <AlertTicker />
      </Suspense>
      <Suspense fallback={null}>
        <UrgentAlertModal />
      </Suspense>

      <nav className="grid grid-cols-3 gap-3" aria-label="Main sections">
        <Link href="/sermons" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-white">Word Vault</span>
            <span className="text-[10px] text-zinc-500">{sermons.length} recent</span>
          </div>
        </Link>
        <Link href="/music" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-white">Music</span>
            <span className="text-[10px] text-zinc-500">{music.length} tracks</span>
          </div>
        </Link>
        <Link href="/programs" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs font-semibold text-white">Programs</span>
            <span className="text-[10px] text-zinc-500">{programs.length} upcoming</span>
          </div>
        </Link>
        <Link href="/welcome" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-white">Welcome</span>
            <span className="text-[10px] text-zinc-500">First time?</span>
          </div>
        </Link>
      </nav>

      {sermons.length > 0 && (
        <section className="space-y-3 content-visibility-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gradient tracking-tight">Latest Sermons</h2>
            <Link href="/sermons" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {sermons.map((sermon) => (
              <article key={sermon.id} className="card space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{sermon.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {sermon.preacher} • {format(new Date(sermon.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                  {sermon.audio_url && (
                    <PlaySermonButton
                      track={{ id: sermon.id, title: sermon.title, artist: sermon.preacher, audioUrl: sermon.audio_url }}
                    />
                  )}
                  {sermon.video_link && (
                    <a href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg text-center hover:bg-amber-500/20 transition touch-manipulation">
                      Watch Video
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <section className="space-y-3 content-visibility-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gradient tracking-tight">Upcoming Programs</h2>
            <Link href="/programs" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {programs.map((program) => (
              <article key={program.id} className="card space-y-2">
                <h3 className="text-sm font-semibold text-white">{program.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(program.event_date), 'EEE, MMM d • h:mm a')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {program.venue}
                  </span>
                </div>
                {program.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{program.description}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {music.length > 0 && (
        <section className="space-y-3 content-visibility-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gradient tracking-tight">Featured Music</h2>
            <Link href="/music" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {music.map((track) => (
              <PlayMusicButton
                key={track.id}
                track={{ id: track.id, title: track.title, artist: track.artist_choir, audioUrl: track.audio_url }}
              />
            ))}
          </div>
        </section>
      )}

      {!hasContent && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <p className="empty-state-title">Welcome to GAM App</p>
          <p className="empty-state-desc">Content will appear here once added by leadership</p>
        </div>
      )}
    </div>
  );
}