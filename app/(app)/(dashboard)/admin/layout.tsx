import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'pastor'].includes(profile.role)) {
    redirect('/app');
  }

  return <div className="pb-32">{children}</div>;
}