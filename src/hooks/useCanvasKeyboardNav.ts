/**
 * useCanvasKeyboardNav — v48.4: Full keyboard navigation for canvas
 * WCAG 2.1 §2.1 — Keyboard Accessible
 * Arrow keys: pan canvas | Tab: cycle through elements | Enter: select
 * +/-: zoom | Home: reset view | Delete: remove selected
 * Focus indicators visible via CSS outline
 */
import { useCallback, useEffect, useRef } from 'react';
import type { FloorPlan } from '@/types/radshield';

interface KeyboardNavState {
  offsetX: number;
  offsetY: number;
  scale: number;
  selectedId: string | null;
}

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  floorPlan: FloorPlan;
  state: KeyboardNavState;
  onPan: (dx: number, dy: number) => void;
  onZoom: (factor: number) => void;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onFocusElement: (x: number, y: number) => void;
}

export function useCanvasKeyboardNav({
  canvasRef, floorPlan, state, onPan, onZoom, onSelect, onDelete, onFocusElement,
}: Props) {
  const focusIndexRef = useRef(-1);
  const allElementsRef = useRef<Array<{ id: string; x: number; y: number; type: string }>>([]);

  // Build element list for tab cycling
  useEffect(() => {
    const elements: Array<{ id: string; x: number; y: number; type: string }> = [];
    floorPlan.sources.forEach(s => elements.push({ id: s.id, x: s.x, y: s.y, type: 'source' }));
    floorPlan.barriers.forEach(b => elements.push({
      id: b.id, x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2, type: 'barrier',
    }));
    allElementsRef.current = elements;
  }, [floorPlan]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle if canvas has focus and not in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const canvas = canvasRef.current;
    if (!canvas || document.activeElement !== canvas) return;

    const panSpeed = 20 / state.scale;

    switch (e.key) {
      // Pan
      case 'ArrowUp':
        e.preventDefault();
        onPan(0, panSpeed);
        break;
      case 'ArrowDown':
        e.preventDefault();
        onPan(0, -panSpeed);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPan(panSpeed, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onPan(-panSpeed, 0);
        break;

      // Zoom
      case '+':
      case '=':
        e.preventDefault();
        onZoom(1.15);
        break;
      case '-':
      case '_':
        e.preventDefault();
        onZoom(1 / 1.15);
        break;
      case 'Home':
        e.preventDefault();
        onZoom(1); // Reset zoom via callback
        break;

      // Tab through elements
      case 'Tab': {
        e.preventDefault();
        const elements = allElementsRef.current;
        if (elements.length === 0) return;
        focusIndexRef.current = e.shiftKey
          ? (focusIndexRef.current - 1 + elements.length) % elements.length
          : (focusIndexRef.current + 1) % elements.length;
        const el = elements[focusIndexRef.current];
        onSelect(el.id);
        onFocusElement(el.x, el.y);
        break;
      }

      // Delete selected
      case 'Delete':
      case 'Backspace':
        if (state.selectedId) {
          e.preventDefault();
          onDelete(state.selectedId);
          focusIndexRef.current = -1;
        }
        break;

      // Escape: deselect
      case 'Escape':
        onSelect(null);
        focusIndexRef.current = -1;
        break;
    }
  }, [canvasRef, state, onPan, onZoom, onSelect, onDelete, onFocusElement]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Make canvas focusable and add focus styles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Canvas de diseño de blindajes. Use flechas para desplazar, Tab para navegar elementos, + - para zoom.');
    canvas.style.outline = 'none';
    canvas.addEventListener('focus', () => { canvas.style.boxShadow = 'inset 0 0 0 2px #f97316'; });
    canvas.addEventListener('blur', () => { canvas.style.boxShadow = 'none'; });
  }, [canvasRef]);

  return { focusIndex: focusIndexRef };
}
