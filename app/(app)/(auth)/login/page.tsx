'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('');
  const [staffMode, setStaffMode] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { Capacitor } = await import('@capacitor/core')
      const isNative = Capacitor.isNativePlatform()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: isNative ? 'gami://auth-callback' : `${window.location.origin}/app`,
        },
      })

      if (authError) throw authError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-sm space-y-8 card">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-wine-100 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-wine-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-wine-900">Welcome Back</h1>
          <p className="text-sm text-wine-500">Sign in to access GAM App</p>
        </div>

        {sent ? (
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-wine-100 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-wine-700" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-wine-900">Check your email</p>
            <p className="text-xs text-wine-500">
              We sent a magic link to <span className="font-semibold text-wine-800">{email}</span>
            </p>
            <button type="button" onClick={() => setSent(false)} className="btn-ghost text-xs">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="label-base text-wine-800">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="text-xs text-wine-800 bg-wine-100 border border-wine-200 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-11">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Sending link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-wine-500 leading-relaxed">
        <p className="text-center text-[11px] text-wine-500">
          Staff? <a href="/admin-login" className="underline font-semibold text-wine-700">Sign in with password</a>
        </p>

          New members: your profile is created automatically after your first sign-in.
        </p>
      </div>
    </div>
  )
}
