'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, X } from 'lucide-react'
import type { AlertItem } from '@/types/content'

const dismissedKey = (id: string) => `dismissed_alert_${id}`

export function UrgentAlertModal() {
  const [activeAlert, setActiveAlert] = useState<AlertItem | null>(null)
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>([])

  const fetchAlerts = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (data) {
        const rows = data as AlertItem[]
        setAllAlerts(rows)
        const urgent = rows.find((a) => a.level === 'urgent' && !sessionStorage.getItem(dismissedKey(a.id)))
        if (urgent) setActiveAlert(urgent)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    void fetchAlerts()
    const interval = setInterval(() => void fetchAlerts(), 60000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const handleDismiss = () => {
    if (!activeAlert) return
    sessionStorage.setItem(dismissedKey(activeAlert.id), 'true')
    const next = allAlerts.find((a) => a.level === 'urgent' && !sessionStorage.getItem(dismissedKey(a.id)))
    setActiveAlert(next ?? null)
  }

  if (!activeAlert) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-wine-950/60 p-4"
      role="alertdialog"
      aria-labelledby="urgent-alert-title"
    >
      <div className="w-full max-w-sm card space-y-4">
        <div className="flex items-center justify-between text-wine-800">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            Urgent Broadcast
          </div>
          <button type="button" onClick={handleDismiss} aria-label="Dismiss alert" className="btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          <h3 id="urgent-alert-title" className="text-base font-bold text-wine-900">
            {activeAlert.title}
          </h3>
          <p className="text-xs text-wine-600 leading-relaxed">{activeAlert.message}</p>
        </div>
        <button type="button" onClick={handleDismiss} className="btn-primary w-full">
          Acknowledge and Dismiss
        </button>
      </div>
    </div>
  )
}

export default UrgentAlertModal
