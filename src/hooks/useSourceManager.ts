/**
 * ═══════════════════════════════════════════════════════════
 * useSourceManager — Manage real radiation sources on canvas
 * Maps each source to correct NCRP/IAEA/CNSNS/AAPM standard
 * ═══════════════════════════════════════════════════════════
 */
import { useState, useCallback } from 'react';
import type { SourceCatalogItem } from '@/sections/SourceSelector';

export interface PlacedSource {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  energyLabel: string;
  energyMeV: number;
  standard: string;
  ncrpReport: string | null;
  aapmTg: string | null;
  iaeaRef: string | null;
  cnsnsRef: string | null;
  workloadGyWeek: number;
  posX: number;
  posY: number;
  fieldSizeCm: number;
  beamDirection: string;
}

export function useSourceManager() {
  const [sources, setSources] = useState<PlacedSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const addSource = useCallback((catalogItem: SourceCatalogItem, posX: number, posY: number) => {
    const newSource: PlacedSource = {
      id: `source_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      catalogId: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      energyLabel: catalogItem.energy,
      energyMeV: parseFloat(catalogItem.energy.match(/[\d.]+/)?.[0] || '6'),
      standard: catalogItem.standard,
      ncrpReport: catalogItem.ncrp_report,
      aapmTg: catalogItem.aapm_tg,
      iaeaRef: catalogItem.iaea_ref,
      cnsnsRef: catalogItem.cnsns_ref,
      workloadGyWeek: catalogItem.workload_default,
      posX,
      posY,
      fieldSizeCm: catalogItem.category === 'radiosurgery' ? 6 : 20,
      beamDirection: catalogItem.category === 'radiosurgery' ? 'stereotactic' : 'isocentric',
    };

    setSources(prev => [...prev, newSource]);
    setSelectedSourceId(newSource.id);
    setShowSelector(false);
    return newSource;
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    if (selectedSourceId === id) setSelectedSourceId(null);
  }, [selectedSourceId]);

  const updateSource = useCallback((id: string, updates: Partial<PlacedSource>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const selectSource = useCallback((id: string | null) => {
    setSelectedSourceId(id);
  }, []);

  const clearSources = useCallback(() => {
    setSources([]);
    setSelectedSourceId(null);
  }, []);

  const getStandardsForSource = useCallback((sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return [];
    const standards = [];
    if (source.ncrpReport) standards.push(`NCRP-${source.ncrpReport}`);
    if (source.aapmTg) standards.push(`AAPM ${source.aapmTg}`);
    if (source.iaeaRef) standards.push(source.iaeaRef);
    if (source.cnsnsRef) standards.push(source.cnsnsRef);
    return standards;
  }, [sources]);

  return {
    sources,
    selectedSourceId,
    showSelector,
    setShowSelector,
    addSource,
    removeSource,
    updateSource,
    selectSource,
    clearSources,
    getStandardsForSource,
  };
}
