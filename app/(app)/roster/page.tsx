'use client'
import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { requestShiftSwap } from '@/app/actions/roster'
import { Calendar, User, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
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

export default function RosterPage() {
  const [shifts, setShifts] = useState<RosterShift[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my_shifts' | 'swap_requests' | 'covered'>('all')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('roster_shifts')
      .select(`
        *,
        profiles!roster_shifts_user_id_fkey(full_name),
        covered_profile:profiles!roster_shifts_covered_by_fkey(full_name)
      `)
      .order('service_date', { ascending: true })

    if (filter === 'my_shifts') {
      query = query.eq('user_id', user.id)
    } else if (filter === 'swap_requests') {
      query = query.eq('status', 'swap_requested')
    } else if (filter === 'covered') {
      query = query.eq('status', 'covered')
    }

    const { data } = await query
    setShifts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchShifts() }, [filter])

  const handleAction = async (shiftId: string, action: 'request_swap' | 'cover_shift' | 'cancel_swap', swapReason?: string) => {
    const formData = new FormData()
    formData.append('shift_id', shiftId)
    formData.append('action', action)
    if (swapReason) formData.append('swap_reason', swapReason)

    startTransition(async () => {
      try {
        const { triggerHaptic } = await import('@/lib/native/haptics');
        await triggerHaptic(action === 'cover_shift' ? 'medium' : 'light');
      } catch {
        // haptics never block roster actions
      }
      const result = await requestShiftSwap(formData)
      if (result.error) setError(result.error)
      else fetchShifts()
    })
  }

  const statusColors: Record<string, string> = {
    assigned: 'text-blue-400 bg-blue-500/10',
    swap_requested: 'text-amber-400 bg-amber-500/10',
    covered: 'text-green-400 bg-green-500/10',
    cancelled: 'text-zinc-400 bg-zinc-500/10',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    assigned: <Calendar className="w-3.5 h-3.5" />,
    swap_requested: <AlertTriangle className="w-3.5 h-3.5" />,
    covered: <CheckCircle2 className="w-3.5 h-3.5" />,
    cancelled: <XCircle className="w-3.5 h-3.5" />,
  }

  if (loading) {
    return <div className="empty-state"><Calendar className="empty-state-icon" /><p className="empty-state-title">Loading roster...</p></div>
  }

  const myShifts = shifts.filter(s => s.status === 'assigned')
  const swapRequests = shifts.filter(s => s.status === 'swap_requested')
  const coveredShifts = shifts.filter(s => s.status === 'covered')

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-emerald-400" />
          Shift Swap Marketplace
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Request swaps or cover shifts in your unit</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="tablist">
        {([
          { key: 'all', label: 'All Shifts', count: shifts.length },
          { key: 'my_shifts', label: 'My Shifts', count: myShifts.length },
          { key: 'swap_requests', label: 'Swap Requests', count: swapRequests.length },
          { key: 'covered', label: 'Covered', count: coveredShifts.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === tab.key
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {tab.label} <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {shifts.length === 0 ? (
        <div className="empty-state">
          <Calendar className="empty-state-icon" />
          <p className="empty-state-title">No shifts found</p>
          <p className="empty-state-desc">Shifts will appear here when scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map((shift) => (
            <article key={shift.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${statusColors[shift.status] || 'text-zinc-500'} flex items-center justify-center`}>
                    {statusIcons[shift.status] || <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{shift.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {format(new Date(shift.service_date), 'EEEE, MMMM d, yyyy')} • {shift.unit.charAt(0).toUpperCase() + shift.unit.slice(1)} Unit
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColors[shift.status] || 'text-zinc-500'}`}>
                  {shift.status.replace('_', ' ')}
                </span>
              </div>

              {shift.status === 'swap_requested' && shift.swap_reason && (
                <p className="text-xs text-amber-300 bg-amber-500/10 rounded-lg px-3 py-2">
                  Reason: {shift.swap_reason}
                </p>
              )}

              {shift.status === 'covered' && shift.covered_profile && (
                <p className="text-xs text-green-300 bg-green-500/10 rounded-lg px-3 py-2">
                  Covered by {shift.covered_profile.full_name} • {shift.covered_at ? format(new Date(shift.covered_at), 'MMM d, h:mm a') : ''}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                {shift.status === 'assigned' && (
                  <button
                    onClick={() => handleAction(shift.id, 'request_swap', prompt('Reason for swap request (optional):') || undefined)}
                    disabled={isPending}
                    className="flex-1 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition touch-manipulation flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Request Swap
                  </button>
                )}

                {shift.status === 'swap_requested' && shift.user_id !== shift.covered_by && (
                  <button
                    onClick={() => handleAction(shift.id, 'cover_shift')}
                    disabled={isPending}
                    className="flex-1 py-2 text-xs font-medium text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition touch-manipulation flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cover Shift
                  </button>
                )}

                {shift.status === 'swap_requested' && shift.user_id === shift.user_id && (
                  <button
                    onClick={() => handleAction(shift.id, 'cancel_swap')}
                    disabled={isPending}
                    className="flex-1 py-2 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition touch-manipulation flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Request
                  </button>
                )}

                {shift.status === 'covered' && (
                  <span className="flex-1 py-2 text-xs text-zinc-500 text-center bg-zinc-800 rounded-lg">Covered</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}