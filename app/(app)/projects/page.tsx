'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Target, TrendingUp, Calendar, ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
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

const statusConfig = {
  planned: { icon: <Clock className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10', label: 'Planned' },
  in_progress: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10', label: 'In Progress' },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400 bg-green-500/10', label: 'Completed' },
  paused: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400 bg-red-500/10', label: 'Paused' },
}

export default function ProjectsPage() {
  const router = useRouter()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchMilestones()
  }, [])

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

  if (loading) {
    return <div className="empty-state"><Target className="empty-state-icon" /><p className="empty-state-title">Loading projects...</p></div>
  }

  const grouped = milestones.reduce((acc, m) => {
    const category = m.category
    if (!acc[category]) acc[category] = []
    acc[category]!.push(m)
    return acc
  }, {} as Record<string, Milestone[]>)

  const hasMilestones = Object.keys(grouped).length > 0

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Project Milestone Tracker
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Transparent funding progress for church projects</p>
      </header>

      {!hasMilestones ? (
        <div className="empty-state">
          <Target className="empty-state-icon" />
          <p className="empty-state-title">No projects yet</p>
          <p className="empty-state-desc">Milestones will appear here when created by leadership</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                <span className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </span>
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((milestone) => {
                  const status = milestone.status as keyof typeof statusConfig
                  const config = statusConfig[status] ?? statusConfig.planned
                  const progress = getProgress(milestone.current_amount, milestone.target_amount)
                  const isOverdue = milestone.target_date && new Date(milestone.target_date) < new Date() && milestone.status !== 'completed'

                  return (
                    <article key={milestone.id} className="card space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10">
                                Overdue
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-white truncate">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{milestone.description}</p>
                          )}
                        </div>
                        {milestone.target_amount > 0 && (
                          <div className="w-32 text-right flex-shrink-0">
                            <p className="text-sm font-bold text-white">{formatCurrency(milestone.current_amount)}</p>
                            <p className="text-xs text-zinc-500">of {formatCurrency(milestone.target_amount)}</p>
                          </div>
                        )}
                      </div>

                      {milestone.target_amount > 0 && (
                        <div className="space-y-1">
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                milestone.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>{progress}% funded</span>
                            {milestone.target_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                Target: {format(new Date(milestone.target_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/60">
                        <button
                          onClick={() => router.push(`/projects/${milestone.id}`)}
                          className="flex-1 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg text-center hover:bg-primary/20 transition touch-manipulation"
                        >
                          View Details <ChevronRight className="w-3 h-3 inline ml-1" />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}