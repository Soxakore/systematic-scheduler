import { useRef, useCallback, useEffect } from 'react';

const AUTO_SCROLL_ZONE = 60; // px from edge
const AUTO_SCROLL_SPEED = 8; // px per frame

/**
 * Manages auto-scrolling when dragging near the top/bottom edges of a scrollable container.
 * Returns { startAutoScroll, stopAutoScroll } to wire into mousemove/mouseup handlers.
 */
export function useAutoScroll(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const rafRef = useRef<number | null>(null);
  const directionRef = useRef<'up' | 'down' | null>(null);

  const tick = useCallback(() => {
    if (!scrollRef.current || !directionRef.current) return;
    const el = scrollRef.current;
    if (directionRef.current === 'up') {
      el.scrollTop = Math.max(0, el.scrollTop - AUTO_SCROLL_SPEED);
    } else {
      el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + AUTO_SCROLL_SPEED);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [scrollRef]);

  const updateAutoScroll = useCallback((clientY: number) => {
    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const distFromTop = clientY - rect.top;
    const distFromBottom = rect.bottom - clientY;

    let newDir: 'up' | 'down' | null = null;
    if (distFromTop < AUTO_SCROLL_ZONE && distFromTop >= 0) {
      newDir = 'up';
    } else if (distFromBottom < AUTO_SCROLL_ZONE && distFromBottom >= 0) {
      newDir = 'down';
    }

    if (newDir !== directionRef.current) {
      directionRef.current = newDir;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (newDir) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
  }, [scrollRef, tick]);

  const stopAutoScroll = useCallback(() => {
    directionRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { updateAutoScroll, stopAutoScroll };
}
