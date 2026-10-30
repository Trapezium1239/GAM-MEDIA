'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ReactNode } from 'react';

const FULL_ADMIN_ROLES = ['admin', 'pastor'];
const CONTENT_ROLES = ['admin', 'pastor', 'media'];

function allowedRolesFor(pathname: string): string[] {
  if (
    pathname.startsWith('/admin/music') ||
    pathname.startsWith('/admin/sermons') ||
    pathname.startsWith('/admin/gallery')
  ) {
    return CONTENT_ROLES;
  }
  return FULL_ADMIN_ROLES;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const role = profile?.role;
      if (!role || !allowedRolesFor(pathname ?? '').includes(role)) {
        router.replace('/app');
        return;
      }
      setAllowed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!allowed) return null;
  return <div className="pb-32">{children}</div>;
}

