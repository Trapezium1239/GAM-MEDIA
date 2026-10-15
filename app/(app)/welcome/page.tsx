'use client'
import { useState, useTransition } from 'react'
import { submitFirstTimer } from '@/app/actions/first-timer'
import { Mail, Check, Loader2 } from 'lucide-react'

export default function WelcomePage() {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      // Offline-first: queue locally when there is no connection.
      try {
        const online = typeof navigator === 'undefined' ? true : navigator.onLine;
        if (!online) {
          const { queueOfflineMutation } = await import('@/lib/offline-queue');
          await queueOfflineMutation('first_timer', {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            is_first_time: formData.get('is_first_time') === 'on' ? 'on' : '',
            prayer_request: formData.get('prayer_request') || '',
            interested_unit: formData.get('interested_unit') || 'general',
          });
          setSubmitted(true);
          return;
        }
      } catch {
        // Fall through to normal submission attempt
      }
      const result = await submitFirstTimer(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Welcome Aboard</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          We've received your details. A shepherd will be in touch soon.
        </p>
        <p className="text-xs text-zinc-500">
          Psalm 84:10 — Even a sparrow finds a home, and a swallow a nest for herself.
        </p>
        <a href="/app" className="btn-accent mt-2">
          Return Home
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
      <div className="w-full max-w-md glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">First Time Visiting?</h1>
          <p className="text-sm text-zinc-400">
            Fill in a few details and we'll welcome you personally
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="full_name" className="label-base text-zinc-300">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              maxLength={100}
              className="input-base"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="label-base text-zinc-300">WhatsApp / Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="input-base"
              placeholder="+234..."
            />
            {error?.includes('phone') && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="label-base text-zinc-300">Interested Unit</p>
            <div className="grid grid-cols-3 gap-2">
              {['general', 'choir', 'media', 'ushers', 'youth'].map((unit) => (
                <label key={unit} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="interested_unit"
                    value={unit}
                    defaultChecked={unit === 'general'}
                    className="accent-amber-500"
                  />
                  <span className="text-xs text-zinc-400 capitalize">{unit}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prayer_request" className="label-base text-zinc-300">Prayer Request (optional)</label>
            <textarea
              id="prayer_request"
              name="prayer_request"
              className="input-base min-h-[80px] resize-none"
              placeholder="Share your request..."
              maxLength={1000}
            />
          </div>

          {error && !error?.includes('phone') && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isPending} className="btn-primary w-full h-11">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit My Details'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
          Your information is secured. A pastoral team member will follow up within 24 hours.
        </p>
      </div>
    </div>
  )
}