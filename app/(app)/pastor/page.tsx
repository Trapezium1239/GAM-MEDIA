'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Phone, User, Building2, ChevronRight, Loader2 } from 'lucide-react';

interface DirectoryItem {
  id: string;
  category: string;
  title: string;
  detail_value: string;
  extra_meta: string | null;
  display_order: number;
}

const categoryMeta: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  pastor_desk: { label: 'Pastor Desk', icon: User, color: 'text-emerald-400 bg-emerald-500/10' },
  bank_account: { label: 'Bank Accounts', icon: Building2, color: 'text-amber-400 bg-amber-500/10' },
  contact: { label: 'Contacts', icon: Phone, color: 'text-blue-400 bg-blue-500/10' },
};

export default function PastorPage() {
  const [items, setItems] = useState<DirectoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('church_directory')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as DirectoryItem[]) || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = (items || []).reduce((acc, item) => {
    const category = item.category;
    const bucket = acc[category] ?? [];
    acc[category] = bucket;
    bucket.push(item);
    return acc;
  }, {} as Record<string, DirectoryItem[]>);

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white">Pastor Desk & Directory</h1>
        <p className="text-xs text-zinc-400 mt-1">Official contacts and giving details</p>
      </header>

      {Object.entries(grouped).map(([category, catItems]) => {
        const meta = categoryMeta[category] || { label: category, icon: Phone, color: 'text-zinc-400 bg-zinc-500/10' };
        const Icon = meta.icon;
        return (
          <section key={category} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              <span className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </span>
              {meta.label}
            </h2>
            <div className="space-y-2">
              {catItems.map((item) => (
                <article key={item.id} className="card-compact flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">{item.title}</p>
                    <p className="text-sm font-semibold text-white truncate">{item.detail_value}</p>
                    {item.extra_meta && <p className="text-xs text-zinc-500 mt-0.5">{item.extra_meta}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {(!items || items.length === 0) && (
        <div className="text-center py-12 text-zinc-500">
          <Phone className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">Directory is being set up</p>
          <p className="text-xs mt-1">Contact the church admin for details</p>
        </div>
      )}
    </div>
  );
}