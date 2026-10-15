'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Settings, Landmark, Phone, User, Trash2 } from 'lucide-react';

interface DirectoryItem {
  id: string;
  category: string;
  title: string;
  detail_value: string;
  extra_meta: string | null;
  display_order: number;
}

const categories = [
  { value: 'bank_account', label: 'Bank Account', icon: Landmark },
  { value: 'pastor_desk', label: 'Pastor Desk', icon: User },
  { value: 'contact', label: 'Contact', icon: Phone },
] as const;

export default function AdminSettingsPage() {
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('bank_account');
  const [title, setTitle] = useState('');
  const [detailValue, setDetailValue] = useState('');
  const [extraMeta, setExtraMeta] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const fetchItems = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('church_directory')
      .select('*')
      .order('display_order', { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('church_directory').insert({
        category,
        title: title.trim(),
        detail_value: detailValue.trim(),
        extra_meta: extraMeta.trim() || null,
        display_order: items.length,
      });

      if (error) throw new Error(error.message || 'Failed to add entry');

      setResult({ ok: true, msg: 'Entry added!' });
      setTitle('');
      setDetailValue('');
      setExtraMeta('');
      fetchItems();
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('church_directory').delete().eq('id', id);
      if (error) throw new Error(error.message || 'Failed to delete');
      setItems(items.filter((i) => i.id !== id));
    } catch {
      setResult({ ok: false, msg: 'Failed to delete entry' });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          Directory Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Manage bank accounts, pastor desk, and contacts</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <p className="label-base text-zinc-300">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition touch-manipulation border ${
                    isActive
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-title" className="label-base text-zinc-300">Title</label>
          <input
            id="d-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={category === 'bank_account' ? 'GTBank - Missions' : 'Title'}
            className="input-base"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-value" className="label-base text-zinc-300">
            {category === 'bank_account' ? 'Account Number' : 'Value'}
          </label>
          <input
            id="d-value"
            value={detailValue}
            onChange={(e) => setDetailValue(e.target.value)}
            placeholder={category === 'bank_account' ? '0123456789' : 'Detail'}
            className="input-base"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-meta" className="label-base text-zinc-300">Extra Info (optional)</label>
          <input
            id="d-meta"
            value={extraMeta}
            onChange={(e) => setExtraMeta(e.target.value)}
            placeholder={category === 'bank_account' ? 'Account name: GLORIOUS ASSEMBLY MINISTRIES' : 'Additional details'}
            className="input-base"
          />
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Entry</>}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Current Entries</h2>
        {loading ? (
          <p className="text-xs text-zinc-500 text-center py-4">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No entries yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">{item.category.replace('_', ' ')}</p>
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{item.detail_value}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}