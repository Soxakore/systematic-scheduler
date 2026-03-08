import { useState, useRef, useCallback, useEffect } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Note, LinkSimple, ListChecks, LineSegment, SquaresFour,
  Columns, ChatText, ImageSquare, UploadSimple, PaintBrush,
  Trash, Plus, Star, MagnifyingGlass, DotsThreeOutline,
  Briefcase, Barbell, Heart, CurrencyDollar, GraduationCap,
  Airplane, House, Users,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import VisionCard, { CATEGORIES, CATEGORY_ICONS } from '@/components/vision/VisionCard';
import DrawingCanvas from '@/components/vision/DrawingCanvas';

type ToolType = 'note' | 'link' | 'image' | 'draw' | null;

export default function VisionBoardPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useVisionBoardItems();
  const createItem = useCreateVisionBoardItem();
  const updateItem = useUpdateVisionBoardItem();
  const deleteItem = useDeleteVisionBoardItem();

  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState('upload');

  // Canvas pan/zoom
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    const count = items?.length || 0;
    // Place new items in a grid-like pattern
    const col = count % 4;
    const row = Math.floor(count / 4);
    await createItem.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      category,
      color: cat.color,
      icon: 'star',
      position_x: 40 + col * 280,
      position_y: 40 + row * 260,
      width: 240,
      height: 200,
      image_url: imageUrl.trim() || null,
      is_achieved: false,
      achieved_at: null,
      sort_order: count,
    });
    setTitle(''); setDescription(''); setCategory('general'); setImageUrl('');
    setShowCreate(false);
    setActiveTool(null);
    toast.success('Vision added');
  };

  const handleToolClick = (tool: ToolType) => {
    if (tool === activeTool) {
      setActiveTool(null);
      return;
    }
    setActiveTool(tool);
    if (tool === 'note' || tool === 'link' || tool === 'image') {
      setShowCreate(true);
      if (tool === 'image') setImageTab('upload');
      if (tool === 'link') setImageTab('url');
    }
    if (tool === 'draw') {
      setShowCreate(true);
      setImageTab('draw');
    }
  };

  /* ── Freeform drag on canvas ─────────────────────── */
  const handleItemMouseDown = (e: React.MouseEvent, itemId: string, posX: number, posY: number) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingItem(itemId);
    setDragOffset({ x: e.clientX - posX, y: e.clientY - posY });
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingItem) return;
    const item = items?.find(i => i.id === draggingItem);
    if (!item) return;
    // We update position visually via style, actual save on mouseUp
  }, [draggingItem, items]);

  const handleCanvasMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (!draggingItem) return;
    const newX = Math.max(0, e.clientX - dragOffset.x);
    const newY = Math.max(0, e.clientY - dragOffset.y);
    await updateItem.mutateAsync({ id: draggingItem, position_x: Math.round(newX), position_y: Math.round(newY) });
    setDraggingItem(null);
  }, [draggingItem, dragOffset, updateItem]);

  const totalCount = items?.length || 0;
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;

  const TOOLS = [
    { id: 'note' as ToolType, icon: Note, label: 'Note' },
    { id: 'link' as ToolType, icon: LinkSimple, label: 'Link' },
    { id: 'image' as ToolType, icon: ImageSquare, label: 'Add image' },
    { id: 'draw' as ToolType, icon: PaintBrush, label: 'Draw' },
  ];

  return (
    <div className="h-full overflow-hidden flex">
      {/* ── Left Toolbar (Milanote-style) ──────────────── */}
      <div className="shrink-0 w-16 border-r border-border bg-background flex flex-col items-center py-3 gap-1">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={cn(
              'flex flex-col items-center justify-center w-12 h-12 rounded-xl text-[10px] font-medium transition-all gap-0.5',
              activeTool === tool.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <tool.icon className="h-5 w-5" weight={activeTool === tool.id ? 'fill' : 'regular'} />
            {tool.label}
          </button>
        ))}

        <div className="w-8 h-px bg-border my-2" />

        {/* Quick add */}
        <button
          onClick={() => { setActiveTool('note'); setShowCreate(true); }}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all gap-0.5"
        >
          <Plus className="h-5 w-5" weight="bold" />
          Add
        </button>

        <div className="mt-auto" />

        {/* Trash zone */}
        <button className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-[10px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all gap-0.5">
          <Trash className="h-5 w-5" />
          Trash
        </button>
      </div>

      {/* ── Canvas Area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 h-12 border-b border-border bg-background flex items-center px-4 gap-3">
          <h1 className="text-sm font-semibold text-foreground">Vision Board</h1>
          {totalCount > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {achievedCount}/{totalCount} achieved
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setActiveTool('note'); setShowCreate(true); }}
              className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Vision
            </button>
          </div>
        </div>

        {/* Freeform canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto relative"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundColor: 'hsl(var(--secondary))',
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => setDraggingItem(null)}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading…</div>
            </div>
          ) : totalCount === 0 ? (
            /* Empty state */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                  <SquaresFour className="h-10 w-10 text-primary" weight="duotone" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  Start your vision board
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  Use the toolbar on the left to add notes, images, links, or drawings. 
                  Drag items freely on the canvas to arrange your dreams.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setActiveTool('note'); setShowCreate(true); }}
                    className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <Note className="h-4 w-4" /> Add a note
                  </button>
                  <button
                    onClick={() => { setActiveTool('image'); setShowCreate(true); setImageTab('upload'); }}
                    className="h-9 px-5 rounded-lg bg-secondary text-foreground text-sm font-medium flex items-center gap-2 border border-border hover:bg-secondary/80 transition-colors"
                  >
                    <ImageSquare className="h-4 w-4" /> Add image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Freeform positioned cards */
            <div className="relative min-w-[1600px] min-h-[1200px]">
              {items?.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'absolute transition-shadow',
                    draggingItem === item.id ? 'z-50 cursor-grabbing' : 'cursor-grab'
                  )}
                  style={{
                    left: item.position_x,
                    top: item.position_y,
                    width: item.width || 240,
                  }}
                  onMouseDown={(e) => handleItemMouseDown(e, item.id, item.position_x, item.position_y)}
                >
                  <VisionCard
                    item={item}
                    isDragging={draggingItem === item.id}
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
            </div>
          )}
        </div>
      </div>

      {/* ── Create Dialog ──────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setActiveTool(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Note className="h-4 w-4 text-primary" weight="duotone" /> New Vision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Your vision or dream…"
              className="pro-input"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && title.trim()) handleCreate(); }}
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
                    <LinkSimple className="h-3 w-3" /> URL
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
  );
}
