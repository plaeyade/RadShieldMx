/**
 * useOffscreenCanvas — Renderizado de canvas en Web Worker
 * Recomendación v44 #15: OffscreenCanvas para renderizado no-bloqueante
 * Chrome 69+, Firefox 105+, Safari 16.4+
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function useOffscreenCanvas(
  containerRef: React.RefObject<HTMLElement | null>,
  onRender: (ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) => void
) {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof OffscreenCanvas === 'undefined' || typeof Worker === 'undefined') {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
  }, []);

  const init = useCallback(async () => {
    if (!isSupported || !containerRef.current) return false;

    try {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      // Create visible canvas
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      container.appendChild(canvas);
      canvasRef.current = canvas;

      // Transfer to offscreen
      const offscreen = canvas.transferControlToOffscreen();
      offscreenRef.current = offscreen;

      // Create worker with inline script
      const workerCode = `
        let offscreenCanvas = null;
        let ctx = null;

        self.onmessage = function(event) {
          const { type, canvas, width, height, dpr, renderData } = event.data;

          if (type === 'init') {
            offscreenCanvas = canvas;
            ctx = offscreenCanvas.getContext('2d');
            offscreenCanvas.width = Math.floor(width * dpr);
            offscreenCanvas.height = Math.floor(height * dpr);
            if (ctx) ctx.scale(dpr, dpr);
            self.postMessage({ type: 'ready' });
          }

          if (type === 'render' && ctx) {
            // Clear
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, width, height);

            // Draw grid
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            const gridSize = 20;
            for (let x = 0; x < width; x += gridSize) {
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
            }
            for (let y = 0; y < height; y += gridSize) {
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
            }

            // Draw barriers from renderData
            if (renderData && renderData.barriers) {
              renderData.barriers.forEach((b) => {
                ctx.strokeStyle = b.color || '#374151';
                ctx.lineWidth = b.lineWidth || 3;
                ctx.beginPath();
                ctx.moveTo(b.x1, b.y1);
                ctx.lineTo(b.x2, b.y2);
                ctx.stroke();

                // Label
                if (b.name) {
                  ctx.fillStyle = '#374151';
                  ctx.font = '10px sans-serif';
                  ctx.fillText(b.name, (b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2 - 5);
                }
              });
            }

            // Draw sources
            if (renderData && renderData.sources) {
              renderData.sources.forEach((s) => {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText(s.name || 'Fuente', s.x + 8, s.y - 8);
              });
            }

            // Draw sample lines
            if (renderData && renderData.sampleLines) {
              renderData.sampleLines.forEach((sl) => {
                if (sl.points && sl.points.length > 1) {
                  ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
                  ctx.setLineDash([4, 4]);
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(sl.points[0].x, sl.points[0].y);
                  for (let i = 1; i < sl.points.length; i++) {
                    ctx.lineTo(sl.points[i].x, sl.points[i].y);
                  }
                  ctx.stroke();
                  ctx.setLineDash([]);
                }
              });
            }

            self.postMessage({ type: 'rendered' });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      await new Promise<void>((resolve) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'ready') resolve();
        };
        worker.postMessage({
          type: 'init',
          canvas: offscreen,
          width: w,
          height: h,
          dpr,
        }, [offscreen]);
      });

      setIsReady(true);
      return true;
    } catch (err) {
      console.warn('OffscreenCanvas init failed:', err);
      return false;
    }
  }, [isSupported, containerRef]);

  const render = useCallback((renderData: any) => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({ type: 'render', renderData });
  }, [isReady]);

  // Fallback resize
  useEffect(() => {
    if (!isSupported) return;
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSupported, containerRef]);

  const destroy = useCallback(() => {
    workerRef.current?.terminate();
    if (canvasRef.current && containerRef.current) {
      containerRef.current.removeChild(canvasRef.current);
    }
    offscreenRef.current = null;
    canvasRef.current = null;
    workerRef.current = null;
  }, [containerRef]);

  return {
    isSupported,
    isReady,
    init,
    render,
    destroy,
    canvasElement: canvasRef.current,
  };
}
