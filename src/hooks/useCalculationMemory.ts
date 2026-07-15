/**
 * ═══════════════════════════════════════════════════════════
 * useCalculationMemory — Auto-fed calculation memory system
 * Stores, retrieves and learns from user calculations
 * ═══════════════════════════════════════════════════════════
 */
import { useState, useCallback, useEffect } from 'react';
import type { Barrier, RadiationSource } from '@/types/radshield';

const STORAGE_KEY = 'radshield_calc_memories';
const STORAGE_VERSION = 3;

export interface CalculationMemory {
  id: string;
  timestamp: string;
  projectName: string;
  // Input
  modality: string;
  energy_MeV: number;
  workload: number;
  workloadUnit: string;
  sources: Array<{ name: string; x: number; y: number; modality: string }>;
  barriers: Array<{ name: string; type: string; material: string }>;
  // Output
  results: Array<{
    barrierName: string;
    requiredThickness_mm: number | null;
    material: string;
    maxKerma_mSv: number;
    designGoal_mSv: number;
    isPassing: boolean;
  }>;
  // Context
  standardUsed: string;       // NCRP-151, NCRP-147, etc.
  occupancyFactors: Record<string, number>;
  useFactors: Record<string, number>;
  // ML features
  roomType: string;
  sourceDistance_m: number;
  sourceAngle_deg: number;
  shieldingDesign: string;
  // Meta
  tags: string[];
  notes: string;
  isFavorite: boolean;
  // Derived metrics for similarity search
  featureVector: number[];    // normalized feature vector for similarity
}

export interface MemoryQuery {
  modality?: string;
  energy_MeV?: number;
  roomType?: string;
  material?: string;
  standard?: string;
  tags?: string[];
  isFavorite?: boolean;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}

function generateFeatureVector(m: CalculationMemory): number[] {
  // 8-dimensional feature vector for similarity search
  const energyNorm = Math.min(m.energy_MeV / 25, 1);           // 0-25 MeV
  const workloadNorm = Math.min(Math.log10(m.workload + 1) / 4, 1); // 1-10000
  const sourceCountNorm = Math.min(m.sources.length / 5, 1);
  const barrierCountNorm = Math.min(m.barriers.length / 10, 1);
  const avgThickness = m.results.reduce((s, r) => s + (r.requiredThickness_mm || 0), 0) / (m.results.length || 1);
  const thicknessNorm = Math.min(avgThickness / 2000, 1);       // 0-2000 mm
  const passRatio = m.results.filter(r => r.isPassing).length / (m.results.length || 1);
  const modalityCode = hashString(m.modality) % 1000 / 1000;
  return [energyNorm, workloadNorm, sourceCountNorm, barrierCountNorm, thicknessNorm, passRatio, modalityCode, 0];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

function loadMemories(): CalculationMemory[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (parsed.version !== STORAGE_VERSION) {
      // Migration could go here
      return parsed.memories || [];
    }
    return parsed.memories || [];
  } catch {
    return [];
  }
}

function saveMemories(memories: CalculationMemory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, memories, lastSaved: new Date().toISOString() }));
}

