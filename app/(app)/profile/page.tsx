import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut, User, Users, Shield, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = profile && ['admin', 'pastor'].includes(profile.role);

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-xs text-zinc-400 mt-1">Your GAM App account</p>
      </header>

      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-4 card">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{profile?.full_name || 'Member'}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Role</p>
            <p className="text-sm font-medium text-white capitalize">{profile?.role || 'member'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Group</p>
            <p className="text-sm font-medium text-white capitalize">{profile?.church_group || 'general'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Lite Mode</p>
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
            <Users className="w-5 h-5 text-primary" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Give & Support</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </Link>

        <Link
          href="/pastor"
          className="card-compact flex items-center gap-3 touch-manipulation text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Church Directory</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="card-compact flex items-center gap-3 border border-primary/30 touch-manipulation text-left hover:border-primary/50 transition"
          >
            <span className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </span>
            <span className="flex-1 text-sm font-medium text-white">Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </Link>
        )}

        <Link
          href="/privacy"
          className="card-compact flex items-center gap-3 touch-manipulation text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-zinc-800/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-zinc-400" />
          </span>
          <span className="flex-1 text-sm font-medium text-white">Privacy Policy</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </Link>
      </nav>

      <form action="/api/auth/signout" method="POST">
        <button type="submit" className="btn-secondary w-full flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </form>
    </div>
  );
}