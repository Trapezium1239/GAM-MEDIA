'use client'

import { Loader2, RefreshCw, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <Loader2 className="empty-state-icon animate-spin" aria-hidden="true" />
      <p className="empty-state-title">{label}</p>
    </div>
  )
}

export function PageError({
  title = 'Could not load this page',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry: () => void
}) {
  return (
    <div className="empty-state" role="alert">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{message}</p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-4 inline-flex items-center gap-2">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  )
}

export function PageEmpty({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined}
    />
  )
}
