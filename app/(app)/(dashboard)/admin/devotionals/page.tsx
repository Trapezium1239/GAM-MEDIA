'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Calendar, Edit2, Trash2, BookOpen, Zap, Save, X, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fetchTodaysDevotional } from '@/lib/bible-api';

interface Devotional {
  id: string;
  date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  prayer: string | null;
  application_question: string | null;
  source: string;
  external_id: string | null;
  created_at: string;
  published_at: string | null;
}

const sourceOptions = ['manual', 'auto_esv', 'auto_net'] as const;

export default function AdminDevotionalsPage() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    scripture_reference: '',
    scripture_text: '',
    reflection: '',
    prayer: '',
    application_question: '',
    source: 'manual' as 'manual' | 'auto_esv' | 'auto_net',
    external_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const fetchDevotionals = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('daily_devotionals')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);
    setDevotionals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDevotionals() }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const rawContent = await fetchTodaysDevotional(new Date());
      const content: {
        title: string;
        scripture_reference: string;
        scripture_text: string;
        reflection: string;
        prayer: string;
        application_question: string;
        source: 'auto_esv' | 'auto_net' | 'manual';
        external_id: string;
      } = {
        title: rawContent.title,
        scripture_reference: rawContent.scripture_reference,
        scripture_text: rawContent.scripture_text,
        reflection: rawContent.reflection,
        prayer: rawContent.prayer ?? '',
        application_question: rawContent.application_question ?? '',
        source: rawContent.source,
        external_id: rawContent.external_id ?? '',
      };
      const todayStr = new Date().toISOString().split('T')[0] as string;
      const formDataObj: {
        date: string;
        title: string;
        scripture_reference: string;
        scripture_text: string;
        reflection: string;
        prayer: string;
        application_question: string;
        source: 'manual' | 'auto_esv' | 'auto_net';
        external_id: string;
      } = {
        date: todayStr,
        title: content.title,
        scripture_reference: content.scripture_reference,
        scripture_text: content.scripture_text,
        reflection: content.reflection,
        prayer: content.prayer,
        application_question: content.application_question,
        source: content.source,
        external_id: content.external_id,
      };
      setFormData(formDataObj);
      setResult({ ok: true, msg: 'Generated from Bible API!' });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to generate' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    try {
      const supabase = createClient();
      if (editingId) {
        const { error } = await supabase.from('daily_devotionals').update(formData).eq('id', editingId);
        if (error) throw new Error(typeof error.message === 'string' ? error.message : 'Failed to update');
      } else {
        const { error } = await supabase.from('daily_devotionals').insert(formData);
        if (error) throw new Error(typeof error.message === 'string' ? error.message : 'Failed to create');
      }

      setResult({ ok: true, msg: editingId ? 'Devotional updated!' : 'Devotional created!' });
      setEditingId(null);
      setFormData({ date: '', title: '', scripture_reference: '', scripture_text: '', reflection: '', prayer: '', application_question: '', source: 'manual', external_id: '' });
      fetchDevotionals();
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (d: Devotional) => {
    setEditingId(d.id);
    setFormData({
      date: d.date,
      title: d.title,
      scripture_reference: d.scripture_reference,
      scripture_text: d.scripture_text,
      reflection: d.reflection,
      prayer: d.prayer || '',
      application_question: d.application_question || '',
      source: d.source as 'manual' | 'auto_esv' | 'auto_net',
      external_id: d.external_id || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this devotional?')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('daily_devotionals').delete().eq('id', id);
      if (error) throw new Error('Failed to delete');
      fetchDevotionals();
    } catch {
      setResult({ ok: false, msg: 'Failed to delete devotional' });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          Devotional Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Create and manage daily devotionals</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label htmlFor="d-date" className="label-base text-zinc-300">Date</label>
            <input id="d-date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input-base" required />
          </div>
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label htmlFor="d-source" className="label-base text-zinc-300">Source</label>
            <select id="d-source" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value as any})} className="input-base">
              <option value="manual">Manual</option>
              <option value="auto_esv">Auto ESV</option>
              <option value="auto_net">Auto NET</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-title" className="label-base text-zinc-300">Title</label>
          <input id="d-title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Daily Bread — 2026-09-24" className="input-base" required minLength={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="d-ref" className="label-base text-zinc-300">Scripture Reference</label>
            <input id="d-ref" value={formData.scripture_reference} onChange={(e) => setFormData({...formData, scripture_reference: e.target.value})} placeholder="John 3:16-17" className="input-base" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="d-ext-id" className="label-base text-zinc-300">External ID (optional)</label>
            <input id="d-ext-id" value={formData.external_id} onChange={(e) => setFormData({...formData, external_id: e.target.value})} placeholder="auto_esv:John 3:16-17:2026-09-24" className="input-base" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-scripture" className="label-base text-zinc-300">Scripture Text</label>
          <textarea id="d-scripture" value={formData.scripture_text} onChange={(e) => setFormData({...formData, scripture_text: e.target.value})} placeholder="For God so loved the world..." className="input-base min-h-[80px] resize-none" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-reflection" className="label-base text-zinc-300">Reflection</label>
          <textarea id="d-reflection" value={formData.reflection} onChange={(e) => setFormData({...formData, reflection: e.target.value})} placeholder="Write your reflection..." className="input-base min-h-[100px] resize-none" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-prayer" className="label-base text-zinc-300">Prayer (optional)</label>
          <textarea id="d-prayer" value={formData.prayer} onChange={(e) => setFormData({...formData, prayer: e.target.value})} placeholder="Heavenly Father..." className="input-base min-h-[80px] resize-none" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="d-question" className="label-base text-zinc-300">Application Question (optional)</label>
          <textarea id="d-question" value={formData.application_question} onChange={(e) => setFormData({...formData, application_question: e.target.value})} placeholder="How does this apply to your life today?" className="input-base min-h-[60px] resize-none" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleGenerate} disabled={generating} className="btn-secondary flex items-center justify-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" />Generate from Bible API</>}
          </button>

          {result && (
            <span className={`text-xs rounded-lg px-3 py-2 flex items-center gap-1 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {result.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {result.msg}
            </span>
          )}

          <button type="submit" disabled={saving} className="btn-primary h-11 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />{editingId ? 'Update' : 'Create'} Devotional</>}
          </button>

          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({ date: '', title: '', scripture_reference: '', scripture_text: '', reflection: '', prayer: '', application_question: '', source: 'manual', external_id: '' }) }} className="btn-secondary h-11 flex items-center justify-center gap-2">
              <X className="w-4 h-4 mr-2" /> Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">All Devotionals</h2>
        {loading ? (
          <p className="text-xs text-zinc-500 text-center py-4">Loading...</p>
        ) : devotionals.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No devotionals yet</p>
        ) : (
          <div className="space-y-2">
            {devotionals.map((d) => {
              const isToday = d.date === new Date().toISOString().split('T')[0];
              return (
                <div key={d.id} className={`p-4 rounded-xl border ${d.date === new Date().toISOString().split('T')[0] ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'} flex items-center justify-between gap-3`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-zinc-400 bg-zinc-500/10">{d.source}</span>
                      {isToday && <span className="px-2 py-0.5 rounded-full text-xs font-medium text-amber-400 bg-amber-500/20">Today</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{d.title}</h3>
                    <p className="text-xs text-amber-400 truncate">{d.scripture_reference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(d)} className="btn-secondary text-xs h-8 px-3"><Edit2 className="w-3.5 h-3.5 mr-1" />Edit</button>
                    <button onClick={() => handleDelete(d.id)} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition touch-manipulation"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}