'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Target, Trash2, Calendar, DollarSign, Edit2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description: string | null
  category: string
  target_amount: number
  current_amount: number
  target_date: string | null
  status: string
  display_order: number
  created_at: string
}

const statusOptions = ['planned', 'in_progress', 'completed', 'paused'] as const

export default function AdminMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    status: 'planned' as const,
    display_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const router = useRouter()

  const fetchMilestones = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('project_milestones')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    setMilestones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMilestones() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setResult(null)

    try {
      const supabase = createClient()
      const payload = editingId ? { ...formData, id: editingId } : formData

      const { error } = editingId
        ? await supabase.from('project_milestones').update(formData).eq('id', editingId)
        : await supabase.from('project_milestones').insert(formData)

      if (error) throw new Error(typeof error.message === 'string' ? error.message : 'Failed to save')

      setResult({ ok: true, msg: editingId ? 'Milestone updated!' : 'Milestone created!' })
      setEditingId(null)
      setFormData({ title: '', description: '', category: '', target_amount: 0, current_amount: 0, target_date: '', status: 'planned', display_order: 0 })
      fetchMilestones()
      router.refresh()
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (m: Milestone) => {
    setEditingId(m.id)
    setFormData({
      title: m.title,
      description: m.description || '',
      category: m.category,
      target_amount: m.target_amount,
      current_amount: m.current_amount,
      target_date: m.target_date || '',
      status: m.status as typeof formData.status,
      display_order: m.display_order,
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('project_milestones').delete().eq('id', id)
      if (error) throw new Error('Failed to delete')
      fetchMilestones()
    } catch {
      setResult({ ok: false, msg: 'Failed to delete milestone' })
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Milestone Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Create and manage project funding milestones</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="m-title" className="label-base text-zinc-300">Title</label>
          <input id="m-title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. New Auditorium Roof" className="input-base" required minLength={3} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-desc" className="label-base text-zinc-300">Description (optional)</label>
          <textarea id="m-desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Details..." className="input-base min-h-[80px] resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="m-category" className="label-base text-zinc-300">Category</label>
            <input id="m-category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="building, outreach, equipment..." className="input-base" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-status" className="label-base text-zinc-300">Status</label>
            <select id="m-status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="input-base">
              {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="m-target" className="label-base text-zinc-300">Target Amount (₦)</label>
            <input id="m-target" type="number" min="0" step="1000" value={formData.target_amount} onChange={(e) => setFormData({...formData, target_amount: Number(e.target.value)})} className="input-base" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-current" className="label-base text-zinc-300">Current Amount (₦)</label>
            <input id="m-current" type="number" min="0" step="1000" value={formData.current_amount} onChange={(e) => setFormData({...formData, current_amount: Number(e.target.value)})} className="input-base" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="m-date" className="label-base text-zinc-300">Target Date (optional)</label>
            <input id="m-date" type="date" value={formData.target_date} onChange={(e) => setFormData({...formData, target_date: e.target.value})} className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-order" className="label-base text-zinc-300">Display Order</label>
            <input id="m-order" type="number" min="0" value={formData.display_order} onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})} className="input-base" />
          </div>
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />{editingId ? 'Update' : 'Create'} Milestone</>}
        </button>

        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', category: '', target_amount: 0, current_amount: 0, target_date: '', status: 'planned', display_order: 0 }) }} className="btn-secondary w-full h-11">
            Cancel Edit
          </button>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">All Milestones</h2>
        {loading ? (
          <p className="text-xs text-zinc-500 text-center py-4">Loading...</p>
        ) : milestones.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No milestones yet</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => {
              const progress = m.target_amount > 0 ? Math.min(100, Math.round((m.current_amount / m.target_amount) * 100)) : 0
              return (
                <div key={m.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-primary bg-primary/10">{m.category}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-zinc-400 bg-zinc-500/10">{m.status}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{m.title}</h3>
                      {m.description && <p className="text-xs text-zinc-400 line-clamp-1">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{formatCurrency(m.current_amount)}</span>
                      <span className="text-xs text-zinc-500">/ {formatCurrency(m.target_amount)}</span>
                    </div>
                  </div>

                  {m.target_amount > 0 && (
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, Math.round((m.current_amount / m.target_amount) * 100))}%` }} />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{m.target_date ? format(new Date(m.target_date), 'MMM d, yyyy') : 'No target date'}</span>
                    <span>Order: {m.display_order}</span>
                    <span>{Math.min(100, Math.round((m.current_amount / m.target_amount) * 100))}% funded</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                    <button onClick={() => handleEdit(m)} className="btn-secondary text-xs h-8 px-3"><Edit2 className="w-3.5 h-3.5 mr-1" />Edit</button>
                    <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition touch-manipulation"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}