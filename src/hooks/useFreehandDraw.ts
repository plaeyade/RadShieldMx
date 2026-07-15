/**
 * Freehand Draw — Dibujo a mano alzada para anotaciones rapidas en canvas
 * Prioridad MEDIA del analisis SmartDraw
 * Solo activo en Layer 5 (Annotations)
 */
import { useState, useCallback, useRef } from 'react';

export interface FreehandStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  timestamp: number;
}

export function useFreehandDraw() {
  const [strokes, setStrokes] = useState<FreehandStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [currentWidth, setCurrentWidth] = useState(2);
  const [isEnabled, setIsEnabled] = useState(false);
  const currentStrokeRef = useRef<FreehandStroke | null>(null);
  const nextIdRef = useRef(1);

  const startStroke = useCallback((x: number, y: number) => {
    if (!isEnabled) return;
    const id = `stroke-${nextIdRef.current++}`;
    const stroke: FreehandStroke = {
      id, points: [{ x, y }], color: currentColor, width: currentWidth, timestamp: Date.now(),
    };
    currentStrokeRef.current = stroke;
    setIsDrawing(true);
  }, [isEnabled, currentColor, currentWidth]);

  const addPoint = useCallback((x: number, y: number) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push({ x, y });
  }, [isDrawing]);

  const endStroke = useCallback(() => {
    if (!currentStrokeRef.current) return;
    setStrokes(prev => [...prev, currentStrokeRef.current!]);
    currentStrokeRef.current = null;
    setIsDrawing(false);
  }, []);

  const undoLastStroke = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
  }, []);

  const getCurrentStroke = useCallback(() => {
    return currentStrokeRef.current;
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    strokes, isDrawing, isEnabled, setIsEnabled, toggleEnabled,
    currentColor, setCurrentColor,
    currentWidth, setCurrentWidth,
    startStroke, addPoint, endStroke,
    undoLastStroke, clearStrokes,
    getCurrentStroke,
  };
}
