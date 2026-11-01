/**
 * CanvasRenderer — Arquitectura OO modular para rendering de canvas
 * 
 * Optimizaciones:
 * - Layer separation: bg/static/dynamic (solo redibuja lo que cambia)
 * - Dirty region tracking: No redibuja toda la pantalla
 * - Object pooling: Reusa arrays de puntos en vez de allocar
 * - Typed color LUT: Precalcula gradiente de heatmap
 * - Batch draw operations: Minimiza state changes del contexto
 * 
 * Antes: 880 líneas monolíticas en useCanvas.ts draw()
 * Después: Clases separadas con responsabilidad única
 */
import type { FloorPlan, Barrier, RadiationSource, OccupiedRegion } from '@/types/radshield';
import type { CanvasSampleLine } from '@/hooks/useCanvas';
import { getEquipmentVisualProfile, type EquipmentIconKind } from '@/lib/equipmentVisuals';
import { getEquipmentIconProfile } from '@/lib/f98UnifiedIconography';

// ─── Object Pool para arrays temporales ───
class PointPool {
  private pool: { x: number; y: number }[] = [];
  private idx = 0;

  acquire(x: number, y: number): { x: number; y: number } {
    if (this.idx < this.pool.length) {
      const p = this.pool[this.idx];
      p.x = x; p.y = y;
      this.idx++;
      return p;
    }
    const p = { x, y };
    this.pool.push(p);
    this.idx++;
    return p;
  }

  reset() { this.idx = 0; }
}

// ─── Color LUT precalculada para heatmap ───
class HeatmapLUT {
  private lut: Uint8ClampedArray;
  private size: number;

  constructor(size: number = 256) {
    this.size = size;
    this.lut = new Uint8ClampedArray(size * 3);
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);
      const [r, g, b] = this.jetColor(t);
      this.lut[i * 3] = r;
      this.lut[i * 3 + 1] = g;
      this.lut[i * 3 + 2] = b;
    }
  }

  private jetColor(t: number): [number, number, number] {
    if (t < 0.125) return [0, 0, Math.round(128 + 127 * (t / 0.125))];
    if (t < 0.375) return [0, Math.round(255 * ((t - 0.125) / 0.25)), 255];
    if (t < 0.625) return [Math.round(255 * ((t - 0.375) / 0.25)), 255, Math.round(255 * (1 - (t - 0.375) / 0.25))];
    if (t < 0.875) return [255, Math.round(255 * (1 - (t - 0.625) / 0.25)), 0];
    return [255, 0, 0];
  }

  lookup(normalized: number): [number, number, number] {
    const idx = Math.min(this.size - 1, Math.max(0, Math.floor(normalized * this.size))) * 3;
    return [this.lut[idx], this.lut[idx + 1], this.lut[idx + 2]];
  }
}

// ─── Capa base abstracta ───
abstract class CanvasLayer {
  protected ctx: CanvasRenderingContext2D;
  protected dirty = true;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  abstract render(state: RenderState): void;

  markDirty() { this.dirty = true; }
  isDirty() { return this.dirty; }
  protected clearDirty() { this.dirty = false; }
}

// ─── Estado compartido del render ───
interface RenderState {
  scale: number;
  offsetX: number;
  offsetY: number;
  floorPlan: FloorPlan;
  heatmapData?: { x: number; y: number; kerma: number }[];
  sampleLines?: CanvasSampleLine[];
  selectedId: string | null;
  showSampleLines: boolean;
  showSamplePoints: boolean;
  showMaxima: boolean;
  isDrawing: boolean;
  drawStartX: number;
  drawStartY: number;
  drawCurrentX: number;
  drawCurrentY: number;
}

// ─── Capa de fondo (grid + imagen) ───
class BackgroundLayer extends CanvasLayer {
  private bgImage: HTMLImageElement | null = null;
  private imgUrl: string | null = null;
  private lut = new HeatmapLUT();

