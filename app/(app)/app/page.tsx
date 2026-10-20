'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTicker } from '@/components/alerts/alert-ticker'
import { UrgentAlertModal } from '@/components/alerts/urgent-modal'
import {
  Calendar,
  Music,
  Video,
  BookOpen,
  BookMarked,
  Users,
  Clock,
  ChevronRight,
  UserPlus,
  Image as ImageIcon,
  Heart,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { PlaySermonButton, PlayMusicButton } from '@/components/audio/play-button'
import Image from 'next/image'
import { PageError, PageLoading } from '@/components/ui/page-status'
import { toast } from '@/components/ui/toast'
import { isHomeVaultBundle, type HomeVaultBundle, type MusicTrack, type Program, type Sermon } from '@/types/content'

export default function AppHomePage() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [music, setMusic] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    setLoading(true)
    setError(null)
    supabase.rpc('get_home_vault_bundle').then(
      ({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
          toast.error('Could not load home', rpcError.message)
          setLoading(false)
          return
        }
        if (isHomeVaultBundle(data)) {
          const bundle: HomeVaultBundle = data
          setSermons(bundle.sermons.slice(0, 3))
          setPrograms(bundle.programs.slice(0, 3))
          setMusic(bundle.music.slice(0, 3))
        }
        setLoading(false)
      },
      () => {
        if (cancelled) return
        setError('Network error while loading the vault')
        toast.error('Could not load home', 'Check your connection and retry.')
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const hasContent = sermons.length > 0 || programs.length > 0 || music.length > 0

  if (loading) return <PageLoading label="Loading church content..." />
  if (error) return <PageError message={error} onRetry={() => setReloadToken((n) => n + 1)} />

  return (
    <div className="space-y-6 pb-32">
      <header className="mb-2">
        <div className="flex items-center gap-3">
          <Image
            src="/icon-192.png"
            alt="GAM logo"
            width={40}
            height={40}
            className="rounded-xl border border-cream-300"
            unoptimized
          />
          <div>
            <h1 className="text-lg font-bold text-wine-900 leading-tight">
              GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL
            </h1>
            <p className="text-xs text-wine-500">GAM App</p>
          </div>
        </div>
      </header>

      <AlertTicker />
      <UrgentAlertModal />

      <nav className="grid grid-cols-3 gap-3" aria-label="Quick access">
        <Link href="/sermons" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <BookOpen className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Sermons</span>
          </div>
        </Link>
        <Link href="/bible" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <BookMarked className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Bible KJV&WEB</span>
          </div>
        </Link>
        <Link href="/music" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <Music className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Music</span>
          </div>
        </Link>
        <Link href="/programs" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Programs</span>
          </div>
        </Link>
        <Link href="/gallery" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Gallery</span>
          </div>
        </Link>
        <Link href="/giving" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <Heart className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Giving</span>
          </div>
        </Link>
        <Link href="/welcome" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <UserPlus className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Welcome</span>
          </div>
        </Link>
        <Link href="/pastor" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <User className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Pastor</span>
          </div>
        </Link>
        <Link href="/projects" className="card-interactive">
          <div className="flex flex-col items-center gap-2">
            <Users className="w-6 h-6 text-wine-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-wine-900">Projects</span>
          </div>
        </Link>
      </nav>

      {sermons.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-wine-900">Recent Sermons</h2>
            <Link href="/sermons" className="text-xs text-wine-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {sermons.map((sermon) => (
              <article key={sermon.id} className="card space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-wine-100 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-wine-700" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-wine-900 truncate">{sermon.title}</h3>
                    <p className="text-xs text-wine-500">
                      {sermon.preacher} · {format(new Date(sermon.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-cream-300">
                  {sermon.audio_url && (
                    <PlaySermonButton
                      track={{
                        id: sermon.id,
                        title: sermon.title,
                        artist: sermon.preacher,
                        audioUrl: sermon.audio_url,
                      }}
                    />
                  )}
                  {sermon.video_link && (
                    <a
                      href={sermon.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-xs"
                    >
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
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-wine-900">Upcoming Programs</h2>
            <Link href="/programs" className="text-xs text-wine-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {programs.map((program) => (
              <article key={program.id} className="card space-y-2">
                <h3 className="text-sm font-semibold text-wine-900">{program.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-wine-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {format(new Date(program.event_date), 'EEE, MMM d • h:mm a')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {program.venue}
                  </span>
                </div>
                {program.description && <p className="text-xs text-wine-500 line-clamp-2">{program.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {music.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-wine-900">Featured Music</h2>
            <Link href="/music" className="text-xs text-wine-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {music.map((track) => (
              <PlayMusicButton
                key={track.id}
                track={{
                  id: track.id,
                  title: track.title,
                  artist: track.artist_choir,
                  audioUrl: track.audio_url,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {!hasContent && (
        <div className="empty-state">
          <Users className="empty-state-icon" aria-hidden="true" />
          <p className="empty-state-title">Welcome to GAM App</p>
          <p className="empty-state-desc">Content will appear here once added by leadership</p>
        </div>
      )}
    </div>
  )
}
