import { useState, useRef, useCallback, useEffect } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Note, ImageSquare, PaintBrush, Eraser,
  Trash, SquaresFour, Star, Hand, Cursor,
  Check, Trophy, MagnifyingGlassPlus, MagnifyingGlassMinus,
  Palette, FloppyDisk,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { CATEGORIES, CATEGORY_ICONS } from '@/components/vision/VisionCard';

type ToolMode = 'select' | 'note' | 'pan' | 'draw' | 'eraser';

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

const DRAW_COLORS = ['#1a1a2e', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#ffffff'];
const BRUSH_SIZES = [2, 4, 8, 14];

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

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });

  // Item dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragItemStart, setDragItemStart] = useState({ x: 0, y: 0 });
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState(4);
  const [showDrawOptions, setShowDrawOptions] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const titleInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const totalCount = items?.length || 0;
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;

  const isDrawMode = toolMode === 'draw' || toolMode === 'eraser';

  /* ── Setup drawing canvas & load persisted drawing ── */
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !user) return;
    canvas.width = 4000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load persisted drawing
    const loadDrawing = async () => {
      try {
        const { data } = supabase.storage.from('vision-images').getPublicUrl(`${user.id}/canvas-drawing.png`);
        if (!data?.publicUrl) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = data.publicUrl + '?t=' + Date.now(); // cache-bust
      } catch {}
    };
    loadDrawing();
  }, [user]);

  /* ── Zoom via wheel / pinch ───────────────────────── */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.002;
        setZoom(prev => Math.min(3, Math.max(0.2, prev + delta)));
      } else {
        e.preventDefault();
        setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  /* ── Screen coords → canvas coords ───────────────── */
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  /* ── Drawing directly on canvas ───────────────────── */
  const getDrawCoords = useCallback((e: React.MouseEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Map screen coords to canvas pixel coords, accounting for CSS scaling
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleDrawStart = (e: React.MouseEvent) => {
    if (!isDrawMode) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    setIsDrawing(true);
    const { x, y } = getDrawCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = toolMode === 'eraser' ? 'rgba(0,0,0,0)' : drawColor;
    if (toolMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleDrawMove = (e: React.MouseEvent) => {
    if (!isDrawing || !isDrawMode) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getDrawCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
    // Auto-save drawing to storage
    persistDrawing();
  };

  const persistDrawingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistDrawing = () => {
    if (persistDrawingTimeout.current) clearTimeout(persistDrawingTimeout.current);
    persistDrawingTimeout.current = setTimeout(async () => {
      const canvas = drawCanvasRef.current;
      if (!canvas || !user) return;
      try {
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));
        const path = `${user.id}/canvas-drawing.png`;
        // Upsert: try upload, if exists then update
        await supabase.storage.from('vision-images').upload(path, blob, { contentType: 'image/png', upsert: true });
      } catch {}
    }, 1000); // debounce 1s
  };

  const clearDrawing = async () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Also clear from storage
    if (user) {
      try { await supabase.storage.from('vision-images').remove([`${user.id}/canvas-drawing.png`]); } catch {}
    }
    toast.success('Drawing cleared');
  };

  /* ── Click on canvas to create a note ─────────────── */
  const handleCanvasClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('canvas-surface') && target.tagName !== 'CANVAS') return;
    if (toolMode !== 'note') return;
    if (!user) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const count = items?.length || 0;
    const newItem: any = await createItem.mutateAsync({
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

    if (newItem?.id) {
      setEditingId(newItem.id);
      setEditTitle('');
      setEditDesc('');
      setTimeout(() => titleInputRefs.current[newItem.id]?.focus(), 100);
    }
  };

  /* ── File drop on canvas ──────────────────────────── */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!user) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

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

  /* ── Pan ──────────────────────────────────────────── */
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isDrawMode) {
      handleDrawStart(e);
      return;
    }
    if (e.button === 1 || (toolMode === 'pan' && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanOrigin({ ...pan });
    }
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
    if (isDrawing && isDrawMode) {
      handleDrawMove(e);
      return;
    }
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panOrigin.x + dx, y: panOrigin.y + dy });
      return;
    }
    if (!draggingId) return;
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    setDragPositions(prev => ({
      ...prev,
      [draggingId]: {
        x: Math.max(0, dragItemStart.x + dx),
        y: Math.max(0, dragItemStart.y + dy),
      },
    }));
  }, [isDrawing, isDrawMode, isPanning, panStart, panOrigin, draggingId, dragStart, dragItemStart, zoom, pan, drawColor, brushSize, toolMode]);

  const handleMouseUp = useCallback(async () => {
    if (isDrawing) {
      handleDrawEnd();
      return;
    }
    if (isPanning) {
      setIsPanning(false);
      return;
    }
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
  }, [isDrawing, isPanning, draggingId, dragPositions, updateItem]);

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

  const getItemPos = (item: CanvasItem) => dragPositions[item.id] || { x: item.position_x, y: item.position_y };

  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(0.2, prev - 0.15));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const TOOLS: { id: ToolMode; icon: any; label: string }[] = [
    { id: 'select', icon: Cursor, label: 'Select' },
    { id: 'note', icon: Note, label: 'Note' },
    { id: 'draw', icon: PaintBrush, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'pan', icon: Hand, label: 'Pan' },
  ];

  return (
    <div className="h-full overflow-hidden flex">
      {/* ── Left Toolbar ───────────────────────────────── */}
      <div className="shrink-0 w-[60px] border-r border-border bg-background flex flex-col items-center py-3 gap-0.5">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => {
              setToolMode(tool.id);
              if (tool.id === 'draw') setShowDrawOptions(true);
              else if (tool.id !== 'eraser') setShowDrawOptions(false);
            }}
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

        {/* Zoom controls */}
        <div className="flex flex-col items-center gap-0.5 mb-2">
          <button onClick={zoomIn} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <MagnifyingGlassPlus className="h-4 w-4" />
          </button>
          <button onClick={resetView} className="text-[9px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={zoomOut} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <MagnifyingGlassMinus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 h-10 border-b border-border bg-background flex items-center px-4 gap-2">
          <h1 className="text-xs font-semibold text-foreground">Vision Board</h1>
          {totalCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{achievedCount}/{totalCount} achieved</span>
          )}
          {uploading && <span className="text-[10px] text-primary animate-pulse">Uploading…</span>}

          {/* Draw options bar — shown when draw/eraser active */}
          {isDrawMode && (
            <div className="ml-4 flex items-center gap-2 border-l border-border pl-4">
              {/* Colors */}
              <div className="flex items-center gap-1">
                {DRAW_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setDrawColor(c); setToolMode('draw'); }}
                    className={cn(
                      'h-5 w-5 rounded-full border transition-transform',
                      drawColor === c && toolMode === 'draw' ? 'scale-125 border-primary ring-1 ring-primary' : 'border-border hover:scale-110'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>

              <div className="w-px h-5 bg-border" />

              {/* Brush sizes */}
              <div className="flex items-center gap-1">
                {BRUSH_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-md transition-colors',
                      brushSize === s ? 'bg-primary/20' : 'hover:bg-secondary'
                    )}
                  >
                    <div className="rounded-full bg-foreground" style={{ width: s, height: s }} />
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border" />

              {/* Save drawing */}
              <button
                onClick={saveDrawingAsCard}
                disabled={uploading}
                className="h-6 px-2.5 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <FloppyDisk className="h-3 w-3" /> Save as card
              </button>

              {/* Clear */}
              <button
                onClick={clearDrawing}
                className="h-6 px-2 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1"
              >
                <Trash className="h-3 w-3" /> Clear
              </button>
            </div>
          )}

          <span className="ml-auto text-[9px] text-muted-foreground">
            {isDrawMode ? 'Draw on the canvas · Save as card when done' : 'Scroll to pan · Ctrl+scroll to zoom · Double-click to edit'}
          </span>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className={cn(
            'flex-1 overflow-hidden relative',
            toolMode === 'note' && 'cursor-crosshair',
            toolMode === 'pan' && (isPanning ? 'cursor-grabbing' : 'cursor-grab'),
            toolMode === 'select' && 'cursor-default',
            toolMode === 'draw' && 'cursor-crosshair',
            toolMode === 'eraser' && 'cursor-crosshair',
          )}
          style={{ backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
          onClick={!isDrawMode ? handleCanvasClick : undefined}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); handleDrawEnd(); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Transformed canvas layer */}
          <div
            className="canvas-surface absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              backgroundImage: 'radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              width: 4000,
              height: 3000,
            }}
          >
            {/* Drawing canvas overlay */}
            <canvas
              ref={drawCanvasRef}
              className={cn(
                'absolute inset-0',
                isDrawMode ? 'pointer-events-auto z-40' : 'pointer-events-none z-5',
              )}
              style={{ width: 4000, height: 3000 }}
            />

            {isLoading ? (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-sm text-muted-foreground animate-pulse z-50">Loading…</div>
            ) : totalCount === 0 && !isDrawMode ? (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center px-6 pointer-events-auto z-30">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <SquaresFour className="h-8 w-8 text-primary" weight="duotone" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">Your vision board</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  Select <strong>Note</strong> and click anywhere to write.
                  <br />Drag & drop images onto the canvas.
                  <br />Use <strong>Draw</strong> to sketch directly.
                </p>
                <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5"><Note className="h-4 w-4" /> Click to note</div>
                  <div className="flex items-center gap-1.5"><ImageSquare className="h-4 w-4" /> Drop images</div>
                  <div className="flex items-center gap-1.5"><PaintBrush className="h-4 w-4" /> Draw</div>
                </div>
              </div>
            ) : (
              items?.map(item => {
                const pos = getItemPos(item as CanvasItem);
                const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[8];
                const CatIcon = CATEGORY_ICONS[item.category || 'general'] || Star;
                const isEditing = editingId === item.id;
                const isDragging = draggingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute group z-10',
                      isDragging && 'z-50 cursor-grabbing',
                      !isDragging && toolMode === 'select' && 'cursor-grab',
                      isDrawMode && 'pointer-events-none',
                    )}
                    style={{ left: pos.x, top: pos.y, width: item.width || 240 }}
                    onMouseDown={(e) => handleCardMouseDown(e, item as CanvasItem)}
                    onDoubleClick={() => startEditing(item as CanvasItem)}
                  >
                    <div className={cn(
                      'bg-card rounded-xl overflow-hidden border transition-all duration-150',
                      isDragging ? 'shadow-2xl scale-[1.03] rotate-[0.5deg] border-primary/30' : 'shadow-sm hover:shadow-lg border-border',
                      item.is_achieved && 'opacity-60',
                    )}>
                      {item.image_url && (
                        <div className="relative">
                          <img src={item.image_url} alt={item.title} className="w-full h-36 object-cover" draggable={false} />
                          {item.is_achieved && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <Trophy className="h-7 w-7 text-emerald-400" weight="fill" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CatIcon className="h-3 w-3" style={{ color: cat.color }} weight="duotone" />
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cat.color }}>{cat.label}</span>
                          {item.is_achieved && (
                            <span className="ml-auto text-[9px] font-semibold text-emerald-500 flex items-center gap-0.5">
                              <Check className="h-3 w-3" weight="bold" /> Done
                            </span>
                          )}
                        </div>

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
                              <button onClick={() => setEditingId(null)} className="h-6 px-2 rounded text-[10px] text-muted-foreground hover:bg-secondary">Cancel</button>
                              <button onClick={saveEditing} className="h-6 px-2 rounded text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
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
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-4">{item.description}</p>
                            )}
                          </>
                        )}

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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
