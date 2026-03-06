import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Eraser, Palette, FloppyDisk, Trash } from '@phosphor-icons/react';

const BRUSH_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
];

const BRUSH_SIZES = [2, 4, 8, 14, 22];

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  initialImage?: string | null;
  className?: string;
}

export default function DrawingCanvas({ onSave, initialImage, className }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialImage;
    }
  }, [initialImage]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? '#1a1a2e' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [isDrawing, color, brushSize, isEraser, getPos]);

  const endDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Colors */}
        <div className="flex gap-1">
          {BRUSH_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform',
                color === c && !isEraser ? 'scale-125 border-primary' : 'border-transparent hover:scale-110'
              )}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Brush sizes */}
        <div className="flex gap-1 items-center">
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-md transition-colors',
                brushSize === s ? 'bg-primary/20 border border-primary/40' : 'hover:bg-secondary'
              )}
            >
              <div className="rounded-full bg-foreground" style={{ width: s, height: s }} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={cn(
            'h-7 px-2 rounded-md text-xs font-medium flex items-center gap-1 transition-colors border',
            isEraser ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border hover:bg-secondary text-muted-foreground'
          )}
        >
          <Eraser className="h-3.5 w-3.5" /> Eraser
        </button>

        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="h-7 px-2 rounded-md text-xs font-medium flex items-center gap-1 border border-border hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Trash className="h-3.5 w-3.5" /> Clear
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1 btn-primary ml-auto"
        >
          <FloppyDisk className="h-3.5 w-3.5" /> Use Drawing
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg cursor-crosshair touch-none"
        style={{ height: 260, border: '1px solid hsl(var(--border))' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}
