'use client'
import { useState } from 'react'
import { useAudioStore } from '@/store/use-audio-store'
import { Music, Pause, Download, Check, Loader2 } from 'lucide-react'
import { getCachedAudio } from '@/lib/offline-storage'
import { getNativeAudioUri } from '@/lib/audio-persistence'

export interface PlayTrackData {
  id: string
  title: string
  artist: string
  audioUrl: string
}

/** Shared native-aware download: Filesystem on device, IndexedDB on web. */
export async function downloadTrackForOffline(
  track: PlayTrackData,
  setOfflineAudioUrl: (id: string, url: string) => void
): Promise<void> {
  const { downloadAudioToDevice } = await import('@/lib/native/audio-download')
  const headRes = await fetch(track.audioUrl, { method: 'HEAD' }).catch(() => null)
  const mimeType = headRes?.headers.get('content-type') || 'audio/mpeg'
  const result = await downloadAudioToDevice(track.id, track.audioUrl, {
    title: track.title,
    artist: track.artist,
    mimeType,
  })
  if (!result.ok) throw new Error(result.error || 'Download failed')
  const playable = result.objectUrl || result.uri || getNativeAudioUri(track.id)
  if (playable) {
    setOfflineAudioUrl(track.id, playable)
    return
  }
  const cached = await getCachedAudio(track.id)
  if (cached) {
    setOfflineAudioUrl(track.id, cached.objectUrl)
    return
  }
  throw new Error('Could not prepare offline audio')
}

function unlockGesture(url: string) {
  try {
    const audio = new Audio()
    audio.src = url
    const playPromise = audio.play()
    if (playPromise) {
      void playPromise
        .then(() => {
          audio.pause()
          audio.src = ''
        })
        .catch(() => undefined)
    }
  } catch {
    // Gesture unlock is best-effort
  }
}

function usePlayTrack(track: PlayTrackData) {
  const { currentTrack, isPlaying, playTrack, togglePlay, setOfflineAudioUrl } = useAudioStore()
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const isActive = currentTrack?.id === track.id
  const isThisPlaying = isActive && isPlaying

  const handleDownload = async () => {
    if (downloaded || downloading) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadTrackForOffline(track, setOfflineAudioUrl)
      setDownloaded(true)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handlePlay = () => {
    unlockGesture(track.audioUrl)
    if (isActive) {
      togglePlay()
      return
    }
    const nativeUri = getNativeAudioUri(track.id)
    playTrack({
      ...track,
      offlineAudioUrl: nativeUri ?? undefined,
    })
    void getCachedAudio(track.id).then((cached) => {
      if (cached) setOfflineAudioUrl(track.id, cached.objectUrl)
    })
  }

  return { isThisPlaying, handlePlay, handleDownload, downloading, downloaded, downloadError }
}

export function PlaySermonButton({
  track,
  className = '',
  dataPlayBtn = false,
}: {
  track: PlayTrackData
  className?: string
  dataPlayBtn?: boolean
}) {
  const { isThisPlaying, handlePlay, handleDownload, downloading, downloaded, downloadError } = usePlayTrack(track)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePlay}
        className={`flex-1 py-2 text-xs font-semibold text-wine-800 bg-cream-200 rounded-xl hover:bg-cream-300 transition touch-manipulation flex items-center justify-center gap-1.5 ${className}`}
        aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        {...(dataPlayBtn ? { 'data-play-btn': true } : {})}
      >
        {isThisPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" aria-hidden="true" /> Pause
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5" aria-hidden="true" /> Play Audio
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading || downloaded}
        className="px-3 py-2 text-xs font-semibold rounded-xl text-wine-700 bg-cream-200 hover:bg-cream-300 transition touch-manipulation flex items-center gap-1.5"
        aria-label={downloaded ? 'Saved offline' : downloading ? 'Saving' : 'Save for offline'}
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        ) : downloaded ? (
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
        ) : (
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
        )}
        <span>{downloaded ? 'Saved' : 'Save'}</span>
      </button>
      {downloadError && (
        <span className="text-[10px] text-wine-700" role="alert">
          {downloadError}
        </span>
      )}
    </div>
  )
}

export function PlayMusicButton({ track }: { track: PlayTrackData }) {
  const { isThisPlaying, handlePlay, handleDownload, downloading, downloaded, downloadError } = usePlayTrack(track)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          className="card-interactive w-full text-left flex items-center gap-3"
          aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          <div className="w-12 h-12 rounded-xl bg-wine-100 flex items-center justify-center flex-shrink-0">
            {isThisPlaying ? (
              <Pause className="w-5 h-5 text-wine-700" aria-hidden="true" />
            ) : (
              <Music className="w-5 h-5 text-wine-700" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-wine-900 truncate">{track.title}</p>
            <p className="text-xs text-wine-500 truncate">{track.artist}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading || downloaded}
          className="p-2 rounded-xl text-wine-700 bg-cream-200 touch-manipulation"
          aria-label={downloaded ? 'Saved offline' : downloading ? 'Saving' : 'Save for offline'}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloaded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
      {downloadError && (
        <p className="text-[10px] text-wine-700" role="alert">
          {downloadError}
        </p>
      )}
    </div>
  )
}

export default PlaySermonButton
