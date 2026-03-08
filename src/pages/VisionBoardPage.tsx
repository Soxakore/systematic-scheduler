import { useState, useRef, useCallback, useEffect } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Note, LinkSimple, ImageSquare, PaintBrush,
  Trash, Plus, SquaresFour, Star, Hand, Cursor,
  Check, Trophy, X,
  Briefcase, Barbell, Heart, CurrencyDollar, GraduationCap,
  Airplane, House, Users,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { CATEGORIES, CATEGORY_ICONS } from '@/components/vision/VisionCard';

type ToolMode = 'select' | 'note' | 'draw';

interface CanvasItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  color: string | null;
  image_url: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_achieved: boolean;
}

export default function VisionBoardPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useVisionBoardItems();
  const createItem = useCreateVisionBoardItem();
  const updateItem = useUpdateVisionBoardItem();
  const deleteItem = useDeleteVisionBoardItem();

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  // Dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragItemStart, setDragItemStart] = useState({ x: 0, y: 0 });
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const titleInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const totalCount = items?.length || 0;
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;

  /* ── Click on canvas to create a note ─────────────── */
  const handleCanvasClick = async (e: React.MouseEvent) => {
    // Only create on direct canvas click, not on cards
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('canvas-bg')) return;
    if (toolMode !== 'note') return;
    if (!user) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    const count = items?.length || 0;
    const newItem = await createItem.mutateAsync({
      title: '',
      description: '',
      category: 'general',
      color: '#64748b',
      icon: 'star',
      position_x: Math.round(x - 120),
      position_y: Math.round(y - 20),
      width: 240,
      height: 160,
      image_url: null,
      is_achieved: false,
      achieved_at: null,
      sort_order: count,
    });

    // Focus the new card for editing
    if (newItem?.id) {
      setEditingId(newItem.id);
      setEditTitle('');
      setEditDesc('');
      setTimeout(() => {
        titleInputRefs.current[newItem.id]?.focus();
      }, 100);
    }
  };

  /* ── File drop on canvas ──────────────────────────── */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!user) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploading(true);
      try {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from('vision-images').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('vision-images').getPublicUrl(path);

        await createItem.mutateAsync({
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category: 'general',
          color: '#64748b',
          icon: 'star',
          position_x: Math.round(x + i * 20 - 120),
          position_y: Math.round(y + i * 20 - 20),
          width: 260,
          height: 220,
          image_url: data.publicUrl,
          is_achieved: false,
          achieved_at: null,
          sort_order: (items?.length || 0) + i,
        });
      } catch (err: any) {
        toast.error('Upload failed: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
    toast.success(`${files.length} image(s) added`);
  };

  /* ── Card dragging ────────────────────────────────── */
  const handleCardMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    if (toolMode !== 'select' || editingId === item.id) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(item.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragItemStart({ x: item.position_x, y: item.position_y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragPositions(prev => ({
      ...prev,
      [draggingId]: {
        x: Math.max(0, dragItemStart.x + dx),
        y: Math.max(0, dragItemStart.y + dy),
      },
    }));
  }, [draggingId, dragStart, dragItemStart]);

  const handleMouseUp = useCallback(async () => {
    if (!draggingId) return;
    const pos = dragPositions[draggingId];
    if (pos) {
      await updateItem.mutateAsync({
        id: draggingId,
        position_x: Math.round(pos.x),
        position_y: Math.round(pos.y),
      });
    }
    setDraggingId(null);
    setDragPositions(prev => {
      const next = { ...prev };
      delete next[draggingId];
      return next;
    });
  }, [draggingId, dragPositions, updateItem]);

  /* ── Inline editing ───────────────────────────────── */
  const startEditing = (item: CanvasItem) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
    setEditDesc(item.description || '');
  };

  const saveEditing = async () => {
    if (!editingId) return;
    await updateItem.mutateAsync({
      id: editingId,
      title: editTitle.trim() || 'Untitled',
      description: editDesc.trim(),
    });
    setEditingId(null);
  };

  /* ── Render ───────────────────────────────────────── */
  const getItemPos = (item: CanvasItem) => {
    if (dragPositions[item.id]) return dragPositions[item.id];
    return { x: item.position_x, y: item.position_y };
  };

  const TOOLS = [
    { id: 'select' as ToolMode, icon: Cursor, label: 'Select' },
    { id: 'note' as ToolMode, icon: Note, label: 'Note' },
  ];

  return (
    <div className="h-full overflow-hidden flex">
      {/* ── Left Toolbar ───────────────────────────────── */}
      <div className="shrink-0 w-[60px] border-r border-border bg-background flex flex-col items-center py-3 gap-0.5">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setToolMode(tool.id)}
            className={cn(
              'flex flex-col items-center justify-center w-11 h-[52px] rounded-xl text-[9px] font-medium transition-all gap-0.5',
              toolMode === tool.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <tool.icon className="h-[18px] w-[18px]" weight={toolMode === tool.id ? 'fill' : 'regular'} />
            {tool.label}
          </button>
        ))}

        <div className="w-7 h-px bg-border my-1.5" />

        {/* Image upload */}
        <label className="flex flex-col items-center justify-center w-11 h-[52px] rounded-xl text-[9px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all gap-0.5 cursor-pointer">
          <ImageSquare className="h-[18px] w-[18px]" />
          Image
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length || !user) return;
              for (const file of files) {
                setUploading(true);
                try {
                  const ext = file.name.split('.').pop();
                  const path = `${user.id}/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from('vision-images').upload(path, file);
                  if (error) throw error;
                  const { data } = supabase.storage.from('vision-images').getPublicUrl(path);
                  await createItem.mutateAsync({
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    description: '',
                    category: 'general',
                    color: '#64748b',
                    icon: 'star',
                    position_x: 40 + Math.random() * 400,
                    position_y: 40 + Math.random() * 300,
                    width: 260,
                    height: 220,
                    image_url: data.publicUrl,
                    is_achieved: false,
                    achieved_at: null,
                    sort_order: items?.length || 0,
                  });
                } catch (err: any) {
                  toast.error('Upload failed: ' + err.message);
                } finally {
                  setUploading(false);
                }
              }
              toast.success('Image(s) added');
              e.target.value = '';
            }}
          />
        </label>

        <div className="mt-auto" />
      </div>

      {/* ── Canvas ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Minimal top bar */}
        <div className="shrink-0 h-10 border-b border-border bg-background flex items-center px-4">
          <h1 className="text-xs font-semibold text-foreground">Vision Board</h1>
          {totalCount > 0 && (
            <span className="text-[10px] text-muted-foreground ml-2">
              {achievedCount}/{totalCount} achieved
            </span>
          )}
          {uploading && (
            <span className="text-[10px] text-primary ml-3 animate-pulse">Uploading…</span>
          )}
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className={cn(
            'flex-1 overflow-auto relative',
            toolMode === 'note' ? 'cursor-crosshair' : 'cursor-default',
          )}
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border) / 0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundColor: 'hsl(var(--secondary) / 0.5)',
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
            </div>
          ) : totalCount === 0 ? (
            /* Empty state */
            <div className="canvas-bg absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-6 pointer-events-auto">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <SquaresFour className="h-8 w-8 text-primary" weight="duotone" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">
                  Your vision board
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  Select <strong>Note</strong> from the toolbar and click anywhere to write.
                  <br />
                  Drag & drop images directly onto the canvas.
                </p>
                <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5">
                    <Note className="h-4 w-4" /> Click to note
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ImageSquare className="h-4 w-4" /> Drop images
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hand className="h-4 w-4" /> Drag to move
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="canvas-bg relative" style={{ minWidth: 2000, minHeight: 1400 }}>
              {items?.map(item => {
                const pos = getItemPos(item as CanvasItem);
                const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];
                const CatIcon = CATEGORY_ICONS[item.category || 'general'] || Star;
                const isEditing = editingId === item.id;
                const isDragging = draggingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute group',
                      isDragging ? 'z-50' : 'z-10',
                      isDragging ? 'cursor-grabbing' : toolMode === 'select' ? 'cursor-grab' : '',
                    )}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: item.width || 240,
                    }}
                    onMouseDown={(e) => handleCardMouseDown(e, item as CanvasItem)}
                    onDoubleClick={() => startEditing(item as CanvasItem)}
                  >
                    <div
                      className={cn(
                        'bg-card rounded-xl overflow-hidden border transition-all duration-150',
                        isDragging
                          ? 'shadow-2xl scale-[1.03] rotate-[0.5deg] border-primary/30'
                          : 'shadow-sm hover:shadow-lg border-border',
                        item.is_achieved && 'opacity-60',
                      )}
                    >
                      {/* Image */}
                      {item.image_url && (
                        <div className="relative">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-36 object-cover"
                            draggable={false}
                          />
                          {item.is_achieved && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <Trophy className="h-7 w-7 text-emerald-400" weight="fill" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-3">
                        {/* Category indicator */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CatIcon className="h-3 w-3" style={{ color: cat.color }} weight="duotone" />
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                          {item.is_achieved && (
                            <span className="ml-auto text-[9px] font-semibold text-emerald-500 flex items-center gap-0.5">
                              <Check className="h-3 w-3" weight="bold" /> Done
                            </span>
                          )}
                        </div>

                        {/* Inline editing */}
                        {isEditing ? (
                          <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                            <textarea
                              ref={(el) => { titleInputRefs.current[item.id] = el; }}
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              placeholder="Title…"
                              className="w-full bg-transparent text-sm font-semibold text-foreground resize-none outline-none border-b border-primary/30 pb-1"
                              rows={1}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditing(); } }}
                              autoFocus
                            />
                            <textarea
                              value={editDesc}
                              onChange={e => setEditDesc(e.target.value)}
                              placeholder="Write your thoughts…"
                              className="w-full bg-transparent text-xs text-muted-foreground resize-none outline-none leading-relaxed"
                              rows={3}
                            />
                            <div className="flex justify-end gap-1 pt-1">
                              <button
                                onClick={() => setEditingId(null)}
                                className="h-6 px-2 rounded text-[10px] text-muted-foreground hover:bg-secondary"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEditing}
                                className="h-6 px-2 rounded text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className={cn(
                              'text-sm font-semibold text-foreground leading-snug',
                              item.is_achieved && 'line-through text-muted-foreground',
                              !item.title && 'text-muted-foreground italic',
                            )}>
                              {item.title || 'Untitled – double click to edit'}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-4">
                                {item.description}
                              </p>
                            )}
                          </>
                        )}

                        {/* Hover actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.is_achieved ? (
                              <button
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                onClick={(e) => { e.stopPropagation(); updateItem.mutateAsync({ id: item.id, is_achieved: true, achieved_at: new Date().toISOString() }); toast.success('Achieved! 🎉'); }}
                              >
                                <Check className="h-3 w-3" weight="bold" /> Done
                              </button>
                            ) : (
                              <button
                                className="px-1.5 py-0.5 rounded text-[9px] text-muted-foreground hover:bg-secondary transition-colors"
                                onClick={(e) => { e.stopPropagation(); updateItem.mutateAsync({ id: item.id, is_achieved: false, achieved_at: null }); }}
                              >
                                Undo
                              </button>
                            )}
                            <button
                              className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={(e) => { e.stopPropagation(); deleteItem.mutateAsync(item.id); toast.success('Removed'); }}
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
