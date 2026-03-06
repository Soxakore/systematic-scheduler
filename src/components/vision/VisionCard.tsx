import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Trash, Check, ArrowsOutSimple, ArrowsInSimple } from '@phosphor-icons/react';

const CATEGORIES = [
  { value: 'career',        label: 'Career',        color: '#6366f1' },
  { value: 'health',        label: 'Health',         color: '#22c55e' },
  { value: 'relationships', label: 'Relationships',  color: '#ec4899' },
  { value: 'finance',       label: 'Finance',        color: '#eab308' },
  { value: 'learning',      label: 'Learning',       color: '#3b82f6' },
  { value: 'travel',        label: 'Travel',         color: '#14b8a6' },
  { value: 'home',          label: 'House',           color: '#f97316' },
  { value: 'social',        label: 'Social',         color: '#a855f7' },
  { value: 'general',       label: 'General',        color: '#64748b' },
];

export { CATEGORIES };

export default function VisionCard({ item, onUpdate, onDelete }: {
  item: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];

  return (
    <div className={cn(
      'group surface transition-all',
      item.is_achieved && 'opacity-60',
      expanded ? 'col-span-1 sm:col-span-2 lg:col-span-3 p-5' : 'p-4'
    )}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: cat.color + '18', border: `1px solid ${cat.color}30` }}
        >
          <div className="h-3.5 w-3.5 rounded-sm" style={{ background: cat.color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cat.color }}>
          {cat.label}
        </span>
        {item.is_achieved && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <Trophy className="h-3 w-3" weight="fill" /> Done
          </span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded
            ? <ArrowsInSimple className="h-3.5 w-3.5" weight="bold" />
            : <ArrowsOutSimple className="h-3.5 w-3.5" weight="bold" />}
        </button>
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-foreground leading-snug',
        item.is_achieved && 'line-through text-muted-foreground',
        expanded ? 'text-base mb-2' : 'text-sm mb-1'
      )}>
        {item.title}
      </h3>

      {/* Description — always shown if expanded, truncated otherwise */}
      {item.description && (
        <p className={cn(
          'text-xs text-muted-foreground leading-relaxed',
          expanded ? 'mb-4' : 'mb-3 line-clamp-2'
        )}>
          {item.description}
        </p>
      )}

      {/* Image */}
      {item.image_url && (
        <div
          className={cn(
            'rounded-md overflow-hidden',
            expanded ? 'mb-4' : 'mb-3'
          )}
          style={{ border: '1px solid hsl(var(--border))' }}
        >
          <img
            src={item.image_url}
            alt={item.title}
            className={cn(
              'w-full object-cover transition-all',
              expanded ? 'max-h-96' : 'h-28'
            )}
          />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 mb-4 text-xs text-muted-foreground">
          {item.achieved_at && (
            <p>Achieved: {new Date(item.achieved_at).toLocaleDateString()}</p>
          )}
          <p>Created: {new Date(item.created_at).toLocaleDateString()}</p>
        </div>
      )}

      {/* Actions */}
      <div className={cn(
        'flex gap-1.5 pt-1 transition-opacity',
        expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {!item.is_achieved ? (
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-emerald-400 border border-emerald-700/40 bg-emerald-900/20 hover:bg-emerald-900/40 transition-colors"
            onClick={() => onUpdate({ is_achieved: true, achieved_at: new Date().toISOString() })}
          >
            <Check className="h-3 w-3" weight="bold" /> Achieved
          </button>
        ) : (
          <button
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-muted-foreground border border-border bg-secondary hover:bg-secondary/80 transition-colors"
            onClick={() => onUpdate({ is_achieved: false, achieved_at: null })}
          >
            Undo
          </button>
        )}
        <button
          className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-red-400 border border-red-900/40 bg-red-900/10 hover:bg-red-900/20 transition-colors ml-auto"
          onClick={onDelete}
        >
          <Trash className="h-3 w-3" weight="bold" />
        </button>
      </div>
    </div>
  );
}
