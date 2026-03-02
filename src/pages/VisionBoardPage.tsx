import { useState } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Eye, Plus, Trophy, Trash2, Check, Sparkles, Heart, Briefcase, Dumbbell, GraduationCap, Home, Plane, DollarSign, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'career', label: 'Career', icon: Briefcase, color: '#6366f1' },
  { value: 'health', label: 'Health', icon: Dumbbell, color: '#22c55e' },
  { value: 'relationships', label: 'Relationships', icon: Heart, color: '#ec4899' },
  { value: 'finance', label: 'Finance', icon: DollarSign, color: '#eab308' },
  { value: 'learning', label: 'Learning', icon: GraduationCap, color: '#3b82f6' },
  { value: 'travel', label: 'Travel', icon: Plane, color: '#14b8a6' },
  { value: 'home', label: 'Home', icon: Home, color: '#f97316' },
  { value: 'social', label: 'Social', icon: Users, color: '#a855f7' },
  { value: 'general', label: 'General', icon: Star, color: '#64748b' },
];

function VisionCard({ item, onUpdate, onDelete }: {
  item: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];
  const Icon = cat.icon;

  return (
    <div
      className={cn(
        'group glass-card glass-hover p-4 transition-all duration-300',
        item.is_achieved && 'opacity-70'
      )}
      style={{
        borderColor: item.is_achieved ? 'rgba(34,197,94,0.3)' : cat.color + '30',
        boxShadow: item.is_achieved
          ? '0 0 20px rgba(34,197,94,0.1)'
          : `0 0 20px ${cat.color}15`,
      }}
    >
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.color + '20' }}
        >
          <Icon className="h-4 w-4" style={{ color: cat.color }} />
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: cat.color }}
        >
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
        item.is_achieved && 'line-through opacity-60'
      )}>
        {item.title}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
      )}

      {/* Image */}
      {item.image_url && (
        <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
          <img src={item.image_url} alt={item.title} className="w-full h-28 object-cover" />
        </div>
      )}

      {/* Actions — appear on hover */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pt-1">
        {!item.is_achieved ? (
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
            onClick={() => onUpdate({ is_achieved: true, achieved_at: new Date().toISOString() })}
          >
            <Check className="h-3 w-3" /> Achieved
          </button>
        ) : (
          <button
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => onUpdate({ is_achieved: false, achieved_at: null })}
          >
            Undo
          </button>
        )}
        <button
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors ml-auto"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
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

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [imageUrl, setImageUrl] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[8];
    await createItem.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      category,
      color: cat.color,
      icon: 'star',
      position_x: 0,
      position_y: 0,
      width: 200,
      height: 150,
      image_url: imageUrl.trim() || null,
      is_achieved: false,
      achieved_at: null,
      sort_order: (items?.length || 0),
    });
    setTitle(''); setDescription(''); setCategory('general'); setImageUrl('');
    setShowCreate(false);
    toast.success('Vision added! ✨');
  };

  const filteredItems = items?.filter(i => !filter || i.category === filter) || [];
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;
  const totalCount = items?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div className="fade-up flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <span className="gradient-text">Vision Board</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 ml-[52px]">
              {totalCount > 0
                ? `${achievedCount} of ${totalCount} visions achieved · ${progressPct}%`
                : 'Visualize your future. Dream it, then build it.'}
            </p>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button className="glass-button-primary px-4 h-9 rounded-xl flex items-center gap-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> Add Vision
              </button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 bg-[hsl(230,25%,10%)]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 gradient-text">
                  <Sparkles className="h-5 w-5 text-primary" /> New Vision
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Your vision or dream..."
                  className="glass-input"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                />
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="How will you feel when you achieve this?"
                  className="glass-input min-h-[80px]"
                />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(cat => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all border',
                            category === cat.value
                              ? 'border-primary/40 bg-primary/10 font-semibold text-foreground'
                              : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
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
                  className="glass-input"
                />
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || createItem.isPending}
                  className="glass-button-primary w-full h-10 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
                >
                  {createItem.isPending ? 'Adding...' : 'Add to Vision Board ✨'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="glass-card p-4 fade-up">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Overall Progress</span>
              <span className="text-primary font-bold">{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, hsl(248, 87%, 70%), #22c55e)',
                  boxShadow: '0 0 12px rgba(139,92,246,0.5)',
                }}
              />
            </div>
          </div>
        )}

        {/* Category filter chips */}
        {totalCount > 0 && (
          <div className="flex gap-2 flex-wrap fade-up">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                'px-3 h-7 rounded-full text-xs font-semibold transition-all border',
                filter === null
                  ? 'bg-primary text-white border-primary/50 shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
              )}
            >
              All ({totalCount})
            </button>
            {CATEGORIES.filter(c => items?.some(i => i.category === c.value)).map(cat => {
              const count = items?.filter(i => i.category === cat.value).length || 0;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter(filter === cat.value ? null : cat.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold transition-all border',
                    filter === cat.value
                      ? 'text-white border-transparent'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                  )}
                  style={filter === cat.value ? {
                    background: cat.color,
                    boxShadow: `0 0 12px ${cat.color}60`,
                  } : {}}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 h-32 shimmer" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-card p-12 text-center fade-up">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary/40" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {filter ? 'No visions here' : 'Your vision board is empty'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {filter ? 'Try a different category.' : 'Add your dreams and aspirations.'}
            </p>
            {!filter && (
              <button
                onClick={() => setShowCreate(true)}
                className="glass-button-primary px-5 h-9 rounded-xl text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4 inline mr-1" /> Add First Vision
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {filteredItems
              .sort((a, b) => (a.is_achieved === b.is_achieved ? 0 : a.is_achieved ? 1 : -1))
              .map(item => (
                <VisionCard
                  key={item.id}
                  item={item}
                  onUpdate={async (updates) => {
                    await updateItem.mutateAsync({ id: item.id, ...updates });
                    if (updates.is_achieved) toast.success(`"${item.title}" achieved! 🏆`);
                  }}
                  onDelete={async () => {
                    await deleteItem.mutateAsync(item.id);
                    toast.success('Vision removed');
                  }}
                />
              ))}
          </div>
        )}

        {/* Motivational quote */}
        {totalCount > 0 && (
          <div className="text-center py-4 fade-up">
            <p className="text-xs italic text-muted-foreground/50">
              "The future belongs to those who believe in the beauty of their dreams."
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