export function useCalculationMemory() {
  const [memories, setMemories] = useState<CalculationMemory[]>(loadMemories);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { saveMemories(memories); }, [memories]);

  // ─── Save a calculation run ───
  const saveMemory = useCallback((data: {
    projectName: string;
    modality: string;
    energy_MeV: number;
    workload: number;
    workloadUnit: string;
    sources: RadiationSource[];
    barriers: Barrier[];
    results: CalculationMemory['results'];
    standardUsed: string;
    occupancyFactors: Record<string, number>;
    useFactors: Record<string, number>;
    roomType: string;
    tags?: string[];
    notes?: string;
  }): string => {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const featureVector = generateFeatureVector({
      ...data,
      id, timestamp: '', sources: [], barriers: [], results: [],
      featureVector: [],
      isFavorite: false,
      sourceDistance_m: 0,
      sourceAngle_deg: 0,
      shieldingDesign: '',
    } as CalculationMemory);

    const memory: CalculationMemory = {
      id,
      timestamp: new Date().toISOString(),
      projectName: data.projectName,
      modality: data.modality,
      energy_MeV: data.energy_MeV,
      workload: data.workload,
      workloadUnit: data.workloadUnit,
      sources: data.sources.map(s => ({ name: s.name, x: s.x, y: s.y, modality: s.modality?.name || 'unknown' })),
      barriers: data.barriers.map(b => ({ name: b.name, type: b.barrierType || 'unknown', material: b.materialCode || 'unknown' })),
      results: data.results,
      standardUsed: data.standardUsed,
      occupancyFactors: data.occupancyFactors,
      useFactors: data.useFactors,
      roomType: data.roomType,
      sourceDistance_m: 0,
      sourceAngle_deg: 0,
      shieldingDesign: '',
      tags: data.tags || [],
      notes: data.notes || '',
      isFavorite: false,
      featureVector,
    };

    setMemories(prev => [memory, ...prev].slice(0, 500)); // keep last 500
    return id;
  }, []);

  // ─── Search by similarity ───
  const findSimilar = useCallback((target: Partial<CalculationMemory>, topK: number = 5): CalculationMemory[] => {
    setIsSearching(true);
    const queryVec = target.featureVector || generateFeatureVector({
      ...target,
      modality: target.modality || '', energy_MeV: target.energy_MeV || 0,
      workload: 0, workloadUnit: '', sources: [], barriers: [], results: [],
      standardUsed: '', occupancyFactors: {}, useFactors: {},
      roomType: '', id: '', timestamp: '', featureVector: [],
      isFavorite: false, sourceDistance_m: 0, sourceAngle_deg: 0,
      shieldingDesign: '', tags: [], notes: '',
    } as CalculationMemory);

    const scored = memories
      .filter(m => m.id !== target.id)
      .map(m => ({ memory: m, score: cosineSimilarity(queryVec, m.featureVector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => r.memory);

    setIsSearching(false);
    return scored;
  }, [memories]);

  // ─── Filter memories ───
  const filter = useCallback((query: MemoryQuery): CalculationMemory[] => {
    return memories.filter(m => {
      if (query.modality && !m.modality.toLowerCase().includes(query.modality.toLowerCase())) return false;
      if (query.energy_MeV && Math.abs(m.energy_MeV - query.energy_MeV) > 2) return false;
      if (query.roomType && !m.roomType.toLowerCase().includes(query.roomType.toLowerCase())) return false;
      if (query.material && !m.barriers.some(b => b.material.toLowerCase().includes(query.material!.toLowerCase()))) return false;
      if (query.standard && !m.standardUsed.toLowerCase().includes(query.standard!.toLowerCase())) return false;
      if (query.isFavorite !== undefined && m.isFavorite !== query.isFavorite) return false;
      if (query.dateFrom && m.timestamp < query.dateFrom) return false;
      if (query.dateTo && m.timestamp > query.dateTo) return false;
      if (query.searchText) {
        const q = query.searchText.toLowerCase();
        const inText = m.projectName.toLowerCase().includes(q) ||
          m.notes.toLowerCase().includes(q) ||
          m.tags.some(t => t.toLowerCase().includes(q)) ||
          m.results.some(r => r.barrierName.toLowerCase().includes(q));
        if (!inText) return false;
      }
      return true;
    });
  }, [memories]);

  // ─── Toggle favorite ───
  const toggleFavorite = useCallback((id: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  }, []);

  // ─── Delete memory ───
  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  // ─── Get stats ───
  const getStats = useCallback(() => {
    const total = memories.length;
    const byStandard = memories.reduce<Record<string, number>>((acc, m) => {
      acc[m.standardUsed] = (acc[m.standardUsed] || 0) + 1;
      return acc;
    }, {});
    const byModality = memories.reduce<Record<string, number>>((acc, m) => {
      acc[m.modality] = (acc[m.modality] || 0) + 1;
      return acc;
    }, {});
    const passRate = total > 0
      ? memories.reduce((s, m) => s + m.results.filter(r => r.isPassing).length / (m.results.length || 1), 0) / total
      : 0;
    return { total, byStandard, byModality, passRate: Math.round(passRate * 100) };
  }, [memories]);

  // ─── Export/Import ───
  const exportMemories = useCallback(() => {
    const blob = new Blob([JSON.stringify({ version: STORAGE_VERSION, memories })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radshield-memories-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [memories]);

  const importMemories = useCallback((file: File) => {
    file.text().then(text => {
      const parsed = JSON.parse(text);
      const imported = parsed.memories || [];
      setMemories(prev => [...imported, ...prev].slice(0, 500));
    });
  }, []);

  return {
    memories,
    isSearching,
    saveMemory,
    findSimilar,
    filter,
    toggleFavorite,
    deleteMemory,
    getStats,
    exportMemories,
    importMemories,
  };
}
