import { useState, useRef, useCallback, useEffect } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Eye, Plus, Sparkle, Link as LinkIcon, ImageSquare, PaintBrush,
  Briefcase, Barbell, Heart, CurrencyDollar, GraduationCap,
  Airplane, House, Users, Star, UploadSimple, DotsSixVertical,
  Columns, GridFour, MagnifyingGlass,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import VisionCard, { CATEGORIES, CATEGORY_ICONS } from '@/components/vision/VisionCard';
import DrawingCanvas from '@/components/vision/DrawingCanvas';

export default function VisionBoardPage() {
  const { user } = useAuth();
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
  const [uploading, setUploading]     = useState(false);
  const [imageTab, setImageTab]       = useState('upload');
  const [viewMode, setViewMode]       = useState<'board' | 'grid'>('board');
  const [dragId, setDragId]           = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Upload ───────────────────────────────────────────── */
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('vision-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('vision-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setImageUrl(url);
  };

  const handleDrawingSave = async (dataUrl: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const path = `${user.id}/drawing-${Date.now()}.png`;
      const { error } = await supabase.storage.from('vision-images').upload(path, blob, { contentType: 'image/png' });
      if (error) throw error;
      const { data } = supabase.storage.from('vision-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success('Drawing saved!');
    } catch (err: any) {
      toast.error('Drawing upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

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

  /* ── Drag & drop for board view ─────────────────────── */
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragEnd = () => setDragId(null);
  const handleDrop = async (targetCategory: string) => {
    if (!dragId) return;
    const item = items?.find(i => i.id === dragId);
    if (item && item.category !== targetCategory) {
      await updateItem.mutateAsync({ id: dragId, category: targetCategory });
      toast.success(`Moved to ${CATEGORIES.find(c => c.value === targetCategory)?.label}`);
    }
    setDragId(null);
  };

  const filteredItems  = items?.filter(i => !filter || i.category === filter) || [];
  const achievedCount  = items?.filter(i => i.is_achieved).length || 0;
  const totalCount     = items?.length || 0;
  const progressPct    = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  /* Group by category for board view */
  const groupedByCategory = CATEGORIES
    .map(cat => ({
      ...cat,
      items: (items || [])
        .filter(i => i.category === cat.value)
        .sort((a, b) => (a.is_achieved === b.is_achieved ? 0 : a.is_achieved ? 1 : -1)),
    }))
    .filter(g => g.items.length > 0 || filter === g.value);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Eye className="h-4.5 w-4.5 text-primary" weight="duotone" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">Vision Board</h1>
              {totalCount > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {achievedCount}/{totalCount} achieved · {progressPct}%
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'board'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Columns className="h-3.5 w-3.5" weight="bold" /> Board
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <GridFour className="h-3.5 w-3.5" weight="bold" /> Grid
              </button>
            </div>

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <button className="btn-primary h-8 px-3 text-xs gap-1.5 rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
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

                  {/* Category */}
                  <div>
                    <label className="section-label block mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORIES.map(cat => {
                        const CatIcon = CATEGORY_ICONS[cat.value] || Star;
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

                  {/* Image */}
                  <div>
                    <label className="section-label block mb-2">Image</label>
                    <Tabs value={imageTab} onValueChange={setImageTab}>
                      <TabsList className="w-full grid grid-cols-3 h-8">
                        <TabsTrigger value="upload" className="text-xs gap-1">
                          <UploadSimple className="h-3 w-3" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="text-xs gap-1">
                          <LinkIcon className="h-3 w-3" /> URL
                        </TabsTrigger>
                        <TabsTrigger value="draw" className="text-xs gap-1">
                          <PaintBrush className="h-3 w-3" /> Draw
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload" className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ImageSquare className="h-6 w-6" />
                          <span className="text-xs font-medium">
                            {uploading ? 'Uploading…' : 'Click to upload an image'}
                          </span>
                        </button>
                      </TabsContent>

                      <TabsContent value="url" className="mt-2">
                        <Input
                          value={imageUrl}
                          onChange={e => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="pro-input"
                        />
                      </TabsContent>

                      <TabsContent value="draw" className="mt-2">
                        <DrawingCanvas onSave={handleDrawingSave} />
                      </TabsContent>
                    </Tabs>

                    {imageUrl && (
                      <div className="mt-2 rounded-md overflow-hidden border border-border">
                        <img src={imageUrl} alt="Preview" className="w-full h-28 object-cover" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={!title.trim() || createItem.isPending || uploading}
                    className="btn-primary w-full h-9"
                  >
                    {createItem.isPending ? 'Adding…' : 'Add to Vision Board'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-primary">{progressPct}%</span>
          </div>
        )}

        {/* Category filter pills */}
        {totalCount > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                'px-2.5 h-6 rounded-full text-[11px] font-medium transition-colors',
                filter === null
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {CATEGORIES.filter(c => items?.some(i => i.category === c.value)).map(cat => {
              const count = items?.filter(i => i.category === cat.value).length || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter(filter === cat.value ? null : cat.value)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-medium transition-colors',
                    filter === cat.value
                      ? 'text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  style={filter === cat.value ? { background: cat.color } : {}}
                >
                  {cat.label} · {count}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-xl" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkle className="h-8 w-8 text-primary" weight="duotone" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">
                Your vision board is empty
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                Add images, notes, and goals to visualize the life you want to build.
              </p>
              <button onClick={() => setShowCreate(true)} className="btn-primary h-9 px-5 text-sm gap-1.5 rounded-lg">
                <Plus className="h-4 w-4" /> Add First Vision
              </button>
            </div>
          </div>
        ) : viewMode === 'board' ? (
          /* ── BOARD VIEW (Milanote-style columns) ─── */
          <div className="flex gap-4 p-5 min-w-max">
            {(filter ? groupedByCategory.filter(g => g.value === filter) : groupedByCategory).map(group => {
              const CatIcon = CATEGORY_ICONS[group.value] || Star;
              return (
                <div
                  key={group.value}
                  className="w-72 shrink-0 flex flex-col"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(group.value)}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center"
                      style={{ background: group.color + '18', border: `1px solid ${group.color}30` }}
                    >
                      <CatIcon className="h-3.5 w-3.5" style={{ color: group.color }} weight="duotone" />
                    </div>
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium ml-auto">
                      {group.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 flex-1">
                    {group.items.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <VisionCard
                          item={item}
                          isDragging={dragId === item.id}
                          onUpdate={async (updates) => {
                            await updateItem.mutateAsync({ id: item.id, ...updates });
                            if (updates.is_achieved) toast.success(`"${item.title}" achieved! 🎉`);
                          }}
                          onDelete={async () => {
                            await deleteItem.mutateAsync(item.id);
                            toast.success('Vision removed');
                          }}
                        />
                      </div>
                    ))}

                    {/* Drop zone hint */}
                    {dragId && (
                      <div className="h-20 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center text-xs text-primary/50 font-medium">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add column placeholder for unused categories */}
            {!filter && groupedByCategory.length < CATEGORIES.length && (
              <div className="w-72 shrink-0 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 min-h-[200px]">
                <p className="text-xs text-muted-foreground text-center px-4">
                  Add visions to other categories to see more columns
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── GRID VIEW ───────────────────────────── */
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems
                .sort((a, b) => (a.is_achieved === b.is_achieved ? 0 : a.is_achieved ? 1 : -1))
                .map(item => (
                  <VisionCard
                    key={item.id}
                    item={item}
                    onUpdate={async (updates) => {
                      await updateItem.mutateAsync({ id: item.id, ...updates });
                      if (updates.is_achieved) toast.success(`"${item.title}" achieved! 🎉`);
                    }}
                    onDelete={async () => {
                      await deleteItem.mutateAsync(item.id);
                      toast.success('Vision removed');
                    }}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
