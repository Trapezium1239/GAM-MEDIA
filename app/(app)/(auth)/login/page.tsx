'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      // Native: magic links must return into the app via the custom
      // `gami://` scheme (registered in AndroidManifest / Info.plist).
      // Web: land back in-app on /app where detectSessionInUrl finishes.
      const { Capacitor } = await import('@capacitor/core');
      const isNative = Capacitor.isNativePlatform();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: isNative ? 'gami://auth-callback' : `${window.location.origin}/app`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-sm space-y-8 glass-card p-8">
          <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-zinc-400">Sign in to access GAM App</p>
        </div>

        {sent ? (
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-3 text-center card">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-white">Check your email</p>
            <p className="text-xs text-zinc-400">
              We sent a magic link to <span className="text-primary font-medium">{email}</span>
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="label-base text-zinc-300">Email address</label>
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
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-11">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
          New members: your profile is created automatically after your first sign-in.
        </p>
      </div>
    </div>
  );
}