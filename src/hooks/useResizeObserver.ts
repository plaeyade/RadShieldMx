/**
 * useResizeObserver — ResizeObserver API for responsive canvas
 * Monitors container size changes and triggers canvas redraw
 * Chrome 64+, Firefox 69+, Safari 13.1+
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface ResizeObserverEntry {
  width: number;
  height: number;
}

export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
  onResize?: (entry: ResizeObserverEntry) => void
) {
  const [size, setSize] = useState<ResizeObserverEntry>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const observe = useCallback(() => {
    if (!ref.current) return;

    if (typeof ResizeObserver === 'undefined') {
      // Fallback: window resize event
      const update = () => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const entry = { width: rect.width, height: rect.height };
          setSize(entry);
          onResize?.(entry);
        }
      };
      window.addEventListener('resize', update);
      update();
      return () => window.removeEventListener('resize', update);
    }

    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const sizeEntry = { width, height };
        setSize(sizeEntry);
        onResize?.(sizeEntry);
      }
    });

    observerRef.current.observe(ref.current);
    return () => observerRef.current?.disconnect();
  }, [ref, onResize]);

  useEffect(() => {
    const cleanup = observe();
    return cleanup;
  }, [observe]);

  return size;
}

/**
 * useCanvasResize — Specialized hook for canvas auto-resizing
 * Handles device pixel ratio for crisp rendering on high-DPI displays
 */
export function useCanvasResize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, dpr: 1 });

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    // Only resize if dimensions changed (avoid infinite loops)
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      setCanvasSize({ width, height, dpr });
    }
  }, [canvasRef, containerRef]);

  useEffect(() => {
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(containerRef.current);
      resizeCanvas();
      return () => ro.disconnect();
    } else {
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [containerRef, resizeCanvas]);

  return { ...canvasSize, resizeCanvas };
}
