'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, Users, Shield, ChevronRight, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileRow {
  full_name: string | null;
  role: string | null;
  church_group: string | null;
  lite_mode: boolean | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!authUser) {
        router.replace('/login');
        return;
      }
      setUser({ email: authUser.email ?? '' });
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile((profileRow as ProfileRow) || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Loader2 className="empty-state-icon animate-spin" aria-hidden="true" />
        <p className="empty-state-title">Loading profile...</p>
      </div>
    );
  }

  const isAdmin = !!profile && ['admin', 'pastor'].includes(profile.role ?? '');

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-xs text-zinc-400 mt-1">Your GAM App account</p>
      </header>

      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-4 card">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{profile?.full_name || 'Member'}</p>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Role</p>
            <p className="text-sm font-medium text-white capitalize">{profile?.role || 'member'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Group</p>
            <p className="text-sm font-medium text-white capitalize">{profile?.church_group || 'general'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Lite Mode</p>
            <p className="text-sm font-medium text-white">{profile?.lite_mode ? 'On' : 'Off'}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2" aria-label="Account links">
        <Link
          href="/giving"
          className="card-compact flex items-center gap-3 touch-manipulation text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Give & Support</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        </Link>

        <Link
          href="/pastor"
          className="card-compact flex items-center gap-3 touch-manipulation text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Church Directory</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="card-compact flex items-center gap-3 border border-primary/30 touch-manipulation text-left hover:border-primary/50 transition"
          >
            <span className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-medium text-white">Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" aria-hidden="true" />
          </Link>
        )}

        <Link
          href="/privacy"
          className="card-compact flex items-center gap-3 touch-manipulation text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-zinc-800/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-zinc-400" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Privacy Policy</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        </Link>
      </nav>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        {signingOut ? 'Signing Out...' : 'Sign Out'}
      </button>
    </div>
  );
}