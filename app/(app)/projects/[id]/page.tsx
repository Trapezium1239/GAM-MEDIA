'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Target, AlertTriangle, ChevronLeft, Clock, CheckCircle2, Calendar } from 'lucide-react'
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

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchMilestone = async () => {
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('id', id)
          .single()
        if (!cancelled) {
          if (error) {
            console.error('Project fetch error:', error)
            setMilestone(null)
          } else {
            setMilestone(data || null)
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Project fetch failed:', error)
          setMilestone(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) fetchMilestone()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">Loading project...</p>
      </div>
    )
  }

  if (!milestone) {
    return (
      <div className="empty-state">
        <AlertTriangle className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">Project not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary underline touch-manipulation"
        >
          Go back
        </button>
      </div>
    )
  }

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min(100, Math.round((current / target) * 100))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statusConfig = {
    planned: { icon: <Clock className="w-4 h-4" aria-hidden="true" />, color: 'text-blue-400 bg-blue-500/10', label: 'Planned' },
    in_progress: { icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />, color: 'text-amber-400 bg-amber-500/10', label: 'In Progress' },
    completed: { icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />, color: 'text-green-400 bg-green-500/10', label: 'Completed' },
    paused: { icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" />, color: 'text-red-400 bg-red-500/10', label: 'Paused' },
  }

  const status = milestone.status in statusConfig
    ? (milestone.status as keyof typeof statusConfig)
    : 'planned'
  const config = statusConfig[status]
  const progress = getProgress(milestone.current_amount, milestone.target_amount)

  return (
    <div className="space-y-6 py-4 pb-32">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-primary underline touch-manipulation"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back to projects
      </button>
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" aria-hidden="true" />
          {milestone.title}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 capitalize">{milestone.category}</p>
      </header>
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
        {milestone.description && (
          <p className="text-sm text-zinc-300 mt-2 line-clamp-3">{milestone.description}</p>
        )}
        {milestone.target_amount > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Funded</span>
              <span>{formatCurrency(milestone.current_amount)} of {formatCurrency(milestone.target_amount)}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  milestone.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500">{progress}% funded</div>
          </div>
        )}
        {milestone.target_date && (
          <p className="mt-4 text-xs text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            Target date: {format(new Date(milestone.target_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  )
}
