/**
 * useControlledAreas — Polygon-based controlled area drawing for canvas
 * Implements: CNSNS NOM-008-ENER controlled/supervised/public zones
 * Colors: Red (controlled), Amber (supervised), Green (public)
 * McGinley Chapter 9: Room surveys and area classification
 */
import { useState, useCallback } from 'react';

export type AreaClassification = 'controlled' | 'supervised' | 'public' | 'restricted';

export interface ControlledArea {
  id: string;
  name: string;
  classification: AreaClassification;
  polygon: Array<{ x: number; y: number }>; // pixel coordinates
  maxDoseRate_uSv_h: number;
  annualLimit_mSv: number;
  occupancyFactor: number;
  color: string;
  opacity: number;
}

const AREA_COLORS: Record<AreaClassification, { fill: string; stroke: string; label: string }> = {
  controlled:  { fill: 'rgba(239, 68, 68, 0.15)',  stroke: '#ef4444', label: 'Área Controlada' },
  supervised:  { fill: 'rgba(245, 158, 11, 0.15)',  stroke: '#f59e0b', label: 'Área Supervisada' },
  public:      { fill: 'rgba(34, 197, 94, 0.15)',   stroke: '#22c55e', label: 'Área Pública' },
  restricted:  { fill: 'rgba(139, 92, 246, 0.15)',  stroke: '#8b5cf6', label: 'Área Restringida' },
};

export const AREA_LIMITS: Record<AreaClassification, { doseRate_uSv_h: number; annual_mSv: number }> = {
  controlled:  { doseRate_uSv_h: 20,   annual_mSv: 20 },
  supervised:  { doseRate_uSv_h: 7.5,  annual_mSv: 5 },
  public:      { doseRate_uSv_h: 0.375, annual_mSv: 1 },
  restricted:  { doseRate_uSv_h: 100,  annual_mSv: 50 },
};

export function getAreaColor(cls: AreaClassification) {
  return AREA_COLORS[cls];
}

export function useControlledAreas() {
  const [areas, setAreas] = useState<ControlledArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [activeClassification, setActiveClassification] = useState<AreaClassification>('controlled');

  const startDrawing = useCallback((x: number, y: number) => {
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    setCurrentPoints(prev => [...prev, { x, y }]);
  }, [isDrawing]);

  const finishDrawing = useCallback((name?: string) => {
    if (!isDrawing || currentPoints.length < 3) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }
    const colors = AREA_COLORS[activeClassification];
    const limits = AREA_LIMITS[activeClassification];
    const newArea: ControlledArea = {
      id: `area-${Date.now()}`,
      name: name || `${colors.label} ${areas.length + 1}`,
      classification: activeClassification,
      polygon: [...currentPoints],
      maxDoseRate_uSv_h: limits.doseRate_uSv_h,
      annualLimit_mSv: limits.annual_mSv,
      occupancyFactor: activeClassification === 'controlled' ? 1 :
        activeClassification === 'supervised' ? 0.5 :
        activeClassification === 'public' ? 0.125 : 1,
      color: colors.stroke,
      opacity: 0.15,
    };
    setAreas(prev => [...prev, newArea]);
    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, activeClassification, areas.length]);

  const deleteArea = useCallback((id: string) => {
    setAreas(prev => prev.filter(a => a.id !== id));
    if (selectedAreaId === id) setSelectedAreaId(null);
  }, [selectedAreaId]);

  const updateArea = useCallback((id: string, updates: Partial<ControlledArea>) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const clearAreas = useCallback(() => {
    setAreas([]);
    setSelectedAreaId(null);
  }, []);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentPoints([]);
  }, []);

  return {
    areas,
    isDrawing,
    currentPoints,
    selectedAreaId,
    activeClassification,
    setActiveClassification,
    setSelectedAreaId,
    startDrawing,
    addPoint,
    finishDrawing,
    deleteArea,
    updateArea,
    clearAreas,
    cancelDrawing,
  };
}