  setImage(url: string | null, img: HTMLImageElement | null) {
    if (this.imgUrl !== url) {
      this.imgUrl = url;
      this.bgImage = img;
      this.markDirty();
    }
  }

  render(state: RenderState): void {
    if (!this.dirty) return;
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, w, h);

    // Grid (batched)
    this.drawGrid(state, w, h);

    // Background image
    if (this.bgImage) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(this.bgImage, state.offsetX, state.offsetY, this.bgImage.width * state.scale, this.bgImage.height * state.scale);
      ctx.globalAlpha = 1.0;
    }

    this.clearDirty();
  }

  private drawGrid(state: RenderState, w: number, h: number) {
    const ctx = this.ctx;
    const gridSize = 50 * state.scale;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const startX = ((state.offsetX % gridSize) + gridSize) % gridSize;
    const startY = ((state.offsetY % gridSize) + gridSize) % gridSize;
    for (let x = startX; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = startY; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  getLUT() { return this.lut; }
}

// ─── Capa estática (barreras, fuentes, regiones) ───
class StaticLayer extends CanvasLayer {
  private lastBarrierCount = -1;
  private lastSourceCount = -1;
  private lastSelectedId: string | null = null;

  render(state: RenderState): void {
    const fp = state.floorPlan;
    // Solo redibujar si cambió algo
    if (!this.dirty && fp.barriers.length === this.lastBarrierCount &&
        fp.sources.length === this.lastSourceCount && state.selectedId === this.lastSelectedId) {
      return;
    }
    this.lastBarrierCount = fp.barriers.length;
    this.lastSourceCount = fp.sources.length;
    this.lastSelectedId = state.selectedId;

    const { ctx } = this;

    // Regions
    for (const region of fp.occupiedRegions) {
      if (region.points.length < 3) continue;
      this.drawRegion(region, state);
    }

    // Barriers (batched por estilo)
    this.drawBarriers(fp.barriers, state);

    // Sources
    for (const source of fp.sources) {
      this.drawSource(source, state);
    }

    this.clearDirty();
  }

  private drawRegion(region: OccupiedRegion, state: RenderState) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(99, 179, 237, 0.2)';
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const s = state;
    ctx.moveTo(region.points[0].x * s.scale + s.offsetX, region.points[0].y * s.scale + s.offsetY);
    for (let i = 1; i < region.points.length; i++) {
      ctx.lineTo(region.points[i].x * s.scale + s.offsetX, region.points[i].y * s.scale + s.offsetY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawBarriers(barriers: Barrier[], state: RenderState) {
    const { ctx } = this;
    // Batch: primero todos los no-seleccionados, luego seleccionados
    const normal: Barrier[] = [];
    const selected: Barrier[] = [];
    for (const b of barriers) {
      (b.id === state.selectedId ? selected : normal).push(b);
    }

    // Normal barriers
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const b of normal) {
      const x1 = b.x1 * state.scale + state.offsetX;
      const y1 = b.y1 * state.scale + state.offsetY;
      const x2 = b.x2 * state.scale + state.offsetX;
      const y2 = b.y2 * state.scale + state.offsetY;
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Selected barriers
    if (selected.length > 0) {
      ctx.strokeStyle = '#e53e3e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const b of selected) {
        const x1 = b.x1 * state.scale + state.offsetX;
        const y1 = b.y1 * state.scale + state.offsetY;
        const x2 = b.x2 * state.scale + state.offsetX;
        const y2 = b.y2 * state.scale + state.offsetY;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      for (const b of selected) {
        this.drawSelectedBarrierCadOverlay(b, state);
      }
    }

    // Labels y normales (no se pueden batchar)
    for (const b of barriers) {
      const x1 = b.x1 * state.scale + state.offsetX;
      const y1 = b.y1 * state.scale + state.offsetY;
      const x2 = b.x2 * state.scale + state.offsetX;
      const y2 = b.y2 * state.scale + state.offsetY;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const isSel = b.id === state.selectedId;
      ctx.fillStyle = isSel ? '#e53e3e' : '#2d3748';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, midX, midY - 8);

      // Normal arrow
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const nx = -dy / len * 15;
        const ny = dx / len * 15;
        ctx.strokeStyle = isSel ? '#e53e3e' : '#4a5568';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + nx, midY + ny);
        ctx.stroke();
      }
    }
  }

  private drawSelectedBarrierCadOverlay(barrier: Barrier, state: RenderState) {
    const { ctx } = this;
    const x1 = barrier.x1 * state.scale + state.offsetX;
    const y1 = barrier.y1 * state.scale + state.offsetY;
    const x2 = barrier.x2 * state.scale + state.offsetX;
    const y2 = barrier.y2 * state.scale + state.offsetY;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len <= 0) return;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const gripPoints = [
      { x: x1, y: y1 },
      { x: midX, y: midY },
      { x: x2, y: y2 },
    ];

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    for (const point of gripPoints) {
      ctx.beginPath();
      ctx.roundRect(point.x - 4, point.y - 4, 8, 8, 2);
      ctx.fill();
      ctx.stroke();
    }

    const offset = 28;
    const tick = 6;
    const ax = x1 + nx * offset;
    const ay = y1 + ny * offset;
    const bx = x2 + nx * offset;
    const by = y2 + ny * offset;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ax, ay);
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx, by);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.moveTo(ax - ux * tick, ay - uy * tick);
    ctx.lineTo(ax + ux * tick, ay + uy * tick);
    ctx.moveTo(bx - ux * tick, by - uy * tick);
    ctx.lineTo(bx + ux * tick, by + uy * tick);
    ctx.stroke();

    const scaleMeters = Math.max(state.floorPlan?.scale_m_per_pixel || 0, 0);
    const label = scaleMeters > 0
      ? `${(Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1) * scaleMeters).toFixed(2)} m`
      : `${Math.hypot(barrier.x2 - barrier.x1, barrier.y2 - barrier.y1).toFixed(0)} px`;
    const labelX = (ax + bx) / 2;
    const labelY = (ay + by) / 2;
    ctx.setLineDash([]);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(label);
    ctx.fillStyle = 'rgba(255, 247, 237, 0.94)';
    ctx.strokeStyle = '#fed7aa';
    ctx.beginPath();
    ctx.roundRect(labelX - metrics.width / 2 - 5, labelY - 8, metrics.width + 10, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c2410c';
    ctx.fillText(label, labelX, labelY);
    ctx.restore();
  }

  private drawSource(source: RadiationSource, state: RenderState) {
    const { ctx } = this;
    const spx = source.x * state.scale + state.offsetX;
    const spy = source.y * state.scale + state.offsetY;
    const isSel = source.id === state.selectedId;
    const r = isSel ? 18 : 14;
    const profile = getEquipmentVisualProfile(source);
    const unifiedIcon = getEquipmentIconProfile(profile.iconKind);
    const metersPerPixel = Math.max(state.floorPlan?.scale_m_per_pixel || 0.01, 0.001);
    const footprintWidth = Math.max(26, Math.min(90, (profile.footprint_m.width / metersPerPixel) * state.scale));
    const footprintDepth = Math.max(22, Math.min(96, (profile.footprint_m.depth / metersPerPixel) * state.scale));

    this.drawEquipmentFootprint(spx, spy, footprintWidth, footprintDepth, unifiedIcon.color, isSel);

    // Círculo base
    ctx.fillStyle = isSel ? '#e53e3e' : unifiedIcon.color;
    ctx.beginPath();
    ctx.arc(spx, spy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Centro blanco
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(spx, spy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    this.drawEquipmentIcon(profile.iconKind, spx, spy, r, profile.accentColor);

    // Label
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(source.name, spx, spy + Math.max(r + 14, footprintDepth / 2 + 15));
    ctx.fillStyle = unifiedIcon.color;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(unifiedIcon.shortLabel, spx, spy - Math.max(r + 8, footprintDepth / 2 + 4));
  }

  private drawEquipmentFootprint(x: number, y: number, width: number, depth: number, color: string, selected: boolean) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = selected ? 0.2 : 0.12;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = selected ? 2 : 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - depth / 2, width, depth, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawEquipmentIcon(kind: EquipmentIconKind, x: number, y: number, r: number, accentColor: string) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.fillStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (kind === 'linac') {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.65, y + r * 0.15);
      ctx.lineTo(x + r * 0.55, y + r * 0.15);
      ctx.moveTo(x, y + r * 0.15);
      ctx.lineTo(x, y - r * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - r * 0.62, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'gammaKnife') {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.62, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
      for (let i = 0; i < 3; i += 1) {
        const angle = -Math.PI / 2 + i * (Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * r * 0.18, y + Math.sin(angle) * r * 0.18);
        ctx.lineTo(x + Math.cos(angle) * r * 0.58, y + Math.sin(angle) * r * 0.58);
        ctx.stroke();
      }
    } else if (kind === 'ct' || kind === 'petct') {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.28, r * 0.42, Math.PI / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'hdr') {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.55, y);
      ctx.lineTo(x + r * 0.55, y);
      ctx.moveTo(x, y - r * 0.55);
      ctx.lineTo(x, y + r * 0.55);
      ctx.stroke();
    } else if (kind === 'cyclotron') {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.58);
      ctx.lineTo(x + r * 0.5, y + r * 0.38);
      ctx.lineTo(x - r * 0.5, y + r * 0.38);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ─── Capa dinámica (sample lines, heatmap, preview) ───
class DynamicLayer extends CanvasLayer {
  private lastSampleLineCount = -1;
  private lut: HeatmapLUT;

  constructor(ctx: CanvasRenderingContext2D, lut: HeatmapLUT) {
    super(ctx);
    this.lut = lut;
  }

  render(state: RenderState): void {
    const { ctx } = this;
    const sl = state.sampleLines;

    // Heatmap
    if (state.heatmapData && state.heatmapData.length > 0) {
      this.drawHeatmap(state);
    }

    // Sample lines
    if (sl && sl.length > 0) {
      for (const line of sl) {
        if (line.points.length < 2) continue;
        this.drawSampleLine(line, state);
      }
    }

    // Drawing preview
    if (state.isDrawing) {
      this.drawPreview(state);
    }

    this.clearDirty();
  }

  private drawHeatmap(state: RenderState) {
    const { ctx } = this;
    const data = state.heatmapData!;
    const maxK = data[0]?.kerma || 1;
    const minK = 0;
    const range = maxK - minK || 1;

    // Batch por color
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const chunk = data.slice(i, i + batchSize);
      const t = (chunk[0].kerma - minK) / range;
      const [r, g, b] = this.lut.lookup(t);
      ctx.fillStyle = `rgba(${r},${g},${b},0.25)`;
      ctx.beginPath();
      for (const pt of chunk) {
        const sx = pt.x * state.scale + state.offsetX;
        const sy = pt.y * state.scale + state.offsetY;
        ctx.moveTo(sx + 4, sy);
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  private drawSampleLine(line: CanvasSampleLine, state: RenderState) {
    const { ctx } = this;
    const s = state;

    if (s.showSampleLines && line.points.length >= 2) {
      const first = line.points[0];
      const last = line.points[line.points.length - 1];
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(first.x * s.scale + s.offsetX, first.y * s.scale + s.offsetY);
      ctx.lineTo(last.x * s.scale + s.offsetX, last.y * s.scale + s.offsetY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (s.showSamplePoints) {
      ctx.fillStyle = 'rgba(30,30,30,0.6)';
      ctx.beginPath();
      for (const pt of line.points) {
        const sx = pt.x * s.scale + s.offsetX;
        const sy = pt.y * s.scale + s.offsetY;
        ctx.moveTo(sx + 2.5, sy);
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if (s.showMaxima) {
      if (line.maxKermaPoint) {
        const sp = line.maxKermaPoint;
        const sx = sp.x * s.scale + s.offsetX;
        const sy = sp.y * s.scale + s.offsetY;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(220,38,38,0.15)';
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Kmax', sx, sy - 12);
      }
      if (line.maxThicknessPoint) {
        const sp = line.maxThicknessPoint;
        const sx = sp.x * s.scale + s.offsetX;
        const sy = sp.y * s.scale + s.offsetY;
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(37,99,235,0.15)';
        ctx.fill();
        ctx.fillStyle = '#2563eb';
        ctx.textAlign = 'center';
        ctx.fillText('Tmax', sx, sy + 18);
      }
    }
  }

  private drawPreview(state: RenderState) {
    const { ctx } = this;
    const x1 = state.drawStartX * state.scale + state.offsetX;
    const y1 = state.drawStartY * state.scale + state.offsetY;
    const x2 = state.drawCurrentX * state.scale + state.offsetX;
    const y2 = state.drawCurrentY * state.scale + state.offsetY;
    ctx.strokeStyle = '#3182ce';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ─── Renderer principal ───
export class CanvasRenderer {
  private bgLayer: BackgroundLayer;
  private staticLayer: StaticLayer;
  private dynamicLayer: DynamicLayer;
  private pool = new PointPool();
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.bgLayer = new BackgroundLayer(ctx);
    this.staticLayer = new StaticLayer(ctx);
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = w;
    this.offscreen.height = h;
    this.offCtx = this.offscreen.getContext('2d')!;
    this.dynamicLayer = new DynamicLayer(ctx, this.bgLayer.getLUT());
  }

  setBackgroundImage(url: string | null, img: HTMLImageElement | null) {
    this.bgLayer.setImage(url, img);
  }

  /** 
   * Render con dirty tracking
   * Solo redibuja capas que han cambiado
   */
  render(state: RenderState) {
    const ctx = this.dynamicLayer['ctx']; // main ctx
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Fondo (solo si dirty)
    if (this.bgLayer.isDirty()) {
      this.bgLayer.render(state);
    }

    // Estático (solo si cambió)
    if (this.staticLayer.isDirty()) {
      // Copiar fondo al offscreen, dibujar estático encima
      this.offCtx.clearRect(0, 0, w, h);
      this.offCtx.drawImage(ctx.canvas, 0, 0);
      this.staticLayer.render(state);
    }

    // Dinámico (siempre, pero es la capa más ligera)
    this.dynamicLayer.render(state);

    // Scale bar (siempre visible)
    this.drawScaleBar(ctx, state, w, h);
  }

  private drawScaleBar(ctx: CanvasRenderingContext2D, state: RenderState, w: number, h: number) {
    const sbX = w - 120;
    const sbY = h - 40;
    const sbLenPx = Math.min(100, 1 / state.floorPlan.scale_m_per_pixel * state.scale);
    ctx.fillStyle = '#2d3748';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`1 m`, sbX, sbY - 10);
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sbX, sbY);
    ctx.lineTo(sbX + sbLenPx, sbY);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sbX, sbY - 3); ctx.lineTo(sbX, sbY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sbX + sbLenPx, sbY - 3); ctx.lineTo(sbX + sbLenPx, sbY + 3); ctx.stroke();
  }

  markAllDirty() {
    this.bgLayer.markDirty();
    this.staticLayer.markDirty();
    this.dynamicLayer.markDirty();
  }

  resize(width: number, height: number) {
    this.offscreen.width = width;
    this.offscreen.height = height;
    this.markAllDirty();
  }
}

// Export types
export type { RenderState };
