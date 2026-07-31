import { useRef, useCallback, useState, useEffect } from 'react';
import { MODALITIES } from '@/types/radshield';
import type { CriticalPoint, FloorPlan, Barrier, RadiationSource, OccupiedRegion } from '@/types/radshield';
import {
  getControlledZoneBarrierCanvasStyle,
  isControlledZoneBarrier,
  isControlledZoneRegion,
} from '@/lib/controlledZoneCanvasUx';
import { getBarrierLayerDisplay, getBarrierRiskColor, getBarrierRiskLevel } from '@/lib/canvasF85Workflow';
import { drawCanvasBackgroundGrid, drawCanvasScaleHud, drawFloorPlanImageLayer } from '@/lib/canvas/renderStaticHelpers';
import { drawCanvasHeatmapLayer, drawCanvasSampleLinesLayer } from '@/lib/canvas/renderDynamicHelpers';

type Tool = 'select' | 'barrier' | 'source' | 'region' | 'measure' | 'pan' | 'eraser' | 'reset';

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
  selectedId: string | null;
  selectedIds: string[];
  hoverId: string | null;
  snapToGrid: boolean;
  // RadShield floor-plan driven options
  showSampleLines: boolean;
  showSamplePoints: boolean;
  showMaxima: boolean;
}

const GRID_STEP_PX = 10; // snap every 10 world pixels (~0.1 m at 0.01 scale)

