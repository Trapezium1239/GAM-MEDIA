import { Search, BookOpen, Music, Calendar, Heart, MessageSquare, AlertCircle, Filter, WifiOff, type LucideIcon } from 'lucide-react';

type Variant = 'default' | 'search' | 'filter' | 'offline' | 'sermons' | 'music' | 'programs' | 'giving' | 'devotionals';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: Variant;
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
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = 'default'
}: EmptyStateProps) {
  const Icon = icon || (variant !== 'default' ? iconMap[variant] : AlertCircle);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-100/50 flex items-center justify-center mb-4 border border-cream-200">
        <Icon className="w-8 h-8 text-cream-400" />
      </div>
      <h3 className="text-lg font-semibold text-wine-900 mb-2">{title}</h3>
      <p className="text-sm text-cream-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-secondary text-sm px-4 py-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function SearchEmptyState({ 
  query, 
  onClearFilters,
  hasFilters = false 
}: { 
  query: string; 
  onClearFilters?: () => void;
  hasFilters?: boolean;
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
      action={hasFilters && onClearFilters ? {
        label: 'Clear filters',
        onClick: onClearFilters,
      } : undefined}
    />
  );
}

export function FilterEmptyState({ 
  onClearFilters 
}: { 
  onClearFilters: () => void;
}) {
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
  );
}

export function OfflineEmptyState({ 
  onRetry 
}: { 
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="offline"
      title="You're offline"
      description="Connect to the internet to load content. Previously viewed content may still be available."
      action={onRetry ? {
        label: 'Try again',
        onClick: onRetry,
      } : undefined}
    />
  );
}

export function CategoryEmptyState({ 
  category 
}: { 
  category: 'sermons' | 'music' | 'programs' | 'giving' | 'devotionals';
}) {
  return (
    <EmptyState
      variant={category}
      title={`No ${category} yet`}
      description={`There are no ${category.toLowerCase()} available at the moment. Check back soon!`}
    />
  );
}