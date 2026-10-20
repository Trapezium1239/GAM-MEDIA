'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'
import type { AlertItem } from '@/types/content'

const iconMap = {
  info: { icon: Info, cls: 'text-wine-700 bg-wine-50 border-wine-200' },
  advisory: { icon: AlertTriangle, cls: 'text-wine-800 bg-cream-200 border-cream-300' },
  urgent: { icon: AlertCircle, cls: 'text-wine-900 bg-wine-100 border-wine-300' },
}

export function AlertTicker() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    let cancelled = false
    const fetchAlerts = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('alerts')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .neq('level', 'urgent')
          .order('created_at', { ascending: false })
          .limit(10)

        if (!cancelled && data) setAlerts(data as AlertItem[])
      } catch {
        // ticker is optional
      }
    }

    void fetchAlerts()
    const interval = setInterval(() => void fetchAlerts(), 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!alerts.length) return null

  const tickerContent = alerts.map((alert) => {
    const meta = iconMap[alert.level] ?? iconMap.info
    const Icon = meta.icon
    return (
      <span
        key={alert.id}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${meta.cls}`}
      >
        <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span className="uppercase tracking-wider font-bold">{alert.level}</span>
        <span className="font-semibold">{alert.title}</span>
        <span>{alert.message}</span>
      </span>
    )
  })

  return (
    <div className="overflow-hidden bg-cream-100 border border-cream-300 rounded-xl" aria-live="polite">
      <div className="flex gap-6 py-2 px-4 animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  )
}

export default AlertTicker
