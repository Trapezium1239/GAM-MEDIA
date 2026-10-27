'use client'

import { useAudioStore } from '@/store/use-audio-store'
import { Play, Pause, X, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/components/ui/toast'
import {
  saveAudioPosition,
  getAudioPosition,
  clearAudioPosition,
  formatTime,
  resolveAudioSource,
  type AudioPosition,
} from '@/lib/audio-persistence'

export function PersistentPlayer() {
  const { currentTrack, isPlaying, togglePlay, stop, seek, seekRelative, setCurrentTime, setDuration } =
    useAudioStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [resumePosition, setResumePosition] = useState<AudioPosition | null>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const handleTimeUpdate = () => {
      saveAudioPosition({
        trackId: currentTrack.id,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        title: currentTrack.title,
        preacher: currentTrack.artist,
        timestamp: Date.now(),
      })
      setCurrentTime(audio.currentTime)
    }

    const handleLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoaded)
    }
  }, [currentTrack, setCurrentTime, setDuration])

  useEffect(() => {
    const saved = getAudioPosition()
    if (saved && currentTrack?.id === saved.trackId && saved.currentTime > 5) {
      setResumePosition(saved)
      setShowResumePrompt(true)
    } else {
      setShowResumePrompt(false)
    }
  }, [currentTrack])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = muted
    if (isPlaying) {
      audioRef.current.play().catch(() => useAudioStore.setState({ isPlaying: false }))
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentTrack, muted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const storeTime = useAudioStore.getState().currentTime
    if (Math.abs(audio.currentTime - storeTime) > 1.5) {
      audio.currentTime = storeTime
    }
  }, [currentTrack])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'GAM Media Vault',
      })
    } catch {
      return
    }
    try {
      navigator.mediaSession.setActionHandler('play', () => useAudioStore.setState({ isPlaying: true }))
    } catch {
      /* unsupported */
    }
    try {
      navigator.mediaSession.setActionHandler('pause', () => useAudioStore.setState({ isPlaying: false }))
    } catch {
      /* unsupported */
    }
    try {
      navigator.mediaSession.setActionHandler('stop', () => stop())
    } catch {
      /* unsupported */
    }
    try {
      navigator.mediaSession.setActionHandler('seekbackward', () => seekRelative(-10))
    } catch {
      /* unsupported */
    }
    try {
      navigator.mediaSession.setActionHandler('seekforward', () => seekRelative(10))
    } catch {
      /* unsupported */
    }
    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime)
      })
    } catch {
      /* unsupported */
    }
  }, [currentTrack, stop, seek, seekRelative])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!currentTrack) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekRelative(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          seekRelative(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          seekRelative(30)
          break
        case 'ArrowDown':
          e.preventDefault()
          seekRelative(-30)
          break
        case 'm':
          e.preventDefault()
          setMuted((prev) => !prev)
          break
        case '0':
          e.preventDefault()
          seek(0)
          if (audioRef.current) audioRef.current.currentTime = 0
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, seekRelative, currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const unsub = useAudioStore.subscribe((state, prev) => {
      if (Math.abs(state.currentTime - prev.currentTime) > 1.25) {
        audio.currentTime = state.currentTime
      }
    })
    return unsub
  }, [currentTrack])

  if (!currentTrack) return null

  const source = resolveAudioSource(currentTrack)
  const offline = Boolean(currentTrack.offlineAudioUrl)

  const handleResume = () => {
    if (resumePosition && audioRef.current) {
      audioRef.current.currentTime = resumePosition.currentTime
      seek(resumePosition.currentTime)
      clearAudioPosition()
      setShowResumePrompt(false)
      toast.success('Resumed playback', `Continuing from ${formatTime(resumePosition.currentTime)}`)
    }
  }

  const handleRestart = () => {
    if (audioRef.current) audioRef.current.currentTime = 0
    seek(0)
    clearAudioPosition()
    setShowResumePrompt(false)
  }

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 z-50 max-w-md mx-auto bg-cream-100 border-t border-cream-300 p-3 shadow-sm flex items-center justify-between gap-3">
        <audio
          ref={audioRef}
          src={source}
          preload="auto"
          onEnded={() => {
            clearAudioPosition()
            stop()
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-wine-900 truncate">{currentTrack.title}</p>
          <p className="text-xs text-wine-500 truncate">
            {currentTrack.artist}
            {offline ? ' · Offline' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-xl text-wine-600 flex items-center justify-center touch-manipulation"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-xl bg-wine-600 text-cream-50 flex items-center justify-center touch-manipulation"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop and close player"
            className="w-8 h-8 rounded-xl text-wine-500 flex items-center justify-center touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showResumePrompt && (
        <div className="fixed bottom-36 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-wine-600" aria-hidden="true" />
              <span className="font-semibold text-wine-900">Resume playback?</span>
            </div>
            <p className="text-sm text-wine-600">
              Continue {resumePosition?.title} from {resumePosition ? formatTime(resumePosition.currentTime) : '0:00'}?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleResume} className="btn-primary flex-1">
                Resume
              </button>
              <button type="button" onClick={handleRestart} className="btn-secondary flex-1">
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PersistentPlayer
