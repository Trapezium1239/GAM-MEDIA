import { ReactNode } from 'react';

// Static export requires every dynamic route to pre-render known paths.
// generateStaticParams lives in this server layout because the page itself is a client component.
export async function generateStaticParams() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase.from('project_milestones').select('id').limit(500)
    if (data && data.length > 0) {
      return data.map((item) => ({ id: item.id }))
    }
  } catch {
    // Build-time fetch failed (e.g. offline build) — static export requires at least a placeholder.
  }
  // Return a dummy route to satisfy static export requirement
  return [{ id: 'placeholder' }]
}

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
