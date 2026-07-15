/**
 * Minimap — Fase 3.11: Navigator overview del floorplan
 * Vista miniatura con rectangulo de viewport. Sync bidireccional.
 * Ref: Card, Mackinlay & Shneiderman (1999) — Readings in Information Visualization
 */
import { useRef, useEffect, useCallback } from 'react';
import type { FloorPlan, Barrier, RadiationSource } from '@/types/radshield';

interface Props {
  floorPlan: FloorPlan;
  viewport: { x: number; y: number; width: number; height: number; scale: number };
  onViewportChange: (x: number, y: number) => void;
  width?: number;
  height?: number;
}

export default function Minimap({ floorPlan, viewport, onViewportChange, width = 150, height = 100 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Compute world bounds
  const bounds = (() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    [...floorPlan.barriers, ...floorPlan.sources].forEach(e => {
      const x = 'x' in e ? e.x : 0, y = 'y' in e ? e.y : 0;
      minX = Math.min(minX, x - 50); minY = Math.min(minY, y - 50);
      maxX = Math.max(maxX, x + 50); maxY = Math.max(maxY, y + 50);
    });
    if (!floorPlan.barriers.length && !floorPlan.sources.length) {
      minX = 0; minY = 0; maxX = 1000; maxY = 800;
    }
    return { minX, minY, maxX, maxY };
  })();

  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = width / worldW;
  const scaleY = height / worldH;
  const minimapScale = Math.min(scaleX, scaleY);

  const toMinimap = useCallback((x: number, y: number) => ({
    mx: (x - bounds.minX) * minimapScale,
    my: (y - bounds.minY) * minimapScale,
  }), [bounds, minimapScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 15) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // Floorplan image (tinted)
    if (floorPlan.imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.globalAlpha = 1;
      };
      img.src = floorPlan.imageUrl;
    }

    // Barriers
    floorPlan.barriers.forEach(b => {
      const p1 = toMinimap(b.x1, b.y1);
      const p2 = toMinimap(b.x2, b.y2);
      ctx.strokeStyle = b.barrierType === 'primary' ? '#ef4444' : '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.mx, p1.my); ctx.lineTo(p2.mx, p2.my); ctx.stroke();
    });

    // Sources
    floorPlan.sources.forEach(s => {
      const p = toMinimap(s.x, s.y);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(p.mx, p.my, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Viewport rectangle
    const vpX = (viewport.x - bounds.minX) * minimapScale;
    const vpY = (viewport.y - bounds.minY) * minimapScale;
    const vpW = viewport.width / viewport.scale * minimapScale;
    const vpH = viewport.height / viewport.scale * minimapScale;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
    ctx.fillRect(vpX, vpY, vpW, vpH);
  }, [floorPlan, viewport, width, height, toMinimap]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = bounds.minX + mx / minimapScale;
    const worldY = bounds.minY + my / minimapScale;
    onViewportChange(worldX - viewport.width / viewport.scale / 2, worldY - viewport.height / viewport.scale / 2);
  }, [bounds, minimapScale, viewport, onViewportChange]);

  return (
    <div className="absolute bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-40" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-crosshair"
        onClick={handleClick}
        role="img"
        aria-label="Minimap navigator — click to jump to location"
      />
    </div>
  );
}
