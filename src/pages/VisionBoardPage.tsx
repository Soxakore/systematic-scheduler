import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVisionBoardItems, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem, useVisionBoardConnections, useCreateVisionBoardConnection, useDeleteVisionBoardConnection } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Note, ImageSquare, PaintBrush, Eraser,
  Trash, SquaresFour, Star, Hand, Cursor,
  Check, Trophy, MagnifyingGlassPlus, MagnifyingGlassMinus,
  ArrowRight,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { CATEGORIES, CATEGORY_ICONS } from '@/components/vision/VisionCard';

type ToolMode = 'select' | 'note' | 'pan' | 'draw' | 'eraser' | 'connect';
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
const MIN_SIZE = 60;

const CANVAS_W = 4000;
const CANVAS_H = 3000;
const DRAW_COLORS = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#f8fafc'];
const BRUSH_SIZES = [2, 4, 8, 14];

export default function VisionBoardPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useVisionBoardItems();
  const createItem = useCreateVisionBoardItem();
  const updateItem = useUpdateVisionBoardItem();
  const deleteItem = useDeleteVisionBoardItem();
  const { data: connections } = useVisionBoardConnections();
  const createConnection = useCreateVisionBoardConnection();
  const deleteConnection = useDeleteVisionBoardConnection();

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  // Item dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragItemStart = useRef({ x: 0, y: 0 });
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Resizing
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const resizeStart = useRef({ x: 0, y: 0 });
  const resizeItemStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [resizeSizes, setResizeSizes] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});

  // Drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(4);

  // Connecting
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasReady = useRef(false);
  const titleInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const persistTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCount = items?.length || 0;
  const achievedCount = items?.filter(i => i.is_achieved).length || 0;
  const isDrawMode = toolMode === 'draw' || toolMode === 'eraser';

  /* ── Init canvas + load saved drawing ─────────────── */
  useEffect(() => {
    const c = drawCanvasRef.current;
    if (!c || !user || canvasReady.current) return;
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    canvasReady.current = true;

    // Load persisted drawing from storage
    (async () => {
      try {
        const { data: list } = await supabase.storage.from('vision-images').list(user.id, { search: 'canvas-drawing.png' });
        if (!list?.length) return;
        const { data } = supabase.storage.from('vision-images').getPublicUrl(`${user.id}/canvas-drawing.png`);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
        };
        img.src = data.publicUrl + '?t=' + Date.now();
      } catch {}
    })();
  }, [user]);

  /* ── Zoom via wheel / pinch ───────────────────────── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setZoom(prev => Math.min(3, Math.max(0.2, prev - e.deltaY * 0.002)));
      } else {
        setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  /* ── Convert screen → world coords ───────────────── */
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  /* ── Drawing ──────────────────────────────────────── */
  const handleDrawStart = useCallback((clientX: number, clientY: number) => {
    const c = drawCanvasRef.current;
    const ctx = c?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = screenToWorld(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (toolMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
    }
  }, [screenToWorld, toolMode, drawColor, brushSize]);

  const handleDrawMoveRaw = useCallback((clientX: number, clientY: number) => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = screenToWorld(clientX, clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [screenToWorld]);

  const persistDrawing = useCallback(() => {
    if (persistTimeout.current) clearTimeout(persistTimeout.current);
    persistTimeout.current = setTimeout(async () => {
      const c = drawCanvasRef.current;
      if (!c || !user) return;
      try {
        const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/png'));
        if (!blob) return;
        await supabase.storage.from('vision-images').upload(
          `${user.id}/canvas-drawing.png`, blob,
          { contentType: 'image/png', upsert: true }
        );
      } catch {}
    }, 1500);
  }, [user]);

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
    persistDrawing();
  }, [isDrawing, persistDrawing]);

  const clearDrawing = async () => {
    const c = drawCanvasRef.current;
    const ctx = c?.getContext('2d');
    if (!ctx || !c) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (user) {
      try { await supabase.storage.from('vision-images').remove([`${user.id}/canvas-drawing.png`]); } catch {}
    }
    toast.success('Drawing cleared');
  };

  /* ── Mouse handling ───────────────────────────────── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDrawMode) {
      handleDrawStart(e.clientX, e.clientY);
      return;
    }
    if (e.button === 1 || (toolMode === 'pan' && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
    }
  }, [isDrawMode, toolMode, pan, handleDrawStart]);

  /* ── Resize start ──────────────────────────────────── */
  const handleResizeStart = useCallback((e: React.MouseEvent, item: any, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingId(item.id);
    setResizeHandle(handle);
    resizeStart.current = { x: e.clientX, y: e.clientY };
    resizeItemStart.current = { x: item.position_x, y: item.position_y, w: item.width || 240, h: item.height || 200 };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing && isDrawMode) {
      handleDrawMoveRaw(e.clientX, e.clientY);
      return;
    }
    if (isPanning) {
      setPan({
        x: panOrigin.current.x + (e.clientX - panStart.current.x),
        y: panOrigin.current.y + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (resizingId && resizeHandle) {
      const dx = (e.clientX - resizeStart.current.x) / zoom;
      const dy = (e.clientY - resizeStart.current.y) / zoom;
      const s = resizeItemStart.current;
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
      if (resizeHandle.includes('e')) nw = Math.max(MIN_SIZE, s.w + dx);
      if (resizeHandle.includes('w')) { nw = Math.max(MIN_SIZE, s.w - dx); nx = s.x + s.w - nw; }
      if (resizeHandle.includes('s')) nh = Math.max(MIN_SIZE, s.h + dy);
      if (resizeHandle.includes('n')) { nh = Math.max(MIN_SIZE, s.h - dy); ny = s.y + s.h - nh; }
      setResizeSizes(prev => ({ ...prev, [resizingId]: { x: nx, y: ny, w: nw, h: nh } }));
      return;
    }
    // Track mouse for connect mode preview line
    if (toolMode === 'connect' && connectFromId) {
      const world = screenToWorld(e.clientX, e.clientY);
      setConnectMousePos(world);
    }
    if (!draggingId) return;
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    setDragPositions(prev => ({
      ...prev,
      [draggingId]: { x: Math.max(0, dragItemStart.current.x + dx), y: Math.max(0, dragItemStart.current.y + dy) },
    }));
  }, [isDrawing, isDrawMode, isPanning, draggingId, resizingId, resizeHandle, zoom, handleDrawMoveRaw, toolMode, connectFromId, screenToWorld]);

  const handleMouseUp = useCallback(async () => {
    if (isDrawing) { handleDrawEnd(); return; }
    if (isPanning) { setIsPanning(false); return; }
    if (resizingId) {
      const sz = resizeSizes[resizingId];
      if (sz) {
        await updateItem.mutateAsync({ id: resizingId, width: Math.round(sz.w), height: Math.round(sz.h), position_x: Math.round(sz.x), position_y: Math.round(sz.y) });
      }
      const rid = resizingId;
      setResizingId(null);
      setResizeHandle(null);
      setResizeSizes(prev => { const n = { ...prev }; delete n[rid]; return n; });
      return;
    }
    if (!draggingId) return;
    const pos = dragPositions[draggingId];
    if (pos) {
      await updateItem.mutateAsync({ id: draggingId, position_x: Math.round(pos.x), position_y: Math.round(pos.y) });
    }
    const id = draggingId;
    setDraggingId(null);
    setDragPositions(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [isDrawing, isPanning, draggingId, resizingId, dragPositions, resizeSizes, updateItem, handleDrawEnd]);

  /* ── Canvas click → create note ───────────────────── */
  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (toolMode !== 'note' || !user) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-card]')) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const newItem: any = await createItem.mutateAsync({
      title: '', description: '', category: 'general', color: '#64748b', icon: 'star',
      position_x: Math.round(x - 120), position_y: Math.round(y - 20),
      width: 240, height: 160, image_url: null,
      is_achieved: false, achieved_at: null, sort_order: items?.length || 0,
    });
    if (newItem?.id) {
      setEditingId(newItem.id);
      setEditTitle('');
      setEditDesc('');
      setTimeout(() => titleInputRefs.current[newItem.id]?.focus(), 100);
    }
  };

  /* ── File drop ────────────────────────────────────── */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!user) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
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
          title: file.name.replace(/\.[^/.]+$/, ''), description: '', category: 'general',
          color: '#64748b', icon: 'star',
          position_x: Math.round(x + i * 20 - 120), position_y: Math.round(y + i * 20 - 20),
          width: 260, height: 220, image_url: data.publicUrl,
          is_achieved: false, achieved_at: null, sort_order: (items?.length || 0) + i,
        });
      } catch (err: any) { toast.error('Upload failed: ' + err.message); }
      finally { setUploading(false); }
    }
    toast.success(`${files.length} image(s) added`);
  };

  /* ── Card drag ────────────────────────────────────── */
  const handleCardMouseDown = (e: React.MouseEvent, item: any) => {
    if (toolMode !== 'select' || editingId === item.id) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(item.id);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragItemStart.current = { x: item.position_x, y: item.position_y };
  };

  /* ── Inline editing ───────────────────────────────── */
  const startEditing = (item: any) => { setEditingId(item.id); setEditTitle(item.title || ''); setEditDesc(item.description || ''); };
  const saveEditing = async () => {
    if (!editingId) return;
    await updateItem.mutateAsync({ id: editingId, title: editTitle.trim() || 'Untitled', description: editDesc.trim() });
    setEditingId(null);
  };

  const getItemPos = (item: any) => {
    const rs = resizeSizes[item.id];
    if (rs) return { x: rs.x, y: rs.y };
    return dragPositions[item.id] || { x: item.position_x, y: item.position_y };
  };
  const getItemSize = (item: any) => {
    const rs = resizeSizes[item.id];
    if (rs) return { w: rs.w, h: rs.h };
    return { w: item.width || 240, h: item.height || 200 };
  };

  const RESIZE_HANDLES: { handle: ResizeHandle; className: string; cursor: string }[] = [
    { handle: 'nw', className: '-top-1.5 -left-1.5', cursor: 'nwse-resize' },
    { handle: 'ne', className: '-top-1.5 -right-1.5', cursor: 'nesw-resize' },
    { handle: 'sw', className: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize' },
    { handle: 'se', className: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize' },
    { handle: 'n', className: '-top-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { handle: 's', className: '-bottom-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { handle: 'w', className: 'top-1/2 -left-1 -translate-y-1/2', cursor: 'ew-resize' },
    { handle: 'e', className: 'top-1/2 -right-1 -translate-y-1/2', cursor: 'ew-resize' },
  ];
  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(0.2, prev - 0.15));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  /* ── Image upload from toolbar ────────────────────── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          title: file.name.replace(/\.[^/.]+$/, ''), description: '', category: 'general',
          color: '#64748b', icon: 'star',
          position_x: 40 + Math.random() * 400, position_y: 40 + Math.random() * 300,
          width: 260, height: 220, image_url: data.publicUrl,
          is_achieved: false, achieved_at: null, sort_order: items?.length || 0,
        });
      } catch (err: any) { toast.error('Upload failed: ' + err.message); }
      finally { setUploading(false); }
    }
    toast.success('Image(s) added');
    e.target.value = '';
  };

  const TOOLS: { id: ToolMode; icon: any; label: string }[] = [
    { id: 'select', icon: Cursor, label: 'Select' },
    { id: 'note', icon: Note, label: 'Note' },
    { id: 'connect', icon: ArrowRight, label: 'Connect' },
    { id: 'draw', icon: PaintBrush, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'pan', icon: Hand, label: 'Pan' },
  ];

  /* ── Get center of an item for arrow drawing ───────── */
  const getItemCenter = useCallback((itemId: string) => {
    const item = items?.find(i => i.id === itemId);
    if (!item) return { x: 0, y: 0 };
    const pos = getItemPos(item);
    const size = getItemSize(item);
    return { x: pos.x + size.w / 2, y: pos.y + size.h / 2 };
  }, [items, getItemPos, getItemSize]);

  /* ── Handle clicking an item in connect mode ────────── */
  const handleConnectClick = useCallback(async (itemId: string) => {
    if (toolMode !== 'connect') return;
    if (!connectFromId) {
      setConnectFromId(itemId);
      return;
    }
    if (connectFromId === itemId) {
      setConnectFromId(null);
      setConnectMousePos(null);
      return;
    }
    // Check for existing connection
    const exists = connections?.some(c =>
      (c.from_item_id === connectFromId && c.to_item_id === itemId) ||
      (c.from_item_id === itemId && c.to_item_id === connectFromId)
    );
    if (exists) {
      toast.error('Already connected');
      setConnectFromId(null);
      setConnectMousePos(null);
      return;
    }
    try {
      await createConnection.mutateAsync({ from_item_id: connectFromId, to_item_id: itemId });
      toast.success('Connected!');
    } catch { toast.error('Failed to connect'); }
    setConnectFromId(null);
    setConnectMousePos(null);
  }, [toolMode, connectFromId, connections, createConnection]);
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
              toolMode === tool.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <tool.icon className="h-[18px] w-[18px]" weight={toolMode === tool.id ? 'fill' : 'regular'} />
            {tool.label}
          </button>
        ))}

        <div className="w-7 h-px bg-border my-1.5" />

        <label className="flex flex-col items-center justify-center w-11 h-[52px] rounded-xl text-[9px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all gap-0.5 cursor-pointer">
          <ImageSquare className="h-[18px] w-[18px]" />
          Image
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </label>

        <div className="mt-auto" />

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

      {/* ── Main area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 h-10 border-b border-border bg-background flex items-center px-4 gap-2">
          <h1 className="text-xs font-semibold text-foreground">Vision Board</h1>
          {totalCount > 0 && <span className="text-[10px] text-muted-foreground">{achievedCount}/{totalCount} achieved</span>}
          {uploading && <span className="text-[10px] text-primary animate-pulse">Uploading…</span>}

          {isDrawMode && (
            <div className="ml-4 flex items-center gap-2 border-l border-border pl-4">
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
              <div className="flex items-center gap-1">
                {BRUSH_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={cn('flex items-center justify-center h-6 w-6 rounded-md transition-colors', brushSize === s ? 'bg-primary/20' : 'hover:bg-secondary')}
                  >
                    <div className="rounded-full bg-foreground" style={{ width: s, height: s }} />
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-border" />
              <button onClick={clearDrawing} className="h-6 px-2 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                <Trash className="h-3 w-3" /> Clear
              </button>
            </div>
          )}

          <span className="ml-auto text-[9px] text-muted-foreground">
            {isDrawMode ? 'Draw freely · Auto-saved' : 'Scroll to pan · Ctrl+scroll to zoom'}
          </span>
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className={cn(
            'flex-1 overflow-hidden relative',
            toolMode === 'note' && 'cursor-crosshair',
            toolMode === 'pan' && (isPanning ? 'cursor-grabbing' : 'cursor-grab'),
            toolMode === 'select' && 'cursor-default',
            isDrawMode && 'cursor-crosshair',
          )}
          style={{ backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* World layer — everything transforms together */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_W,
              height: CANVAS_H,
              position: 'absolute',
              backgroundImage: 'radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Drawing canvas — same coordinate space as cards */}
            <canvas
              ref={drawCanvasRef}
              style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none' }}
            />

            {/* Cards */}
            {isLoading ? (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-sm text-muted-foreground animate-pulse">Loading…</div>
            ) : totalCount === 0 && !isDrawMode ? (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <SquaresFour className="h-8 w-8 text-primary" weight="duotone" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">Your vision board</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  Select <strong>Note</strong> and click anywhere. Drop images. Use <strong>Draw</strong> to sketch freely.
                </p>
              </div>
            ) : null}

            {/* Render items — freeform, no card chrome */}
            {items?.map(item => {
              const pos = getItemPos(item);
              const size = getItemSize(item);
              const isEditing = editingId === item.id;
              const isDragging = draggingId === item.id;
              const isResizing = resizingId === item.id;
              const hasImage = !!item.image_url;

              return (
                <div
                  key={item.id}
                  data-card
                  className={cn(
                    'absolute group',
                    (isDragging || isResizing) ? 'z-50' : 'z-10',
                    isDragging ? 'cursor-grabbing' : '',
                    isDrawMode ? 'pointer-events-none opacity-50' : '',
                    toolMode === 'connect' ? 'cursor-pointer' : 'cursor-grab',
                    toolMode === 'connect' && connectFromId === item.id && 'ring-2 ring-primary rounded-lg',
                  )}
                  style={{ left: pos.x, top: pos.y, width: size.w }}
                  onMouseDown={e => { if (toolMode !== 'connect') handleCardMouseDown(e, item); }}
                  onDoubleClick={() => !isDrawMode && toolMode !== 'connect' && startEditing(item)}
                  onClick={e => { if (toolMode === 'connect') { e.stopPropagation(); handleConnectClick(item.id); } }}
                >
                  {/* Image items — raw image, no wrapper */}
                  {hasImage && (
                    <img
                      src={item.image_url!}
                      alt={item.title}
                      className={cn(
                        'w-full rounded-lg object-cover select-none transition-shadow duration-150',
                        isDragging ? 'shadow-2xl scale-[1.02]' : 'shadow-md hover:shadow-xl',
                        item.is_achieved && 'opacity-50 grayscale',
                      )}
                      style={{ height: size.h }}
                      draggable={false}
                    />
                  )}

                  {/* Text-only items — minimal sticky-note style */}
                  {!hasImage && (
                    <div
                      className={cn(
                        'rounded-lg p-3 select-none transition-shadow duration-150',
                        isDragging ? 'shadow-2xl scale-[1.02]' : 'shadow-sm hover:shadow-lg',
                        item.is_achieved && 'opacity-50',
                      )}
                      style={{ backgroundColor: (item.color || '#64748b') + '18', borderLeft: `3px solid ${item.color || '#64748b'}` }}
                    >
                      {isEditing ? (
                        <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                          <textarea
                            ref={el => { titleInputRefs.current[item.id] = el; }}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder="Title…"
                            className="w-full bg-transparent text-sm font-semibold text-foreground resize-none outline-none"
                            rows={1}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditing(); } }}
                            autoFocus
                          />
                          <textarea
                            value={editDesc} onChange={e => setEditDesc(e.target.value)}
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
                          {item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
                        </>
                      )}
                    </div>
                  )}

                  {/* Hover actions — minimal, floating */}
                  {!isEditing && !isDrawMode && (
                    <div className="absolute -top-3 -right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.is_achieved ? (
                        <button
                          className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors"
                          onClick={e => { e.stopPropagation(); updateItem.mutateAsync({ id: item.id, is_achieved: true, achieved_at: new Date().toISOString() }); toast.success('Achieved! 🎉'); }}
                        >
                          <Check className="h-3 w-3" weight="bold" />
                        </button>
                      ) : (
                        <button
                          className="h-6 px-2 rounded-full bg-secondary text-[9px] text-muted-foreground shadow-md hover:bg-muted transition-colors"
                          onClick={e => { e.stopPropagation(); updateItem.mutateAsync({ id: item.id, is_achieved: false, achieved_at: null }); }}
                        >Undo</button>
                      )}
                      <button
                        className="h-6 w-6 rounded-full bg-destructive/90 text-white flex items-center justify-center shadow-md hover:bg-destructive transition-colors"
                        onClick={e => { e.stopPropagation(); deleteItem.mutateAsync(item.id); toast.success('Removed'); }}
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Resize handles */}
                  {!isDrawMode && !isEditing && toolMode === 'select' && (
                    <>
                      {RESIZE_HANDLES.map(({ handle, className: cls, cursor }) => (
                        <div
                          key={handle}
                          className={cn(
                            'absolute w-3 h-3 rounded-full bg-primary border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity z-20',
                            cls,
                          )}
                          style={{ cursor }}
                          onMouseDown={e => handleResizeStart(e, item, handle)}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
