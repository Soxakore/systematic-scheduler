import { useState } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Eye, Plus, Trophy, Trash2, Check, Sparkles, Heart, Briefcase, Dumbbell, GraduationCap, Home, Plane, DollarSign, Users, Star } from 'lucide-react';

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
      className={`group relative rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
        item.is_achieved ? 'opacity-75 border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'hover:border-primary/30'
      }`}
      style={{ borderColor: item.is_achieved ? undefined : cat.color + '40' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
          <Icon className="h-4 w-4" style={{ color: cat.color }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cat.label}</span>
        {item.is_achieved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <Trophy className="h-3.5 w-3.5" /> Achieved
          </span>
        )}
      </div>

      <h3 className={`font-semibold text-base mb-1 ${item.is_achieved ? 'line-through' : ''}`}>
        {item.title}
      </h3>
      {item.description && (
        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
      )}

      {item.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
        </div>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!item.is_achieved ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => onUpdate({ is_achieved: true, achieved_at: new Date().toISOString() })}
          >
            <Check className="h-3 w-3" /> Mark Achieved
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onUpdate({ is_achieved: false, achieved_at: null })}
          >
            Undo
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
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
    setTitle('');
    setDescription('');
    setCategory('general');
    setImageUrl('');
    setShowCreate(false);
    toast.success('Vision added to your board!');
  };

  const filteredItems = items?.filter(i => !filter || i.category === filter) || [];
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;
  const totalCount = items?.length || 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Vision Board
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount > 0
                ? `${achievedCount}/${totalCount} visions achieved`
                : 'Visualize your future. Add your dreams and goals.'}
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" /> Add Vision
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> New Vision
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Your vision or dream..."
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                />
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe it... How will you feel when you achieve this?"
                  className="min-h-[80px]"
                />
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                            category === cat.value
                              ? 'border-primary bg-primary/5 font-medium'
                              : 'border-transparent hover:bg-muted'
                          }`}
                        >
                          <CatIcon className="h-4 w-4" style={{ color: cat.color }} />
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
                />
                <Button onClick={handleCreate} className="w-full" disabled={!title.trim() || createItem.isPending}>
                  {createItem.isPending ? 'Adding...' : 'Add to Vision Board'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((achievedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(achievedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === null ? 'default' : 'outline'}
            onClick={() => setFilter(null)}
            className="h-8 text-xs"
          >
            All ({totalCount})
          </Button>
          {CATEGORIES.filter(c => items?.some(i => i.category === c.value)).map(cat => {
            const count = items?.filter(i => i.category === cat.value).length || 0;
            const CatIcon = cat.icon;
            return (
              <Button
                key={cat.value}
                size="sm"
                variant={filter === cat.value ? 'default' : 'outline'}
                onClick={() => setFilter(filter === cat.value ? null : cat.value)}
                className="h-8 text-xs gap-1"
              >
                <CatIcon className="h-3.5 w-3.5" />
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading your vision board...</div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-1">
                {filter ? 'No visions in this category' : 'Your vision board is empty'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter ? 'Try a different category or add a new vision.' : 'Add your dreams, goals, and aspirations to bring them to life.'}
              </p>
              {!filter && (
                <Button onClick={() => setShowCreate(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Your First Vision
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems
              .sort((a, b) => (a.is_achieved === b.is_achieved ? 0 : a.is_achieved ? 1 : -1))
              .map(item => (
                <VisionCard
                  key={item.id}
                  item={item}
                  onUpdate={async (updates) => {
                    await updateItem.mutateAsync({ id: item.id, ...updates });
                    if (updates.is_achieved) toast.success(`"${item.title}" achieved!`);
                  }}
                  onDelete={async () => {
                    await deleteItem.mutateAsync(item.id);
                    toast.success('Vision removed');
                  }}
                />
              ))}
          </div>
        )}

        {totalCount > 0 && (
          <div className="text-center py-4">
            <p className="text-sm italic text-muted-foreground">
              "The only way to do great work is to love what you do."
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