function snap(val: number, step: number): number {
  return Math.round(val / step) * step;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

type DragMode = 'barrier-start' | 'barrier-mid' | 'barrier-end' | 'source-move' | 'source-rotate' | 'selection-window' | 'selection-lasso';

interface CadDragState {
  mode: DragMode;
  id: string | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

export interface CanvasSamplePoint {
  x: number;
  y: number;
  kermaRate: number;
  barrierThickness_mm: number;
  material: string;
}

export interface CanvasSampleLine {
  barrierId: string;
  points: CanvasSamplePoint[];
  maxKermaPoint: CanvasSamplePoint | null;
  maxThicknessPoint: CanvasSamplePoint | null;
}

export interface CanvasBarrierResult {
  barrierId: string;
  barrierName: string;
  maxKermaRate_mGy_per_wk: number;
  maxBarrierThickness_mm: number;
  thicknessLead_mm: number;
  thicknessConcrete_mm: number;
  material: string;
  location: string;
}

export function useCanvas(
  floorPlan: FloorPlan,
  onFloorPlanChange: (fp: FloorPlan) => void,
  activeTool: Tool,
  heatmapData?: { x: number; y: number; kerma: number }[],
  sampleLines?: CanvasSampleLine[]
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    selectedId: null,
    selectedIds: [],
    hoverId: null,
    snapToGrid: true,
    showSampleLines: true,
    showSamplePoints: true,
    showMaxima: true,
  });
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [selectionWindow, setSelectionWindow] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [lassoPath, setLassoPath] = useState<Array<{ x: number; y: number }>>([]);
  const dragStateRef = useRef<CadDragState | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image
  useEffect(() => {
    if (floorPlan.imageUrl) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        draw();
      };
      img.src = floorPlan.imageUrl;
    } else {
      backgroundImageRef.current = null;
      draw();
    }
  }, [floorPlan.imageUrl]);

  // Coordinate transformation: screen -> world
  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - canvasState.offsetX) / canvasState.scale,
      y: (sy - canvasState.offsetY) / canvasState.scale
    };
  }, [canvasState]);

  // Coordinate transformation: world -> screen
  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: wx * canvasState.scale + canvasState.offsetX,
      y: wy * canvasState.scale + canvasState.offsetY
    };
  }, [canvasState]);

  const distanceToSegment = useCallback((px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const x = ax + t * dx;
    const y = ay + t * dy;
    return { distance: Math.hypot(px - x, py - y), x, y, t };
  }, []);

  const segmentIntersection = useCallback((a: Barrier, b: Barrier): { x: number; y: number } | null => {
    const x1 = a.x1;
    const y1 = a.y1;
    const x2 = a.x2;
    const y2 = a.y2;
    const x3 = b.x1;
    const y3 = b.y1;
    const x4 = b.x2;
    const y4 = b.y2;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null;
    const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
    const within = (value: number, start: number, end: number) => value >= Math.min(start, end) - 0.01 && value <= Math.max(start, end) + 0.01;
    return within(px, x1, x2) && within(py, y1, y2) && within(px, x3, x4) && within(py, y3, y4)
      ? { x: px, y: py }
      : null;
  }, []);

  const pointInPolygon = useCallback((point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.0001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  const findObjectAtScreen = useCallback((sx: number, sy: number): string | null => {
    for (const source of [...floorPlan.sources].reverse()) {
      const sp = worldToScreen(source.x, source.y);
      if (Math.hypot(sx - sp.x, sy - sp.y) < 22) return source.id;
    }

    for (const point of [...(floorPlan.criticalPoints ?? [])].reverse()) {
      const sp = worldToScreen(point.x, point.y);
      if (Math.hypot(sx - sp.x, sy - sp.y) < 18) return point.id;
    }

    for (const barrier of [...floorPlan.barriers].reverse()) {
      const sp1 = worldToScreen(barrier.x1, barrier.y1);
      const sp2 = worldToScreen(barrier.x2, barrier.y2);
      if (distanceToSegment(sx, sy, sp1.x, sp1.y, sp2.x, sp2.y).distance < 18) return barrier.id;
    }

    return null;
  }, [distanceToSegment, floorPlan, worldToScreen]);

  const findGripAtScreen = useCallback((sx: number, sy: number): CadDragState | null => {
    const selectedId = canvasState.selectedId;
    if (!selectedId) return null;
    const barrier = floorPlan.barriers.find((item) => item.id === selectedId);
    if (barrier) {
      const grips = [
        { mode: 'barrier-start' as DragMode, x: barrier.x1, y: barrier.y1 },
        { mode: 'barrier-mid' as DragMode, x: (barrier.x1 + barrier.x2) / 2, y: (barrier.y1 + barrier.y2) / 2 },
        { mode: 'barrier-end' as DragMode, x: barrier.x2, y: barrier.y2 },
      ];
      for (const grip of grips) {
        const sp = worldToScreen(grip.x, grip.y);
        if (Math.hypot(sx - sp.x, sy - sp.y) < 14) {
          return { mode: grip.mode, id: barrier.id, startX: grip.x, startY: grip.y, lastX: grip.x, lastY: grip.y };
        }
      }
    }

    const source = floorPlan.sources.find((item) => item.id === selectedId);
    if (source) {
      const sp = worldToScreen(source.x, source.y);
      const rotateGrip = worldToScreen(source.x + 35, source.y - 35);
      if (Math.hypot(sx - rotateGrip.x, sy - rotateGrip.y) < 12) {
        return { mode: 'source-rotate', id: source.id, startX: source.x, startY: source.y, lastX: source.x, lastY: source.y };
      }
      if (Math.hypot(sx - sp.x, sy - sp.y) < 24) {
        return { mode: 'source-move', id: source.id, startX: source.x, startY: source.y, lastX: source.x, lastY: source.y };
      }
    }

    return null;
  }, [canvasState.selectedId, floorPlan.barriers, floorPlan.sources, worldToScreen]);

  const snapAdvanced = useCallback((point: { x: number; y: number }, options: { angleFrom?: { x: number; y: number }; preferGeometry?: boolean } = {}) => {
    let snapped = canvasState.snapToGrid
      ? { x: snap(point.x, GRID_STEP_PX), y: snap(point.y, GRID_STEP_PX), mode: 'grid' }
      : { x: point.x, y: point.y, mode: 'free' };

    const candidates: Array<{ x: number; y: number; mode: string; distance: number }> = [];
    if (options.preferGeometry !== false) {
      for (const barrier of floorPlan.barriers) {
        const pts = [
          { x: barrier.x1, y: barrier.y1, mode: 'endpoint' },
          { x: barrier.x2, y: barrier.y2, mode: 'endpoint' },
          { x: (barrier.x1 + barrier.x2) / 2, y: (barrier.y1 + barrier.y2) / 2, mode: 'midpoint' },
        ];
        for (const pt of pts) {
          candidates.push({ ...pt, distance: Math.hypot(point.x - pt.x, point.y - pt.y) * canvasState.scale });
        }
        const projection = distanceToSegment(point.x, point.y, barrier.x1, barrier.y1, barrier.x2, barrier.y2);
        candidates.push({ x: projection.x, y: projection.y, mode: 'perpendicular', distance: projection.distance * canvasState.scale });
      }
      for (let i = 0; i < floorPlan.barriers.length; i += 1) {
        for (let j = i + 1; j < floorPlan.barriers.length; j += 1) {
          const intersection = segmentIntersection(floorPlan.barriers[i], floorPlan.barriers[j]);
          if (intersection) {
            candidates.push({
              ...intersection,
              mode: 'intersection',
              distance: Math.hypot(point.x - intersection.x, point.y - intersection.y) * canvasState.scale,
            });
          }
        }
      }
      for (const source of floorPlan.sources) {
        candidates.push({ x: source.x, y: source.y, mode: 'equipment-center', distance: Math.hypot(point.x - source.x, point.y - source.y) * canvasState.scale });
      }
    }

    const best = candidates.sort((a, b) => a.distance - b.distance)[0];
    if (best && best.distance < 14) {
      snapped = { x: best.x, y: best.y, mode: best.mode };
    }

    if (options.angleFrom) {
      const dx = snapped.x - options.angleFrom.x;
      const dy = snapped.y - options.angleFrom.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const step = Math.PI / 12;
        const angle = Math.round(Math.atan2(dy, dx) / step) * step;
        snapped = {
          x: options.angleFrom.x + Math.cos(angle) * len,
          y: options.angleFrom.y + Math.sin(angle) * len,
          mode: `${snapped.mode}+angle15`,
        };
      }
    }

    return snapped;
  }, [canvasState.scale, canvasState.snapToGrid, distanceToSegment, floorPlan.barriers, floorPlan.sources, segmentIntersection]);

  // Draw everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const viewportRenderState = {
      scale: canvasState.scale,
      offsetX: canvasState.offsetX,
      offsetY: canvasState.offsetY,
      scale_m_per_pixel: floorPlan.scale_m_per_pixel,
    };

    drawCanvasBackgroundGrid(ctx, viewportRenderState, { width: w, height: h });
    drawFloorPlanImageLayer(ctx, backgroundImageRef.current, viewportRenderState);

    // Occupied regions
    for (const region of floorPlan.occupiedRegions) {
      if (region.points.length < 3) continue;
      const controlledRegion = isControlledZoneRegion(region);
      ctx.fillStyle = controlledRegion ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 179, 237, 0.2)';
      ctx.strokeStyle = controlledRegion ? 'rgba(5, 150, 105, 0.8)' : 'rgba(66, 153, 225, 0.6)';
      ctx.lineWidth = controlledRegion ? 2.5 : 2;
      ctx.setLineDash(controlledRegion ? [8, 4] : []);
      ctx.beginPath();
      const sp0 = worldToScreen(region.points[0].x, region.points[0].y);
      ctx.moveTo(sp0.x, sp0.y);
      for (let i = 1; i < region.points.length; i++) {
        const sp = worldToScreen(region.points[i].x, region.points[i].y);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      const centroid = region.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      centroid.x /= region.points.length;
      centroid.y /= region.points.length;
      const csp = worldToScreen(centroid.x, centroid.y);
      ctx.fillStyle = controlledRegion ? '#047857' : '#2b6cb0';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(region.name, csp.x, csp.y);
    }

    drawCanvasHeatmapLayer(ctx, heatmapData, {
      scale: canvasState.scale,
      worldToScreen,
    });

    // Barriers
    for (const barrier of floorPlan.barriers) {
      const sp1 = worldToScreen(barrier.x1, barrier.y1);
      const sp2 = worldToScreen(barrier.x2, barrier.y2);

      const isSelected = canvasState.selectedId === barrier.id || canvasState.selectedIds.includes(barrier.id);
      const isHover = canvasState.hoverId === barrier.id;
      const controlledBarrier = isControlledZoneBarrier(barrier);
      const czStyle = controlledBarrier ? getControlledZoneBarrierCanvasStyle(barrier) : null;
      const layerDisplay = getBarrierLayerDisplay(barrier);
      if (controlledBarrier && czStyle) {
        ctx.save();
        ctx.strokeStyle = czStyle.glow;
        ctx.lineWidth = Math.max(8, czStyle.lineWidth + 5);
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.strokeStyle = isSelected ? (czStyle?.selectedStroke || '#e53e3e') : isHover ? '#f97316' : (czStyle?.stroke || '#2d3748');
      ctx.lineWidth = isSelected ? Math.max(4, (czStyle?.lineWidth || 2.5) + 1) : isHover ? 3 : (czStyle?.lineWidth || 2.5);
      ctx.setLineDash(czStyle?.dash || []);
      ctx.beginPath();
      ctx.moveTo(sp1.x, sp1.y);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow showing normal direction (outward)
      const midX = (sp1.x + sp2.x) / 2;
      const midY = (sp1.y + sp2.y) / 2;
      const dx = sp2.x - sp1.x;
      const dy = sp2.y - sp1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const nx = -dy / len * 15;
        const ny = dx / len * 15;
        ctx.strokeStyle = isSelected ? (czStyle?.selectedStroke || '#e53e3e') : (czStyle?.normalStroke || '#4a5568');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + nx, midY + ny);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(midX + nx, midY + ny);
        ctx.lineTo(midX + nx - nx * 0.3 - ny * 0.2, midY + ny - ny * 0.3 + nx * 0.2);
        ctx.lineTo(midX + nx - nx * 0.3 + ny * 0.2, midY + ny - ny * 0.3 - nx * 0.2);
        ctx.closePath();
        ctx.fillStyle = isSelected ? (czStyle?.selectedStroke || '#e53e3e') : (czStyle?.normalStroke || '#4a5568');
        ctx.fill();
      }

      // Barrier name
      ctx.fillStyle = isSelected ? (czStyle?.selectedStroke || '#e53e3e') : (czStyle?.labelColor || '#2d3748');
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(controlledBarrier && czStyle ? `${czStyle.label}: ${barrier.name}` : barrier.name, midX, midY - 8);

      if (isSelected && len > 0) {
        const gripPoints = [
          { x: sp1.x, y: sp1.y },
          { x: midX, y: midY },
          { x: sp2.x, y: sp2.y },
        ];
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        for (const grip of gripPoints) {
          ctx.beginPath();
          ctx.roundRect(grip.x - 4, grip.y - 4, 8, 8, 2);
          ctx.fill();
          ctx.stroke();
        }

        const nx2 = -dy / len;
        const ny2 = dx / len;
        const ax = sp1.x + nx2 * 30;
        const ay = sp1.y + ny2 * 30;
        const bx = sp2.x + nx2 * 30;
        const by = sp2.y + ny2 * 30;
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(ax, ay);
        ctx.moveTo(sp2.x, sp2.y);
        ctx.lineTo(bx, by);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        const label = floorPlan.scale_m_per_pixel > 0
          ? `${(Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1) * floorPlan.scale_m_per_pixel).toFixed(2)} m`
          : `${Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1).toFixed(0)} px`;
        const lx = (ax + bx) / 2;
        const ly = (ay + by) / 2;
        const metrics = ctx.measureText(label);
        ctx.fillStyle = 'rgba(255, 247, 237, 0.95)';
        ctx.strokeStyle = '#fed7aa';
        ctx.beginPath();
        ctx.roundRect(lx - metrics.width / 2 - 5, ly - 8, metrics.width + 10, 16, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#c2410c';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
        ctx.restore();
      } else if (isHover) {
        ctx.save();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();
        ctx.restore();
      }

      const riskLevel = getBarrierRiskLevel(barrier);
      const riskColor = getBarrierRiskColor(riskLevel);
      if (len > 0) {
        const riskLabels = { pass: 'PASS', warn: 'WARN', fail: 'FAIL', pending: 'PEND' };
        const riskLabel = riskLabels[riskLevel];
        ctx.save();
        ctx.strokeStyle = riskColor;
        ctx.fillStyle = riskLevel === 'fail'
          ? 'rgba(220, 38, 38, 0.13)'
          : riskLevel === 'warn'
            ? 'rgba(245, 158, 11, 0.13)'
            : riskLevel === 'pass'
              ? 'rgba(22, 163, 74, 0.11)'
              : 'rgba(100, 116, 139, 0.10)';
        ctx.lineWidth = riskLevel === 'fail' ? 4 : 2;
        ctx.beginPath();
        ctx.arc(midX, midY + 18, riskLevel === 'fail' ? 12 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = riskColor;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(riskLabel, midX, midY + 21);
        ctx.restore();
      }

      if (layerDisplay.hasPreset && len > 0) {
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const startX = sp1.x + ux * Math.min(18, len * 0.2);
        const startY = sp1.y + uy * Math.min(18, len * 0.2);
        const endX = sp2.x - ux * Math.min(18, len * 0.2);
        const endY = sp2.y - uy * Math.min(18, len * 0.2);
        const colors: Record<string, string> = {
          PB: '#334155',
          GYPSUM: '#f59e0b',
          CONCRETE235: '#94a3b8',
          CONCRETEBARITE: '#64748b',
          STEEL: '#1f2937',
        };
        ctx.save();
        (layerDisplay.layers.length > 0 ? layerDisplay.layers : [{ materialCode: barrier.materialCode, thickness_mm: barrier.thickness_mm ?? 0 }]).forEach((layer, index) => {
          const offset = 7 + index * 4;
          ctx.strokeStyle = colors[layer.materialCode] ?? '#f97316';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX + px * offset, startY + py * offset);
          ctx.lineTo(endX + px * offset, endY + py * offset);
          ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255, 247, 237, 0.92)';
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 1;
        const label = `${layerDisplay.presetName}: ${layerDisplay.totalThickness_mm || barrier.thickness_mm || 0} mm`;
        const labelWidth = Math.min(180, Math.max(92, label.length * 5.2));
        const labelX = midX + px * 24;
        const labelY = midY + py * 24;
        ctx.beginPath();
        ctx.roundRect(labelX - labelWidth / 2, labelY - 9, labelWidth, 18, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#9a3412';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, labelX, labelY + 3);
        ctx.restore();
      }

      if (controlledBarrier && czStyle) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = czStyle.labelColor;
        ctx.fillText(czStyle.badge, midX, midY + 12);
      }

      // Legacy sample points visualization
      if (barrier.points && barrier.points.length > 0) {
        for (const pt of barrier.points) {
          const spt = worldToScreen(pt.x, pt.y);
          ctx.fillStyle = 'rgba(56, 178, 172, 0.7)';
          ctx.beginPath();
          ctx.arc(spt.x, spt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawCanvasSampleLinesLayer(ctx, sampleLines ?? [], {
      scale: canvasState.scale,
      worldToScreen,
    }, {
      showSampleLines: canvasState.showSampleLines,
      showSamplePoints: canvasState.showSamplePoints,
      showMaxima: canvasState.showMaxima,
    });

    // X-ray sources — differentiated icons by modality category
    for (const source of floorPlan.sources) {
      const sp = worldToScreen(source.x, source.y);
      const isSelected = canvasState.selectedId === source.id || canvasState.selectedIds.includes(source.id);
      const isHover = canvasState.hoverId === source.id;
      const category = source.modality?.category || 'other';
      const r = isSelected ? 18 : 14;
      const rotation = ((source as RadiationSource & { rotationDeg?: number }).rotationDeg ?? 0) * Math.PI / 180;
      const footprint = source.modality?.category === 'therapy'
        ? { width: 70, depth: 92 }
        : source.modality?.category === 'nuclear'
          ? { width: 62, depth: 86 }
          : source.modality?.category === 'cyclotron'
            ? { width: 96, depth: 96 }
            : { width: 58, depth: 72 };

      // Color per category
      const catColors: Record<string, { main: string; dark: string; light: string }> = {
        diagnostic: { main: '#2563eb', dark: '#1d4ed8', light: '#dbeafe' },  // Blue
        therapy:    { main: '#dc2626', dark: '#b91c1c', light: '#fee2e2' },  // Red
        nuclear:    { main: '#7c3aed', dark: '#6d28d9', light: '#ede9fe' },  // Purple
        cyclotron:  { main: '#059669', dark: '#047857', light: '#d1fae5' },  // Green
        other:      { main: '#ea580c', dark: '#c2410c', light: '#ffedd5' },  // Orange
      };
      const c = catColors[category] || catColors.other;
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(rotation);
      ctx.globalAlpha = isSelected ? 0.22 : 0.12;
      ctx.fillStyle = c.main;
      ctx.strokeStyle = isSelected ? '#f97316' : c.dark;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(-footprint.width / 2, -footprint.depth / 2, footprint.width, footprint.depth, 6);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.fillStyle = isSelected ? c.dark : c.main;

      switch (category) {
        case 'diagnostic': {
          // X-ray tube icon: circle with X inside
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sp.x - r * 0.45, sp.y - r * 0.45);
          ctx.lineTo(sp.x + r * 0.45, sp.y + r * 0.45);
          ctx.moveTo(sp.x + r * 0.45, sp.y - r * 0.45);
          ctx.lineTo(sp.x - r * 0.45, sp.y + r * 0.45);
          ctx.stroke();
          break;
        }
        case 'therapy': {
          // Radiation therapy: trefoil with central dot
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
          ctx.fill();
          // White center
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
          // Three blades
          ctx.fillStyle = isSelected ? c.dark : c.main;
          for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.arc(sp.x, sp.y, r * 0.9, angle - 0.4, angle + 0.4);
            ctx.closePath();
            ctx.fill();
          }
          break;
        }
        case 'nuclear': {
          // Nuclear medicine: atom with orbiting electron
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
          ctx.fill();
          // White nucleus
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
          // Orbit lines
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.ellipse(sp.x, sp.y, r * 0.85, r * 0.35, (i * Math.PI) / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }
        case 'cyclotron': {
          // Cyclotron: spiral/ring pattern
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
          ctx.fill();
          // Spiral
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 4; a += 0.1) {
            const sr = 2 + a * 1.2;
            const sx = sp.x + Math.cos(a) * Math.min(sr, r * 0.8);
            const sy = sp.y + Math.sin(a) * Math.min(sr, r * 0.8);
            if (a === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
          break;
        }
        default: {
          // Generic: diamond shape
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - r);
          ctx.lineTo(sp.x + r * 0.8, sp.y);
          ctx.lineTo(sp.x, sp.y + r);
          ctx.lineTo(sp.x - r * 0.8, sp.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;
        }
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();

        const rotateGrip = worldToScreen(source.x + 35, source.y - 35);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(rotateGrip.x, rotateGrip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#c2410c';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('R', rotateGrip.x, rotateGrip.y + 3);
      } else if (isHover) {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Source name
      ctx.fillStyle = '#2d3748';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(source.name, sp.x, sp.y + r + 16);

      // Category label (small)
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      const catLabels: Record<string, string> = {
        diagnostic: 'DX', therapy: 'RT', nuclear: 'NM', cyclotron: 'CY', other: 'OT',
      };
      ctx.fillText(catLabels[category] || '', sp.x, sp.y + r + 28);
    }

    // F85: critical points used to validate occupied areas and analytic-memory evidence.
    const criticalPoints: CriticalPoint[] = floorPlan.criticalPoints ?? [];
    for (const point of criticalPoints) {
      if (point.enabled === false) continue;
      const sp = worldToScreen(point.x, point.y);
      const isSelected = canvasState.selectedId === point.id;
      ctx.save();
      ctx.strokeStyle = isSelected ? '#dc2626' : '#f97316';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, isSelected ? 16 : 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(sp.x - 9, sp.y);
      ctx.lineTo(sp.x + 9, sp.y);
      ctx.moveTo(sp.x, sp.y - 9);
      ctx.lineTo(sp.x, sp.y + 9);
      ctx.stroke();
      ctx.fillStyle = '#9a3412';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Punto critico', sp.x, sp.y - 18);
      ctx.font = '9px sans-serif';
      ctx.fillText(point.name, sp.x, sp.y + 24);
      ctx.restore();
    }

    // A.6: Ghost barrier preview (before first click — shows where barrier will be placed)
    if (ghostPos && activeTool === 'barrier' && !drawingState.isDrawing) {
      const sp = worldToScreen(ghostPos.x, ghostPos.y);
      const snapX = canvasState.snapToGrid ? snap(ghostPos.x, GRID_STEP_PX) : ghostPos.x;
      const snapY = canvasState.snapToGrid ? snap(ghostPos.y, GRID_STEP_PX) : ghostPos.y;
      const ssp = worldToScreen(snapX, snapY);

      // Draw crosshair at mouse position
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // red-500 at 50%
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(ssp.x - 30, ssp.y);
      ctx.lineTo(ssp.x + 30, ssp.y);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(ssp.x, ssp.y - 30);
      ctx.lineTo(ssp.x, ssp.y + 30);
      ctx.stroke();

      // Circle
      ctx.beginPath();
      ctx.arc(ssp.x, ssp.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Click para iniciar barrera | (${(snapX * floorPlan.scale_m_per_pixel).toFixed(2)} m, ${(snapY * floorPlan.scale_m_per_pixel).toFixed(2)} m)`, ssp.x, ssp.y + 45);
    }

    // Drawing preview (when creating new barrier)
    if (drawingState.isDrawing) {
      const sp1 = worldToScreen(drawingState.startX, drawingState.startY);
      const sp2 = worldToScreen(drawingState.currentX, drawingState.currentY);
      ctx.strokeStyle = '#3182ce';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sp1.x, sp1.y);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Length label
      const dx = drawingState.currentX - drawingState.startX;
      const dy = drawingState.currentY - drawingState.startY;
      const len_m = Math.sqrt(dx * dx + dy * dy) * floorPlan.scale_m_per_pixel;
      const midX = (sp1.x + sp2.x) / 2;
      const midY = (sp1.y + sp2.y) / 2;
      ctx.fillStyle = '#3182ce';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${len_m.toFixed(2)} m`, midX, midY - 5);
    }

    if (selectionWindow) {
      const sp1 = worldToScreen(selectionWindow.startX, selectionWindow.startY);
      const sp2 = worldToScreen(selectionWindow.currentX, selectionWindow.currentY);
      const x = Math.min(sp1.x, sp2.x);
      const y = Math.min(sp1.y, sp2.y);
      const width = Math.abs(sp2.x - sp1.x);
      const height = Math.abs(sp2.y - sp1.y);
      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Window select', x + 6, y + 14);
      ctx.restore();
    }

    if (lassoPath.length > 1) {
      ctx.save();
      ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      const first = worldToScreen(lassoPath[0].x, lassoPath[0].y);
      ctx.moveTo(first.x, first.y);
      for (const point of lassoPath.slice(1)) {
        const sp = worldToScreen(point.x, point.y);
        ctx.lineTo(sp.x, sp.y);
      }
      if (lassoPath.length > 2) ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#6d28d9';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Lasso select', first.x + 6, first.y + 14);
      ctx.restore();
    }

    drawCanvasScaleHud(ctx, viewportRenderState, { width: w, height: h });
  }, [floorPlan, canvasState, drawingState, worldToScreen, sampleLines, ghostPos, activeTool, selectionWindow, lassoPath]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    const grip = activeTool === 'select' ? findGripAtScreen(sx, sy) : null;
    if (grip) {
      dragStateRef.current = { ...grip, lastX: world.x, lastY: world.y };
      setCanvasState(prev => ({ ...prev, selectedId: grip.id, selectedIds: grip.id ? [grip.id] : prev.selectedIds }));
      return;
    }

    if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: sx,
        lastMouseY: sy
      }));
      return;
    }

    if (activeTool === 'barrier') {
      const start = snapAdvanced(world, { preferGeometry: true });
      setDrawingState({
        isDrawing: true,
        startX: start.x,
        startY: start.y,
        currentX: start.x,
        currentY: start.y
      });
      return;
    }

    if (activeTool === 'source') {
      // Add source at click position (with snap)
      const snapped = snapAdvanced(world, { preferGeometry: true });
      const newSource: RadiationSource = {
        id: `source-${Date.now()}`,
        x: snapped.x,
        y: snapped.y,
        name: `Fuente ${floorPlan.sources.length + 1}`,
        modality: MODALITIES[0],
        workloadValue: 50,
        workloadUnit: MODALITIES[0].unit,
        isocenterHeight_m: MODALITIES[0].isocenterHeightDefault_m,
        useFactor: 0.25,
        workloadHoursPerWeek: 40,
        rotationDeg: 0,
        footprint_m: { width: 2.6, depth: 3.2 },
        manufacturerVariant: 'generic'
      };
      onFloorPlanChange({
        ...floorPlan,
        sources: [...floorPlan.sources, newSource]
      });
      return;
    }

    if (activeTool === 'select') {
      const selectedId = findObjectAtScreen(sx, sy);
      if (selectedId) {
        setCanvasState(prev => {
          const nextSelectedIds = e.shiftKey
            ? prev.selectedIds.includes(selectedId)
              ? prev.selectedIds.filter((id) => id !== selectedId)
              : [...prev.selectedIds, selectedId]
            : [selectedId];
          return { ...prev, selectedId, selectedIds: nextSelectedIds };
        });
      } else {
        const selectionMode: DragMode = e.ctrlKey || e.metaKey ? 'selection-lasso' : 'selection-window';
        dragStateRef.current = { mode: selectionMode, id: null, startX: world.x, startY: world.y, lastX: world.x, lastY: world.y };
        if (selectionMode === 'selection-lasso') {
          setLassoPath([{ x: world.x, y: world.y }]);
          setSelectionWindow(null);
        } else {
          setSelectionWindow({ startX: world.x, startY: world.y, currentX: world.x, currentY: world.y });
          setLassoPath([]);
        }
        if (!e.shiftKey) setCanvasState(prev => ({ ...prev, selectedId: null, selectedIds: [] }));
      }
    }
  }, [activeTool, canvasRef, findGripAtScreen, findObjectAtScreen, floorPlan, onFloorPlanChange, screenToWorld, snapAdvanced]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const snappedWorld = snapAdvanced(world, {
      angleFrom: drawingState.isDrawing ? { x: drawingState.startX, y: drawingState.startY } : undefined,
      preferGeometry: true,
    });

    const cadDrag = dragStateRef.current;
    if (cadDrag && cadDrag.mode !== 'selection-window') {
      const dx = snappedWorld.x - cadDrag.lastX;
      const dy = snappedWorld.y - cadDrag.lastY;
      if (cadDrag.mode.startsWith('barrier')) {
        const newBarriers = floorPlan.barriers.map((barrier) => {
          if (barrier.id !== cadDrag.id) return barrier;
          if (cadDrag.mode === 'barrier-start') return { ...barrier, x1: snappedWorld.x, y1: snappedWorld.y };
          if (cadDrag.mode === 'barrier-end') return { ...barrier, x2: snappedWorld.x, y2: snappedWorld.y };
          return { ...barrier, x1: barrier.x1 + dx, y1: barrier.y1 + dy, x2: barrier.x2 + dx, y2: barrier.y2 + dy };
        });
        onFloorPlanChange({ ...floorPlan, barriers: newBarriers });
      } else if (cadDrag.mode === 'source-move') {
        const newSources = floorPlan.sources.map((source) =>
          source.id === cadDrag.id ? { ...source, x: snappedWorld.x, y: snappedWorld.y } : source
        );
        onFloorPlanChange({ ...floorPlan, sources: newSources });
      } else if (cadDrag.mode === 'source-rotate') {
        const source = floorPlan.sources.find((item) => item.id === cadDrag.id);
        if (source) {
          const angle = Math.atan2(world.y - source.y, world.x - source.x) * 180 / Math.PI;
          const newSources = floorPlan.sources.map((item) =>
            item.id === source.id ? { ...item, rotationDeg: Math.round(angle / 15) * 15 } as RadiationSource : item
          );
          onFloorPlanChange({ ...floorPlan, sources: newSources });
        }
      }
      dragStateRef.current = { ...cadDrag, lastX: snappedWorld.x, lastY: snappedWorld.y };
      setHoverInfo(`Grip: ${cadDrag.mode} | snap ${snappedWorld.mode}`);
      return;
    }

    if (cadDrag?.mode === 'selection-window') {
      setSelectionWindow({ startX: cadDrag.startX, startY: cadDrag.startY, currentX: world.x, currentY: world.y });
      setHoverInfo('Seleccion por ventana');
      return;
    }

    if (cadDrag?.mode === 'selection-lasso') {
      setLassoPath((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.hypot(world.x - last.x, world.y - last.y) < 4) return prev;
        return [...prev, { x: world.x, y: world.y }];
      });
      setHoverInfo('Seleccion lasso libre');
      return;
    }

    if (canvasState.isDragging) {
      const dx = sx - canvasState.lastMouseX;
      const dy = sy - canvasState.lastMouseY;
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
        lastMouseX: sx,
        lastMouseY: sy
      }));
      return;
    }

    if (drawingState.isDrawing) {
      setDrawingState(prev => ({ ...prev, currentX: snappedWorld.x, currentY: snappedWorld.y }));
      // Show hover info
      const dx = snappedWorld.x - drawingState.startX;
      const dy = snappedWorld.y - drawingState.startY;
      const len_m = Math.sqrt(dx * dx + dy * dy) * floorPlan.scale_m_per_pixel;
      setHoverInfo(`Longitud: ${len_m.toFixed(2)} m | snap ${snappedWorld.mode}`);
      return;
    }

    const hoverId = activeTool === 'select' ? findObjectAtScreen(sx, sy) : null;
    setCanvasState(prev => prev.hoverId === hoverId ? prev : { ...prev, hoverId });

    // Show coordinates
    setHoverInfo(`${hoverId ? 'Hover: ' + hoverId + ' | ' : ''}X: ${world.x.toFixed(0)} px | Y: ${world.y.toFixed(0)} px | (${(world.x * floorPlan.scale_m_per_pixel).toFixed(2)} m, ${(world.y * floorPlan.scale_m_per_pixel).toFixed(2)} m)`);

    // A.6: Ghost barrier preview when in barrier tool and not drawing
    if (activeTool === 'barrier' && !drawingState.isDrawing) {
      setGhostPos({ x: world.x, y: world.y });
    } else {
      setGhostPos(null);
    }
  }, [activeTool, canvasState, drawingState, findObjectAtScreen, floorPlan, onFloorPlanChange, screenToWorld, snapAdvanced]);

  const handleMouseUp = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    const cadDrag = dragStateRef.current;
    if (cadDrag?.mode === 'selection-window' && selectionWindow) {
      const minX = Math.min(selectionWindow.startX, selectionWindow.currentX);
      const maxX = Math.max(selectionWindow.startX, selectionWindow.currentX);
      const minY = Math.min(selectionWindow.startY, selectionWindow.currentY);
      const maxY = Math.max(selectionWindow.startY, selectionWindow.currentY);
      const ids = [
        ...floorPlan.sources.filter((source) => source.x >= minX && source.x <= maxX && source.y >= minY && source.y <= maxY).map((source) => source.id),
        ...floorPlan.barriers.filter((barrier) => {
          const bx = (barrier.x1 + barrier.x2) / 2;
          const by = (barrier.y1 + barrier.y2) / 2;
          return bx >= minX && bx <= maxX && by >= minY && by <= maxY;
        }).map((barrier) => barrier.id),
        ...(floorPlan.criticalPoints ?? []).filter((point) => point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY).map((point) => point.id),
      ];
      setCanvasState(prev => ({ ...prev, selectedId: ids[0] ?? null, selectedIds: ids }));
      setSelectionWindow(null);
      dragStateRef.current = null;
      return;
    }

    if (cadDrag?.mode === 'selection-lasso' && lassoPath.length >= 3) {
      const ids = [
        ...floorPlan.sources.filter((source) => pointInPolygon({ x: source.x, y: source.y }, lassoPath)).map((source) => source.id),
        ...floorPlan.barriers.filter((barrier) => {
          const mid = { x: (barrier.x1 + barrier.x2) / 2, y: (barrier.y1 + barrier.y2) / 2 };
          return pointInPolygon(mid, lassoPath)
            || pointInPolygon({ x: barrier.x1, y: barrier.y1 }, lassoPath)
            || pointInPolygon({ x: barrier.x2, y: barrier.y2 }, lassoPath);
        }).map((barrier) => barrier.id),
        ...(floorPlan.criticalPoints ?? []).filter((point) => pointInPolygon({ x: point.x, y: point.y }, lassoPath)).map((point) => point.id),
      ];
      setCanvasState(prev => ({ ...prev, selectedId: ids[0] ?? null, selectedIds: ids }));
      setLassoPath([]);
      dragStateRef.current = null;
      return;
    }

    if (cadDrag?.mode === 'selection-lasso') {
      setLassoPath([]);
      dragStateRef.current = null;
      return;
    }

    if (cadDrag) {
      dragStateRef.current = null;
      setHoverInfo(null);
      return;
    }

    if (canvasState.isDragging) {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
      return;
    }

    if (drawingState.isDrawing && activeTool === 'barrier') {
      // Create barrier with snap
      const sdx = drawingState.currentX - drawingState.startX;
      const sdy = drawingState.currentY - drawingState.startY;
      const len = Math.sqrt(sdx * sdx + sdy * sdy);

      if (len > 5) { // minimum length
        const start = snapAdvanced({ x: drawingState.startX, y: drawingState.startY }, { preferGeometry: true });
        const end = snapAdvanced({ x: drawingState.currentX, y: drawingState.currentY }, { angleFrom: start, preferGeometry: true });
        const x1 = start.x;
        const y1 = start.y;
        const x2 = end.x;
        const y2 = end.y;
        const newBarrier: Barrier = {
          id: `barrier-${Date.now()}`,
          x1, y1, x2, y2,
          name: `Barrera ${floorPlan.barriers.length + 1}`,
          barrierType: 'secondary',
          useFactor: 0.25,
          occupancyFactor: 0.2,
          designGoal_mSv_per_wk: 0.02,
          materialCode: 'CONCRETE235'
        };
        onFloorPlanChange({
          ...floorPlan,
          barriers: [...floorPlan.barriers, newBarrier]
        });
      }

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
      });
      setHoverInfo(null);
    }
  }, [canvasState.isDragging, drawingState, activeTool, floorPlan, onFloorPlanChange, selectionWindow, lassoPath, pointInPolygon, snapAdvanced]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldBefore = screenToWorld(sx, sy);

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, canvasState.scale * zoomFactor));

    // Adjust offset to zoom toward mouse position
    const newOffsetX = sx - worldBefore.x * newScale;
    const newOffsetY = sy - worldBefore.y * newScale;

    setCanvasState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  }, [canvasState.scale, screenToWorld]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    const ids = canvasState.selectedIds.length ? canvasState.selectedIds : canvasState.selectedId ? [canvasState.selectedId] : [];
    if (!ids.length) return;

    const newSources = floorPlan.sources.filter(s => !ids.includes(s.id));
    const newBarriers = floorPlan.barriers.filter(b => !ids.includes(b.id));
    const newRegions = floorPlan.occupiedRegions.filter(r => !ids.includes(r.id));
    const newAliasRegions = floorPlan.regions?.filter(r => !ids.includes(r.id));
    const newCriticalPoints = (floorPlan.criticalPoints ?? []).filter(p => !ids.includes(p.id));

    onFloorPlanChange({
      ...floorPlan,
      sources: newSources,
      barriers: newBarriers,
      occupiedRegions: newRegions,
      regions: newAliasRegions ?? floorPlan.regions,
      criticalPoints: newCriticalPoints
    });
    setCanvasState(prev => ({ ...prev, selectedId: null, selectedIds: [] }));
  }, [canvasState.selectedId, canvasState.selectedIds, floorPlan, onFloorPlanChange]);

  // Update selected object
  const updateSelected = useCallback((updates: Partial<Barrier | RadiationSource | OccupiedRegion | CriticalPoint>) => {
    if (!canvasState.selectedId) return;
    const id = canvasState.selectedId;

    const source = floorPlan.sources.find(s => s.id === id);
    if (source) {
      const newSources = floorPlan.sources.map(s =>
        s.id === id ? { ...s, ...updates } as RadiationSource : s
      );
      onFloorPlanChange({ ...floorPlan, sources: newSources });
      return;
    }

    const barrier = floorPlan.barriers.find(b => b.id === id);
    if (barrier) {
      const newBarriers = floorPlan.barriers.map(b =>
        b.id === id ? { ...b, ...updates } as Barrier : b
      );
      onFloorPlanChange({ ...floorPlan, barriers: newBarriers });
      return;
    }

    const criticalPoint = floorPlan.criticalPoints?.find(p => p.id === id);
    if (criticalPoint) {
      const newCriticalPoints = (floorPlan.criticalPoints ?? []).map(p =>
        p.id === id ? { ...p, ...updates } as CriticalPoint : p
      );
      onFloorPlanChange({ ...floorPlan, criticalPoints: newCriticalPoints });
      return;
    }

    const region = floorPlan.occupiedRegions.find(r => r.id === id);
    if (region) {
      const newRegions = floorPlan.occupiedRegions.map(r =>
        r.id === id ? { ...r, ...updates } as OccupiedRegion : r
      );
      const newAliasRegions = floorPlan.regions?.map(r =>
        r.id === id ? { ...r, ...updates } as OccupiedRegion : r
      );
      onFloorPlanChange({ ...floorPlan, occupiedRegions: newRegions, regions: newAliasRegions ?? floorPlan.regions });
    }
  }, [canvasState.selectedId, floorPlan, onFloorPlanChange]);

  // Set scale from known distance
  const calibrateScale = useCallback((pixelDistance: number, realDistance_m: number) => {
    const newScale = realDistance_m / pixelDistance;
    onFloorPlanChange({
      ...floorPlan,
      scale_m_per_pixel: newScale
    });
  }, [floorPlan, onFloorPlanChange]);

  // Zoom to fit all objects
  const zoomToFit = useCallback(() => {
    if (!floorPlan.sources.length && !floorPlan.barriers.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of floorPlan.sources) {
      minX = Math.min(minX, s.x - 50); minY = Math.min(minY, s.y - 50);
      maxX = Math.max(maxX, s.x + 50); maxY = Math.max(maxY, s.y + 50);
    }
    for (const b of floorPlan.barriers) {
      minX = Math.min(minX, b.x1, b.x2); minY = Math.min(minY, b.y1, b.y2);
      maxX = Math.max(maxX, b.x1, b.x2); maxY = Math.max(maxY, b.y1, b.y2);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const padding = 60;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = (canvas.width - padding * 2) / contentW;
    const scaleY = (canvas.height - padding * 2) / contentH;
    const newScale = Math.max(0.1, Math.min(10, Math.min(scaleX, scaleY)));
    const newOffsetX = padding - minX * newScale;
    const newOffsetY = padding - minY * newScale;
    setCanvasState(prev => ({ ...prev, scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY }));
  }, [floorPlan, canvasRef]);

  // Export canvas as PNG
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const date = new Date().toISOString().slice(0,10);
    const link = document.createElement('a');
    link.download = `RadShield_Plano_${date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    const heatmapValues = heatmapData?.map((point) => point.kerma) ?? [];
    const minKerma = heatmapValues.length ? Math.min(...heatmapValues) : 0;
    const maxKerma = heatmapValues.length ? Math.max(...heatmapValues) : 0;
    const cadExport = {
      generatedAt: new Date().toISOString(),
      scale_m_per_pixel: floorPlan.scale_m_per_pixel,
      selectedIds: canvasState.selectedIds,
      dimensions: floorPlan.barriers.map((barrier) => ({
        id: barrier.id,
        name: barrier.name,
        length_px: Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1),
        length_m: Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1) * floorPlan.scale_m_per_pixel,
        editable: true,
      })),
      equipmentSymbols: floorPlan.sources.map((source) => ({
        id: source.id,
        name: source.name,
        modality: source.modality?.id,
        rotationDeg: (source as RadiationSource & { rotationDeg?: number }).rotationDeg ?? 0,
        footprint_m: (source as RadiationSource & { footprint_m?: { width: number; depth: number } }).footprint_m ?? null,
        manufacturerVariant: (source as RadiationSource & { manufacturerVariant?: string }).manufacturerVariant ?? 'generic',
      })),
      isocontours: [0.25, 0.5, 0.75].map((ratio) => ({
        ratio,
        kerma: minKerma + (maxKerma - minKerma) * ratio,
        label: `${Math.round(ratio * 100)}%`,
      })),
      regulatoryLegend: {
        weeklyPublicGoal_mSv: 0.02,
        weeklyControlledGoal_mSv: 0.1,
      },
      snappingModes: ['grid', 'endpoint', 'midpoint', 'perpendicular', 'intersection', 'equipment-center', 'angle15'],
      cadLikeFeatures: ['draggable-grips', 'persistent-dimension-export', 'multi-select', 'window-select', 'lasso-select', 'hover-preselection', 'inline-sidebar-edit', 'undo-redo-hook', 'isocontour-labels', 'equipment-rotation'],
    };
    const jsonLink = document.createElement('a');
    jsonLink.download = `RadShield_Plano_${date}_cad.json`;
    jsonLink.href = URL.createObjectURL(new Blob([JSON.stringify(cadExport, null, 2)], { type: 'application/json' }));
    jsonLink.click();
    URL.revokeObjectURL(jsonLink.href);
  }, [canvasRef, canvasState.selectedIds, floorPlan, heatmapData]);

  // Reset view to default (scale=1, centered)
  const resetView = useCallback(() => {
    setCanvasState(prev => ({ ...prev, scale: 1, offsetX: 0, offsetY: 0 }));
  }, []);

  // Toggle snap-to-grid
  const toggleSnap = useCallback(() => {
    setCanvasState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  // ===== Multi-touch state for pinch zoom + two-finger pan =====
  const touchStateRef = useRef<{
    mode: 'none' | 'single' | 'pinch' | 'pan';
    startDist: number;
    startScale: number;
    startOffsetX: number;
    startOffsetY: number;
    midX: number;
    midY: number;
    lastTouchTime: number;
    lastTouchX: number;
    lastTouchY: number;
  }>({ mode: 'none', startDist: 0, startScale: 1, startOffsetX: 0, startOffsetY: 0, midX: 0, midY: 0, lastTouchTime: 0, lastTouchX: 0, lastTouchY: 0 });

  const getTouchPosRaw = useCallback((touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }, [canvasRef]);

  // ===== Touch events for mobile/tablet (A.2: pinch zoom + two-finger pan) =====
  const getTouchPos = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }, [canvasRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ts = touchStateRef.current;
    const now = Date.now();

    if (e.touches.length === 2) {
      // Two-finger: pinch zoom or pan
      const t1 = getTouchPosRaw(e.touches[0]);
      const t2 = getTouchPosRaw(e.touches[1]);
      const dx = t2.x - t1.x;
      const dy = t2.y - t1.y;
      ts.mode = 'pinch';
      ts.startDist = Math.hypot(dx, dy);
      ts.startScale = canvasState.scale;
      ts.startOffsetX = canvasState.offsetX;
      ts.startOffsetY = canvasState.offsetY;
      ts.midX = (t1.x + t2.x) / 2;
      ts.midY = (t1.y + t2.y) / 2;
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const pos = getTouchPos(e);
      if (now - ts.lastTouchTime < 300 && Math.hypot(pos.x - ts.lastTouchX, pos.y - ts.lastTouchY) < 20) {
        // Double-tap: zoom to point
        const worldPos = screenToWorld(pos.x, pos.y);
        const newScale = Math.min(5, canvasState.scale * 1.5);
        setCanvasState(prev => ({
          ...prev,
          scale: newScale,
          offsetX: pos.x - worldPos.x * newScale,
          offsetY: pos.y - worldPos.y * newScale,
        }));
        ts.mode = 'none';
        ts.lastTouchTime = 0;
        return;
      }
      ts.mode = 'single';
      ts.lastTouchTime = now;
      ts.lastTouchX = pos.x;
      ts.lastTouchY = pos.y;
      const synthetic = { clientX: pos.x, clientY: pos.y, button: 0, ctrlKey: false, altKey: false, shiftKey: false } as React.MouseEvent<HTMLCanvasElement>;
      handleMouseDown(synthetic);
    }
  }, [getTouchPos, getTouchPosRaw, handleMouseDown, canvasState.scale, canvasState.offsetX, canvasState.offsetY, screenToWorld]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ts = touchStateRef.current;

    if (e.touches.length === 2 && ts.mode === 'pinch') {
      const t1 = getTouchPosRaw(e.touches[0]);
      const t2 = getTouchPosRaw(e.touches[1]);
      const dx = t2.x - t1.x;
      const dy = t2.y - t1.y;
      const newDist = Math.hypot(dx, dy);
      const pinchScale = newDist / (ts.startDist || 1);
      const newScale = Math.max(0.1, Math.min(10, ts.startScale * pinchScale));

      // Zoom around midpoint
      const worldMidX = (ts.midX - ts.startOffsetX) / ts.startScale;
      const worldMidY = (ts.midY - ts.startOffsetY) / ts.startScale;
      const newOffsetX = ts.midX - worldMidX * newScale;
      const newOffsetY = ts.midY - worldMidY * newScale;

      setCanvasState(prev => ({ ...prev, scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY }));
    } else if (e.touches.length === 1 && ts.mode === 'single') {
      const pos = getTouchPos(e);
      const synthetic = { clientX: pos.x, clientY: pos.y, button: 0, ctrlKey: false, altKey: false, shiftKey: false } as React.MouseEvent<HTMLCanvasElement>;
      handleMouseMove(synthetic);
    }
  }, [getTouchPos, getTouchPosRaw, handleMouseMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ts = touchStateRef.current;
    if (e.touches.length === 0) {
      if (ts.mode === 'single') {
        const synthetic = { clientX: 0, clientY: 0, button: 0, ctrlKey: false, altKey: false, shiftKey: false } as React.MouseEvent<HTMLCanvasElement>;
        handleMouseUp(synthetic);
      }
      ts.mode = 'none';
    } else if (e.touches.length === 1 && ts.mode === 'pinch') {
      // Transition from pinch back to single touch pan
      const pos = getTouchPosRaw(e.touches[0]);
      ts.mode = 'single';
      ts.lastTouchX = pos.x;
      ts.lastTouchY = pos.y;
    }
  }, [getTouchPosRaw, handleMouseUp]);

  // ===== Isodosis animation =====
  const [isodosisOpacity, setIsodosisOpacity] = useState(0.3);
  const isodosisDirection = useRef(1);

  useEffect(() => {
    if (!heatmapData?.length) return;
    let animId: number;
    const animate = () => {
      setIsodosisOpacity(prev => {
        const next = prev + isodosisDirection.current * 0.01;
        if (next >= 0.5) isodosisDirection.current = -1;
        if (next <= 0.15) isodosisDirection.current = 1;
        return next;
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [heatmapData]);

  return {
    canvasRef,
    canvasState,
    setCanvasState,
    drawingState,
    hoverInfo,
    screenToWorld,
    worldToScreen,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    deleteSelected,
    updateSelected,
    calibrateScale,
    resetView,
    zoomToFit,
    exportPNG,
    toggleSnap,
    draw,
    isodosisOpacity
  };
}
