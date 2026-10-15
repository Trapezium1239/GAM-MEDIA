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
    const { data } = await supabase.from('topics').select('slug').limit(500)
    const params = (data || []).map(item => ({ slug: item.slug }))
    if (params.length > 0) return params
  } catch {
    // Build-time fetch failed — static export requires at least a placeholder.
  }
  return [{ slug: 'placeholder' }]
}

export default function TopicSlugLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}