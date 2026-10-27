'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Calendar, User, RotateCcw, Trash2, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface RosterShift {
  id: string
  service_date: string
  user_id: string
  unit: string
  status: string
  swap_reason: string | null
  covered_by: string | null
  covered_at: string | null
  created_at: string
  profiles?: { full_name: string }
  covered_profile?: { full_name: string }
}

export default function AdminRosterPage() {
  const [shifts, setShifts] = useState<RosterShift[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'swap_requested' | 'covered'>('all')
  const [date, setDate] = useState('')
  const [unit, setUnit] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const router = useRouter()

  const fetchShifts = async () => {
    const supabase = createClient()
    let query = supabase
      .from('roster_shifts')
      .select(`
        *,
        profiles!roster_shifts_user_id_fkey(full_name),
        covered_profile:profiles!roster_shifts_covered_by_fkey(full_name)
      `)
      .order('service_date', { ascending: true })

    if (filter !== 'all') query = query.eq('status', filter)
    if (date) query = query.eq('service_date', date)
    if (unit) query = query.eq('unit', unit)
    if (userId) query = query.eq('user_id', userId)

    const { data } = await query
    setShifts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchShifts() }, [filter, date, unit, userId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setResult(null)

    try {
      const supabase = createClient()
      const payload = {
        service_date: date,
        unit,
        user_id: userId,
        status: 'assigned',
      }

      const { error } = await supabase.from('roster_shifts').insert(payload)
      if (error) throw new Error(typeof error.message === 'string' ? error.message : 'Failed to create shift')

      setResult({ ok: true, msg: 'Shift assigned!' })
      setDate('')
      setUnit('')
      setUserId('')
      fetchShifts()
      router.refresh()
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shift?')) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('roster_shifts').delete().eq('id', id)
      if (error) throw new Error('Failed to delete')
      fetchShifts()
    } catch {
      setResult({ ok: false, msg: 'Failed to delete shift' })
    }
  }

  const units = ['choir', 'media', 'ushers', 'youth', 'general']

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-400" />
          Shift Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Create and manage roster shifts</p>
      </header>

      <form onSubmit={handleCreate} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="a-date" className="label-base text-zinc-300">Service Date</label>
            <input id="a-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="a-unit" className="label-base text-zinc-300">Unit</label>
            <select id="a-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="input-base" required>
              <option value="">Select unit</option>
              {units.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="a-user" className="label-base text-zinc-300">Assigned Member</label>
          <input
            id="a-user"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Member UUID (required)"
            className="input-base"
            required
          />
          <p className="text-xs text-zinc-600">Enter the member's UUID from profiles table</p>
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Assign Shift</>}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'assigned', 'swap_requested', 'covered'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-base max-w-[160px]"
          placeholder="Filter by date"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">All Shifts</h2>
        {loading ? (
          <p className="text-xs text-zinc-500 text-center py-4">Loading...</p>
        ) : shifts.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No shifts found</p>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => (
              <div key={shift.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 capitalize">{shift.unit} • {format(new Date(shift.service_date), 'MMM d, yyyy')}</p>
                  <p className="text-sm font-medium text-white truncate">{shift.profiles?.full_name || 'Unknown'} ({shift.user_id})</p>
                  <p className="text-xs text-zinc-400 capitalize">{shift.status.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => handleDelete(shift.id)}
                  aria-label="Delete shift"
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
  )
}