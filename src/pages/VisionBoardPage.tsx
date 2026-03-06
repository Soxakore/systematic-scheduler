import { useState, useRef } from 'react';
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
  Airplane, House, Users, Star, UploadSimple,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import VisionCard, { CATEGORIES } from '@/components/vision/VisionCard';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CATEGORY_ICONS: Record<string, any> = {
    career: Briefcase, health: Barbell, relationships: Heart,
    finance: CurrencyDollar, learning: GraduationCap, travel: Airplane,
    home: House, social: Users, general: Star,
  };

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
                <Eye className="h-4 w-4 text-primary" weight="duotone" />
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

                {/* Image: Upload / URL / Draw */}
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

                  {/* Preview */}
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
                  ? 'bg-primary text-primary-foreground border-primary/50'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              All ({totalCount})
            </button>
            {CATEGORIES.filter(c => items?.some(i => i.category === c.value)).map(cat => {
              const count = items?.filter(i => i.category === cat.value).length || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter(filter === cat.value ? null : cat.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors border',
                    filter === cat.value
                      ? 'text-primary-foreground border-transparent'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  style={filter === cat.value ? { background: cat.color } : {}}
                >
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
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <Sparkle className="h-7 w-7 text-primary" weight="duotone" />
            </div>
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
