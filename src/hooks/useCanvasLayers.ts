/**
 * Canvas Layers System — Prioridad ALTA del analisis SmartDraw
 * 7 capas: Grid, Architecture, Shielding, Sources, Heatmap, Annotations, UI
 */
import { useState, useCallback } from 'react';

export interface CanvasLayer {
  id: string;
  name: string;
  nameEs: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  color: string; // hex for layer indicator
}

export const DEFAULT_LAYERS: CanvasLayer[] = [
  { id: 'grid', name: 'Grid', nameEs: 'Cuadricula', visible: true, opacity: 1, locked: true, color: '#94a3b8' },
  { id: 'architecture', name: 'Architecture', nameEs: 'Arquitectura', visible: true, opacity: 1, locked: false, color: '#f59e0b' },
  { id: 'shielding', name: 'Shielding', nameEs: 'Blindaje', visible: true, opacity: 1, locked: false, color: '#10b981' },
  { id: 'sources', name: 'Sources', nameEs: 'Fuentes', visible: true, opacity: 1, locked: false, color: '#ef4444' },
  { id: 'heatmap', name: 'Heatmap', nameEs: 'Mapa Calor', visible: true, opacity: 0.7, locked: false, color: '#8b5cf6' },
  { id: 'annotations', name: 'Annotations', nameEs: 'Anotaciones', visible: true, opacity: 1, locked: false, color: '#ec4899' },
  { id: 'ui', name: 'UI Overlay', nameEs: 'UI Overlay', visible: true, opacity: 1, locked: true, color: '#06b6d4' },
];

export function useCanvasLayers(initialLayers = DEFAULT_LAYERS) {
  const [layers, setLayers] = useState<CanvasLayer[]>(initialLayers);
  const [activeLayer, setActiveLayer] = useState('shielding');

  const toggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l));
  }, []);

  const toggleLock = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  }, []);

  const isVisible = useCallback((id: string) => {
    return layers.find(l => l.id === id)?.visible ?? true;
  }, [layers]);

  const getOpacity = useCallback((id: string) => {
    return layers.find(l => l.id === id)?.opacity ?? 1;
  }, [layers]);

  const isLocked = useCallback((id: string) => {
    return layers.find(l => l.id === id)?.locked ?? false;
  }, [layers]);

  const resetLayers = useCallback(() => {
    setLayers(DEFAULT_LAYERS);
    setActiveLayer('shielding');
  }, []);

  return {
    layers, activeLayer, setActiveLayer,
    toggleLayer, setLayerOpacity, toggleLock,
    isVisible, getOpacity, isLocked, resetLayers,
  };
}
