/**
 * ═══════════════════════════════════════════════════════════
 * useCanvasZoom — Mouse-centered zoom with smooth transitions
 * Recommendation A.1: Zoom centered on cursor position
 * Formula: worldX = (mouseX - centerX - offsetX) / scale
 *          newOffsetX = mouseX - centerX - worldX * newScale
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef } from "react";

export interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_SENSITIVITY = 0.001;

export function useCanvasZoom(
  containerWidth: number,
  containerHeight: number
) {
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  /**
   * Zoom centered on a specific point (typically mouse position)
   */
  const zoomAt = useCallback(
    (clientX: number, clientY: number, deltaScale: number) => {
      setTransform((prev) => {
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale * (1 - deltaScale * ZOOM_SENSITIVITY))
        );

        // Center of the container
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        // Mouse position relative to container center
        const mouseX = clientX - centerX;
        const mouseY = clientY - centerY;

        // World coordinates under the mouse before zoom
        const worldX = (mouseX - prev.offsetX) / prev.scale;
        const worldY = (mouseY - prev.offsetY) / prev.scale;

        // New offset to keep the same world point under the mouse
        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        return {
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        };
      });
    },
    [containerWidth, containerHeight]
  );

  /**
   * Simple zoom in/out from center (for buttons)
   */
  const zoomIn = useCallback(() => {
    zoomAt(containerWidth / 2, containerHeight / 2, -300);
  }, [containerWidth, containerHeight, zoomAt]);

  const zoomOut = useCallback(() => {
    zoomAt(containerWidth / 2, containerHeight / 2, 300);
  }, [containerWidth, containerHeight, zoomAt]);

  /**
   * Reset zoom to fit
   */
  const zoomToFit = useCallback(() => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  /**
   * Pan handlers
   */
  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    lastPanPos.current = { x: clientX, y: clientY };
  }, []);

  const pan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPanning.current) return;
      const dx = clientX - lastPanPos.current.x;
      const dy = clientY - lastPanPos.current.y;
      lastPanPos.current = { x: clientX, y: clientY };
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
    },
    []
  );

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  /**
   * Convert screen coordinates to world coordinates
   */
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      return {
        x: (screenX - centerX - transform.offsetX) / transform.scale,
        y: (screenY - centerY - transform.offsetY) / transform.scale,
      };
    },
    [transform, containerWidth, containerHeight]
  );

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      return {
        x: worldX * transform.scale + transform.offsetX + centerX,
        y: worldY * transform.scale + transform.offsetY + centerY,
      };
    },
    [transform, containerWidth, containerHeight]
  );

  return {
    transform,
    zoomAt,
    zoomIn,
    zoomOut,
    zoomToFit,
    startPan,
    pan,
    endPan,
    screenToWorld,
    worldToScreen,
  };
}
