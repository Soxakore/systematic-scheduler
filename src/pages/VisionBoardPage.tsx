import { useState } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Eye, Plus, Trophy, Trash, Check, Sparkle, Heart, Briefcase,
  Barbell, GraduationCap, House, Airplane, CurrencyDollar, Users, Star,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'career',        label: 'Career',        icon: Briefcase,     color: '#6366f1' },
  { value: 'health',        label: 'Health',         icon: Barbell,      color: '#22c55e' },
  { value: 'relationships', label: 'Relationships',  icon: Heart,         color: '#ec4899' },
  { value: 'finance',       label: 'Finance',        icon: CurrencyDollar,    color: '#eab308' },
  { value: 'learning',      label: 'Learning',       icon: GraduationCap, color: '#3b82f6' },
  { value: 'travel',        label: 'Travel',         icon: Airplane,         color: '#14b8a6' },
  { value: 'home',          label: 'House',           icon: House,          color: '#f97316' },
  { value: 'social',        label: 'Social',         icon: Users,         color: '#a855f7' },
  { value: 'general',       label: 'General',        icon: Star,          color: '#64748b' },
];

function VisionCard({ item, onUpdate, onDelete }: {
  item: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];
  const Icon = cat.icon;

  return (
    <div className={cn(
      'group surface p-4 transition-colors',
      item.is_achieved && 'opacity-60'
    )}>
      {/* Category */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: cat.color + '18', border: `1px solid ${cat.color}30` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cat.color }}>
          {cat.label}
        </span>
        {item.is_achieved && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <Trophy className="h-3 w-3" /> Done
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-sm text-foreground mb-1 leading-snug',
        item.is_achieved && 'line-through text-muted-foreground'
      )}>
        {item.title}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
      )}

      {/* Image */}
      {item.image_url && (
        <div className="mb-3 rounded-md overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
          <img src={item.image_url} alt={item.title} className="w-full h-28 object-cover" />
        </div>
      )}

      {/* Actions — on hover */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
        {!item.is_achieved ? (
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-emerald-400 border border-emerald-700/40 bg-emerald-900/20 hover:bg-emerald-900/40 transition-colors"
            onClick={() => onUpdate({ is_achieved: true, achieved_at: new Date().toISOString() })}
          >
            <Check className="h-3 w-3" /> Achieved
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
          <Trash className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function VisionBoardPage() {
  const { data: items, isLoading } = useVisionBoardItems();
  const createItem = useCreateVisionBoardItem();
  const updateItem = useUpdateVisionBoardItem();
  const deleteItem = useDeleteVisionBoardItem();

  const [showCreate, setShowCreate]   = useState(false);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('general');
  const [imageUrl, setImageUrl]       = useState('');
  const [filter, setFilter]           = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[8];
    await createItem.mutateAsync({
      title:       title.trim(),
      description: description.trim(),
      category,
      color:       cat.color,
      icon:        'star',
      position_x:  0,
      position_y:  0,
      width:       200,
      height:      150,
      image_url:   imageUrl.trim() || null,
      is_achieved: false,
      achieved_at: null,
      sort_order:  (items?.length || 0),
    });
    setTitle(''); setDescription(''); setCategory('general'); setImageUrl('');
    setShowCreate(false);
    toast.success('Vision added');
  };

  const filteredItems  = items?.filter(i => !filter || i.category === filter) || [];
  const achievedCount  = items?.filter(i => i.is_achieved).length || 0;
  const totalCount     = items?.length || 0;
  const progressPct    = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              Vision Board
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 ml-10">
              {totalCount > 0
                ? `${achievedCount} of ${totalCount} achieved · ${progressPct}%`
                : 'Visualize your goals and aspirations.'}
            </p>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button className="btn-primary h-8 px-3 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Vision
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-primary" /> New Vision
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Your vision or dream…"
                  className="pro-input"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                />
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="How will you feel when you achieve this?"
                  className="pro-input min-h-[72px]"
                />
                <div>
                  <label className="section-label block mb-2">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(cat => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors border',
                            category === cat.value
                              ? 'border-primary/40 bg-primary/10 font-semibold text-foreground'
                              : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                          )}
                        >
                          <CatIcon className="h-3.5 w-3.5 shrink-0" style={{ color: cat.color }} />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="pro-input"
                />
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || createItem.isPending}
                  className="btn-primary w-full h-9"
                >
                  {createItem.isPending ? 'Adding…' : 'Add to Vision Board'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="surface p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Overall Progress</span>
              <span className="text-primary font-semibold">{progressPct}%</span>
            </div>
            <div className="pro-progress-track">
              <div className="pro-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Category filter */}
        {totalCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                'px-3 h-7 rounded-full text-xs font-medium transition-colors border',
                filter === null
                  ? 'bg-primary text-white border-primary/50'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              All ({totalCount})
            </button>
            {CATEGORIES.filter(c => items?.some(i => i.category === c.value)).map(cat => {
              const count   = items?.filter(i => i.category === cat.value).length || 0;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter(filter === cat.value ? null : cat.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors border',
                    filter === cat.value
                      ? 'text-white border-transparent'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  style={filter === cat.value ? { background: cat.color } : {}}
                >
                  <CatIcon className="h-3 w-3" />
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="surface p-12 text-center">
            <Sparkle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground text-sm mb-1">
              {filter ? 'No visions here' : 'Your vision board is empty'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {filter ? 'Try a different category.' : 'Add your dreams and aspirations.'}
            </p>
            {!filter && (
              <button onClick={() => setShowCreate(true)} className="btn-primary h-8 px-4 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add First Vision
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {filteredItems
              .sort((a, b) => (a.is_achieved === b.is_achieved ? 0 : a.is_achieved ? 1 : -1))
              .map(item => (
                <VisionCard
                  key={item.id}
                  item={item}
                  onUpdate={async (updates) => {
                    await updateItem.mutateAsync({ id: item.id, ...updates });
                    if (updates.is_achieved) toast.success(`"${item.title}" achieved`);
                  }}
                  onDelete={async () => {
                    await deleteItem.mutateAsync(item.id);
                    toast.success('Vision removed');
                  }}
                />
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
