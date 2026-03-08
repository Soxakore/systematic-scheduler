import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  decay: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  type: 'star' | 'circle' | 'diamond';
}

const COLORS = [
  'rgba(0, 113, 227, 0.9)',   // Apple blue
  'rgba(90, 200, 250, 0.85)', // Cyan
  'rgba(191, 90, 242, 0.8)',  // Purple
  'rgba(255, 255, 255, 0.7)', // White
  'rgba(100, 210, 255, 0.75)',// Light blue
];

export default function CursorSparkle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const lastSpawn = useRef(0);

  const spawnParticles = useCallback((x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particles.current.push({
        x,
        y,
        size: Math.random() * 4 + 1.5,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        decay: Math.random() * 0.015 + 0.008,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        type: (['star', 'circle', 'diamond'] as const)[Math.floor(Math.random() * 3)],
      });
    }
  }, []);

  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    }
    ctx.stroke();
    // Cross sparkle
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      const now = Date.now();
      if (now - lastSpawn.current > 30) {
        spawnParticles(e.clientX, e.clientY, 2);
        lastSpawn.current = now;
      }
    };

    const handleClick = (e: MouseEvent) => {
      spawnParticles(e.clientX, e.clientY, 12);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('click', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.opacity > 0.01);

      for (const p of particles.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.02; // gravity
        p.speedX *= 0.99;
        p.opacity -= p.decay;
        p.rotation += p.rotationSpeed;
        p.size *= 0.995;

        ctx.globalAlpha = p.opacity;
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.lineWidth = 1;

        if (p.type === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === 'diamond') {
          drawDiamond(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glow effect
        ctx.globalAlpha = p.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animRef.current);
    };
  }, [spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
