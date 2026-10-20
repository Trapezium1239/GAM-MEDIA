import { Search, BookOpen, Music, Calendar, Heart, MessageSquare, AlertCircle, Filter, WifiOff, type LucideIcon } from 'lucide-react'

type Variant = 'default' | 'search' | 'filter' | 'offline' | 'sermons' | 'music' | 'programs' | 'giving' | 'devotionals'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: Variant
}

const iconMap: Record<Exclude<Variant, 'default'>, LucideIcon> = {
  search: Search,
  sermons: BookOpen,
  music: Music,
  programs: Calendar,
  giving: Heart,
  devotionals: MessageSquare,
  filter: Filter,
  offline: WifiOff,
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const Icon = icon || (variant !== 'default' ? iconMap[variant] : AlertCircle)

  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" aria-hidden="true" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="btn-secondary mt-4 text-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}

export { EmptyState }

export function SearchEmptyState({
  query,
  onClearFilters,
  hasFilters = false,
}: {
  query: string
  onClearFilters?: () => void
  hasFilters?: boolean
}) {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : 'No sermons found'}
      description={
        query
          ? hasFilters
            ? 'Try adjusting your filters or search terms.'
            : 'Check spelling or try broader search terms.'
          : 'Start searching by title, preacher, or topic.'
      }
      action={
        hasFilters && onClearFilters
          ? {
              label: 'Clear filters',
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  )
}

export function FilterEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      variant="filter"
      title="No results with current filters"
      description="Try removing some filters to see more results."
      action={{
        label: 'Clear all filters',
        onClick: onClearFilters,
      }}
    />
  )
}

export function OfflineEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      variant="offline"
      title="You are offline"
      description="Connect to the internet to load content. Previously viewed content may still be available."
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  )
}

export function CategoryEmptyState({
  category,
}: {
  category: 'sermons' | 'music' | 'programs' | 'giving' | 'devotionals'
}) {
  return (
    <EmptyState
      variant={category}
      title={`No ${category} yet`}
      description={`There are no ${category} available at the moment. Check back soon.`}
    />
  )
}
