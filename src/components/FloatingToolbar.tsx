/**
 * FloatingToolbar — A.3: Toolbar flotante arrastrable
 * Persiste posición en localStorage. Ocupa menos espacio en pantallas <1080px.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical, Pin, PinOff } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
}

const STORAGE_KEY = 'radshield-toolbar-pos';

export default function FloatingToolbar({ children, defaultPosition = { x: 20, y: 80 } }: Props) {
  const [pos, setPos] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultPosition;
  });
  const [pinned, setPinned] = useState(() => localStorage.getItem('radshield-toolbar-pinned') !== 'false');
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, [pos]);

  useEffect(() => {
    localStorage.setItem('radshield-toolbar-pinned', String(pinned));
  }, [pinned]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (pinned) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos, pinned]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || pinned) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 200, dragStart.current.px + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 50, dragStart.current.py + dy)),
    });
  }, [dragging, pinned]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  if (pinned) {
    return <>{children}</>;
  }

  return (
    <div
      className={`fixed z-50 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-2 py-1 ${dragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <GripVertical className="w-3 h-3 text-slate-400 shrink-0" />
      <div className="flex-1">{children}</div>
      <button
        onClick={(e) => { e.stopPropagation(); setPinned(true); }}
        className="p-1 hover:bg-slate-100 rounded"
        title="Fijar toolbar"
      >
        <Pin className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
}
