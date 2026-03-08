import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Trophy, Trash, Check, DotsThreeVertical, PencilSimple,
  Briefcase, Barbell, Heart, CurrencyDollar, GraduationCap,
  Airplane, House, Users, Star, Note, Image as ImageIcon, ListChecks,
} from '@phosphor-icons/react';

const CATEGORIES = [
  { value: 'career',        label: 'Career',        color: '#6366f1' },
  { value: 'health',        label: 'Health',         color: '#22c55e' },
  { value: 'relationships', label: 'Relationships',  color: '#ec4899' },
  { value: 'finance',       label: 'Finance',        color: '#eab308' },
  { value: 'learning',      label: 'Learning',       color: '#3b82f6' },
  { value: 'travel',        label: 'Travel',         color: '#14b8a6' },
  { value: 'home',          label: 'House',          color: '#f97316' },
  { value: 'social',        label: 'Social',         color: '#a855f7' },
  { value: 'general',       label: 'General',        color: '#64748b' },
];

export { CATEGORIES };

export const CATEGORY_ICONS: Record<string, any> = {
  career: Briefcase, health: Barbell, relationships: Heart,
  finance: CurrencyDollar, learning: GraduationCap, travel: Airplane,
  home: House, social: Users, general: Star,
};

interface VisionCardProps {
  item: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export default function VisionCard({ item, onUpdate, onDelete, isDragging }: VisionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];
  const CatIcon = CATEGORY_ICONS[item.category] || Star;

  return (
    <div
      className={cn(
        'group bg-white dark:bg-[hsl(var(--card))] rounded-xl overflow-hidden transition-shadow duration-200 border border-black/[0.08] dark:border-white/[0.08]',
        isDragging
          ? 'shadow-2xl scale-[1.02] rotate-1 z-50'
          : 'shadow-sm hover:shadow-lg',
        item.is_achieved && 'opacity-60',
      )}
      style={{ width: '100%' }}
    >
      {/* Image */}
      {item.image_url && (
        <div className="relative">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-40 object-cover"
            draggable={false}
          />
          {item.is_achieved && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-emerald-400" weight="fill" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3.5">
        {/* Category tag */}
        <div className="flex items-center gap-1.5 mb-2">
          <CatIcon className="h-3 w-3" style={{ color: cat.color }} weight="duotone" />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: cat.color }}
          >
            {cat.label}
          </span>
          {item.is_achieved && (
            <span className="ml-auto text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5">
              <Check className="h-3 w-3" weight="bold" /> Done
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          'text-sm font-semibold text-foreground leading-snug mb-1',
          item.is_achieved && 'line-through text-muted-foreground',
        )}>
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Actions — hover reveal */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity">
          {!item.is_achieved ? (
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              onClick={() => onUpdate({ is_achieved: true, achieved_at: new Date().toISOString() })}
            >
              <Check className="h-3 w-3" weight="bold" /> Mark done
            </button>
          ) : (
            <button
              className="px-2 py-1 rounded-md text-[10px] font-semibold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
              onClick={() => onUpdate({ is_achieved: false, achieved_at: null })}
            >
              Undo
            </button>
          )}
          <button
            className="ml-auto p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={onDelete}
          >
            <Trash className="h-3.5 w-3.5" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
