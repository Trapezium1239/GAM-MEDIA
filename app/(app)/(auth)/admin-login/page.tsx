'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in failed');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!profile || !['admin', 'pastor', 'media'].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('This account does not have staff access');
      }
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-sm space-y-8 card">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-wine-100 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-wine-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-wine-900">Staff Sign In</h1>
          <p className="text-sm text-wine-500">Admin and Media accounts (password required)</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="label-base text-wine-800">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="label-base text-wine-800">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" required autoComplete="current-password" />
          </div>
          {error && (
            <p className="text-xs text-wine-800 bg-wine-100 border border-wine-200 rounded-lg px-3 py-2" role="alert">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-[11px] text-wine-500 leading-relaxed">
          Members: use the magic link on the main login page.
        </p>
      </div>
    </div>
  );
}
