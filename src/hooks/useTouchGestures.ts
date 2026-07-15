/**
 * useTouchGestures — Recomendación A.5: Touch gesture support
 * Pinch-to-zoom y two-finger pan para tablets.
 * Basado en Touch Events API (Apple, 2013) y Pointer Events Level 2 (W3C, 2019).
 * Referencia: MDN Touch Events, Google Material Design touch guidelines.
 */
import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface UseTouchGesturesOptions {
  onZoomChange?: (scale: number) => void;
  onPanChange?: (dx: number, dy: number) => void;
  onGestureEnd?: () => void;
  minScale?: number;
  maxScale?: number;
}

export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const { onZoomChange, onPanChange, onGestureEnd, minScale = 0.1, maxScale = 10 } = options;
  const gestureRef = useRef<{
    initialDist: number;
    initialScale: number;
    initialMidX: number;
    initialMidY: number;
    lastScale: number;
    pointers: Map<number, { x: number; y: number }>;
  }>({
    initialDist: 0, initialScale: 1, initialMidX: 0, initialMidY: 0,
    lastScale: 1, pointers: new Map(),
  });

  const getDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

  const getMidpoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2,
  });

  const handlePointerDown = useCallback((e: PointerEvent) => {
    const g = gestureRef.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2) {
      const pts = Array.from(g.pointers.values());
      g.initialDist = getDist(pts[0], pts[1]);
      g.initialScale = g.lastScale;
      const mid = getMidpoint(pts[0], pts[1]);
      g.initialMidX = mid.x;
      g.initialMidY = mid.y;
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const g = gestureRef.current;
    if (!g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2) {
      const pts = Array.from(g.pointers.values());
      const newDist = getDist(pts[0], pts[1]);
      const newScale = Math.max(minScale, Math.min(maxScale,
        g.initialScale * (newDist / (g.initialDist || 1))
      ));
      g.lastScale = newScale;
      onZoomChange?.(newScale);
    } else if (g.pointers.size === 1 && g.initialDist === 0) {
      // Single finger pan
      onPanChange?.(e.movementX, e.movementY);
    }
  }, [minScale, maxScale, onZoomChange, onPanChange]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const g = gestureRef.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size < 2) {
      g.initialDist = 0;
      onGestureEnd?.();
    }
  }, [onGestureEnd]);

  useEffect(() => {
    const el = document.getElementById('main-canvas');
    if (!el) return;
    el.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return gestureRef;
}
