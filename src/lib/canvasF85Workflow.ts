import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { Barrier, CriticalPoint, FloorPlan } from '@/types/radshield';

export interface ShieldingPreset {
  id: string;
  name: string;
  materialCodes: string[];
  thicknesses_mm: number[];
  color: string;
  lineWidth_pt: number;
  notes: string;
}

export interface CanvasReadinessItem {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
}

export interface CanvasHeatmapPoint {
  x: number;
  y: number;
  kerma: number;
}

export type CanvasRiskLevel = 'pass' | 'warn' | 'fail' | 'pending';

export const SHIELDING_PRESETS: ShieldingPreset[] = [
  {
    id: 'pb-1mm',
    name: 'Pb 1 mm',
    materialCodes: ['PB'],
    thicknesses_mm: [1],
    color: '#475569',
    lineWidth_pt: 3,
    notes: 'Referencia rapida para barreras diagnosticas de baja energia.',
  },
  {
    id: 'pb-2mm',
    name: 'Pb 2 mm',
    materialCodes: ['PB'],
    thicknesses_mm: [2],
    color: '#334155',
    lineWidth_pt: 3,
    notes: 'Preset diagnostico conservador previo a calculo final NCRP 147.',
  },
  {
    id: 'concrete-ordinary',
    name: 'Concreto normal',
    materialCodes: ['CONCRETE235'],
    thicknesses_mm: [150],
    color: '#94a3b8',
    lineWidth_pt: 4,
    notes: 'Muro base para terapia, diagnostico y medicina nuclear.',
  },
  {
    id: 'concrete-barite',
    name: 'Concreto baritado',
    materialCodes: ['CONCRETEBARITE'],
    thicknesses_mm: [120],
    color: '#64748b',
    lineWidth_pt: 4,
    notes: 'Muro pesado cuando hay restriccion de espacio.',
  },
  {
    id: 'steel-plate',
    name: 'Acero estructural',
    materialCodes: ['STEEL'],
    thicknesses_mm: [12],
    color: '#1f2937',
    lineWidth_pt: 3,
    notes: 'Placa complementaria para soluciones multicapa.',
  },
  {
    id: 'pb-gypsum',
    name: 'Pb + yeso',
    materialCodes: ['PB', 'GYPSUM'],
    thicknesses_mm: [1, 16],
    color: '#78350f',
    lineWidth_pt: 4,
    notes: 'Solucion laminada para diagnostico y areas de menor carga.',
  },
  {
    id: 'pb-concrete',
    name: 'Pb + concreto',
    materialCodes: ['PB', 'CONCRETE235'],
    thicknesses_mm: [2, 100],
    color: '#0f172a',
    lineWidth_pt: 5,
    notes: 'Solucion multicapa para refuerzo localizado.',
  },
];

export function buildCriticalPointDraft(floorPlan: FloorPlan): CriticalPoint {
  const sourceX =
    floorPlan.sources.length > 0
      ? floorPlan.sources.reduce((sum, source) => sum + source.x, 0) / floorPlan.sources.length
      : floorPlan.width_pixels / 2;
  const sourceY =
    floorPlan.sources.length > 0
      ? floorPlan.sources.reduce((sum, source) => sum + source.y, 0) / floorPlan.sources.length
      : floorPlan.height_pixels / 2;
  const existing = floorPlan.criticalPoints?.length ?? 0;

  return {
    id: `critical-${Date.now()}`,
    x: Math.max(20, sourceX + 80),
    y: Math.max(20, sourceY + 80),
    name: `Punto critico ${existing + 1}`,
    occupancyFactor: 1,
    designGoal_mSv_per_wk: 0.02,
    pointType: 'public',
    enabled: true,
    notes: 'F85 draft: revisar ubicacion, ocupacion y objetivo P antes de memoria analitica.',
  };
}

export function buildScaleCalibrationDraft(
  floorPlan: FloorPlan,
  pixelDistance = 100,
  realDistance_m = 1,
) {
  const nextScale = realDistance_m / pixelDistance;
  return {
    previousScale_m_per_pixel: floorPlan.scale_m_per_pixel,
    nextScale_m_per_pixel: nextScale,
    pixelsPerMeter: 1 / nextScale,
    pixelDistance,
    realDistance_m,
  };
}

export function findShieldingPreset(presetId: string): ShieldingPreset | undefined {
  return SHIELDING_PRESETS.find((preset) => preset.id === presetId);
}

export function applyShieldingPresetToBarrier(barrier: Barrier, preset: ShieldingPreset): Barrier {
  const primaryMaterial = preset.materialCodes[0] ?? barrier.materialCode;
  const primaryThickness = preset.thicknesses_mm[0] ?? barrier.thickness_mm ?? 0;
  return {
    ...barrier,
    materialCode: primaryMaterial,
    material: primaryMaterial,
    thickness_mm: primaryThickness,
    requiredThickness_mm:
      preset.materialCodes.length === 1
        ? primaryThickness
        : Object.fromEntries(preset.materialCodes.map((code, index) => [code, preset.thicknesses_mm[index] ?? primaryThickness])),
    shieldingPresetId: preset.id,
    shieldingPresetName: preset.name,
    shieldingLayers: preset.materialCodes.map((materialCode, index) => ({
      materialCode,
      thickness_mm: preset.thicknesses_mm[index] ?? primaryThickness,
    })),
    shieldingPresetNote: preset.notes,
    reportNote: `${barrier.reportNote ? `${barrier.reportNote} | ` : ''}F86 preset ${preset.name}: ${preset.notes}`,
  };
}

export function applyShieldingPresetToFloorPlan(
  floorPlan: FloorPlan,
  presetId: string,
  target: 'selected' | 'all',
  selectedBarrierId?: string | null,
): FloorPlan {
  const preset = findShieldingPreset(presetId);
  if (!preset) return floorPlan;
  return {
    ...floorPlan,
    barriers: floorPlan.barriers.map((barrier) => {
      if (target === 'selected' && barrier.id !== selectedBarrierId) return barrier;
      return applyShieldingPresetToBarrier(barrier, preset);
    }),
  };
}

export function buildAuditSnapshotMetadata(
  floorPlan: FloorPlan,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
) {
  return {
    projectName: floorPlan.name,
    generatedAt: new Date().toISOString(),
    scale_m_per_pixel: floorPlan.scale_m_per_pixel,
    counts: {
      barriers: floorPlan.barriers.length,
      sources: floorPlan.sources.length,
      regions: floorPlan.occupiedRegions.length + (floorPlan.regions?.length ?? 0),
      criticalPoints: floorPlan.criticalPoints?.length ?? 0,
      barrierResults: barrierResults.length,
      sampleLines: sampleLines.length,
    },
    hasFloorPlanImage: Boolean(floorPlan.imageUrl),
    standards: ['NCRP 147', 'NCRP 151', 'AAPM TG-108', 'IAEA SRS-47', 'UAQ/CNSNS workflow'],
    recommendation:
      barrierResults.length > 0
        ? 'Snapshot listo para evidencia grafica y memoria analitica.'
        : 'Ejecutar calculos antes de usar el snapshot como cierre de memoria.',
  };
}

export function buildF86EvidenceSummary(floorPlan: FloorPlan | undefined) {
  const barriers = floorPlan?.barriers ?? [];
  const criticalPoints = floorPlan?.criticalPoints ?? [];
  const presetBarriers = barriers.filter((barrier) => Boolean(barrier.shieldingPresetId));
  return {
    criticalPoints: criticalPoints.length,
    presetBarriers: presetBarriers.length,
    presetCoveragePct: barriers.length > 0 ? Math.round((presetBarriers.length / barriers.length) * 100) : 0,
    presetNames: Array.from(new Set(presetBarriers.map((barrier) => barrier.shieldingPresetName).filter(Boolean))),
    readyForEvidence: criticalPoints.length > 0 && presetBarriers.length > 0,
  };
}

export function getBarrierLayerDisplay(barrier: Barrier) {
  const layers = barrier.shieldingLayers ?? [];
  const totalThickness_mm = layers.reduce((sum, layer) => sum + layer.thickness_mm, 0);
  const label =
    layers.length > 0
      ? layers.map((layer) => `${layer.materialCode} ${layer.thickness_mm} mm`).join(' + ')
      : barrier.thickness_mm
        ? `${barrier.materialCode} ${barrier.thickness_mm} mm`
        : barrier.materialCode;
  return {
    hasPreset: Boolean(barrier.shieldingPresetId),
    presetName: barrier.shieldingPresetName ?? 'Sin preset',
    layers,
    totalThickness_mm,
    label,
    coverageStatus: barrier.shieldingPresetId ? 'preset-covered' : 'manual-or-pending',
  };
}

export function buildF88LayerCoverageSummary(floorPlan: FloorPlan | undefined) {
  const barriers = floorPlan?.barriers ?? [];
  const covered = barriers.filter((barrier) => Boolean(barrier.shieldingPresetId));
  const layerCount = covered.reduce((sum, barrier) => sum + (barrier.shieldingLayers?.length ?? 0), 0);
  return {
    barriers: barriers.length,
    covered: covered.length,
    pending: Math.max(0, barriers.length - covered.length),
    layerCount,
    coveragePct: barriers.length > 0 ? Math.round((covered.length / barriers.length) * 100) : 0,
    readyForVisualQA: barriers.length > 0 && covered.length === barriers.length,
  };
}

export function getBarrierRiskLevel(barrier: Barrier): CanvasRiskLevel {
  const maxKerma = Number(barrier.maxKerma);
  const designGoal = Number(barrier.designGoal_mSv_per_wk);
  if (!Number.isFinite(maxKerma) || maxKerma <= 0 || !Number.isFinite(designGoal) || designGoal <= 0) {
    return 'pending';
  }
  if (maxKerma <= designGoal) return 'pass';
  if (maxKerma <= designGoal * 1.5) return 'warn';
  return 'fail';
}

export function getBarrierRiskColor(level: CanvasRiskLevel): string {
  return {
    pass: '#16a34a',
    warn: '#f59e0b',
    fail: '#dc2626',
    pending: '#64748b',
  }[level];
}

export function buildF89RiskHeatmapSummary(
  floorPlan: FloorPlan | undefined,
  heatmapData: CanvasHeatmapPoint[] = [],
) {
  const barriers = floorPlan?.barriers ?? [];
  const risk = barriers.reduce(
    (acc, barrier) => {
      acc[getBarrierRiskLevel(barrier)] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, pending: 0 } as Record<CanvasRiskLevel, number>,
  );
  const kermaValues = heatmapData.map((point) => point.kerma).filter(Number.isFinite);
  const maxHeatmapKerma = kermaValues.length > 0 ? Math.max(...kermaValues) : null;
  return {
    risk,
    heatmapPoints: heatmapData.length,
    maxHeatmapKerma,
    heatmapReady: heatmapData.length > 0,
    readyForVisualQA: heatmapData.length > 0 && risk.pending === 0,
  };
}

export function buildCanvasQAExport(
  floorPlan: FloorPlan,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
  heatmapData: CanvasHeatmapPoint[] = [],
) {
  const f86 = buildF86EvidenceSummary(floorPlan);
  const f88 = buildF88LayerCoverageSummary(floorPlan);
  const f89 = buildF89RiskHeatmapSummary(floorPlan, heatmapData);
  return {
    schema: 'radshield-mx.canvas-qa.f87',
    generatedAt: new Date().toISOString(),
    project: {
      id: floorPlan.id,
      name: floorPlan.name,
      scale_m_per_pixel: floorPlan.scale_m_per_pixel,
      hasFloorPlanImage: Boolean(floorPlan.imageUrl),
    },
    summary: {
      barriers: floorPlan.barriers.length,
      sources: floorPlan.sources.length,
      regions: floorPlan.occupiedRegions.length + (floorPlan.regions?.length ?? 0),
      criticalPoints: f86.criticalPoints,
      presetBarriers: f86.presetBarriers,
      presetCoveragePct: f86.presetCoveragePct,
      f88LayerCount: f88.layerCount,
      f88PendingBarriers: f88.pending,
      f89Risk: f89.risk,
      f89HeatmapPoints: f89.heatmapPoints,
      f89MaxHeatmapKerma: f89.maxHeatmapKerma,
      calculationResults: barrierResults.length,
      sampleLines: sampleLines.length,
    },
    barriers: floorPlan.barriers.map((barrier) => ({
      id: barrier.id,
      name: barrier.name,
      type: barrier.barrierType,
      materialCode: barrier.materialCode,
      thickness_mm: barrier.thickness_mm ?? null,
      designGoal_mSv_per_wk: barrier.designGoal_mSv_per_wk,
      occupancyFactor: barrier.occupancyFactor,
      useFactor: barrier.useFactor,
      shieldingPresetId: barrier.shieldingPresetId ?? null,
      shieldingPresetName: barrier.shieldingPresetName ?? null,
      shieldingLayers: barrier.shieldingLayers ?? [],
      riskLevel: getBarrierRiskLevel(barrier),
      reportNote: barrier.reportNote ?? '',
    })),
    criticalPoints: (floorPlan.criticalPoints ?? []).map((point) => ({
      id: point.id,
      name: point.name,
      x: point.x,
      y: point.y,
      pointType: point.pointType,
      occupancyFactor: point.occupancyFactor,
      designGoal_mSv_per_wk: point.designGoal_mSv_per_wk,
      enabled: point.enabled !== false,
      notes: point.notes ?? '',
    })),
    sources: floorPlan.sources.map((source) => ({
      id: source.id,
      name: source.name,
      modality: source.modality?.name,
      standard: source.modality?.standard,
      workloadValue: source.workloadValue,
      workloadUnit: source.workloadUnit,
      x: source.x,
      y: source.y,
    })),
  };
}

export function canvasQAExportToCsv(exportData: ReturnType<typeof buildCanvasQAExport>): string {
  const header = [
    'kind',
    'id',
    'name',
    'type',
    'material_or_standard',
    'thickness_mm',
    'occupancyFactor',
    'designGoal_mSv_per_wk',
    'preset',
    'risk',
    'notes',
  ];
  const rows = [
    ...exportData.barriers.map((barrier) => [
      'barrier',
      barrier.id,
      barrier.name,
      barrier.type,
      barrier.materialCode,
      barrier.thickness_mm ?? '',
      barrier.occupancyFactor,
      barrier.designGoal_mSv_per_wk,
      barrier.shieldingPresetName ?? '',
      barrier.riskLevel,
      barrier.reportNote,
    ]),
    ...exportData.criticalPoints.map((point) => [
      'criticalPoint',
      point.id,
      point.name,
      point.pointType,
      '',
      '',
      point.occupancyFactor,
      point.designGoal_mSv_per_wk,
      '',
      '',
      point.notes,
    ]),
    ...exportData.sources.map((source) => [
      'source',
      source.id,
      source.name,
      source.modality ?? '',
      source.standard ?? '',
      '',
      '',
      '',
      '',
      `${source.workloadValue} ${source.workloadUnit}`,
      '',
    ]),
  ];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function getF85CanvasReadiness(
  floorPlan: FloorPlan | undefined,
  hasResults: boolean,
): CanvasReadinessItem[] {
  const scaleReady = Boolean(floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0);
  const criticalReady = Boolean(floorPlan?.criticalPoints?.length);
  const presetReady = Boolean(floorPlan?.barriers?.some((barrier) => barrier.shieldingPresetId || barrier.materialCode || barrier.material));
  return [
    {
      id: 'scale',
      label: 'Escala',
      ready: scaleReady,
      detail: scaleReady ? `${(1 / floorPlan!.scale_m_per_pixel).toFixed(0)} px/m` : 'Calibrar',
    },
    {
      id: 'critical',
      label: 'Criticos',
      ready: criticalReady,
      detail: criticalReady ? `${floorPlan!.criticalPoints!.length} punto(s)` : 'Agregar',
    },
    {
      id: 'presets',
      label: 'Presets',
      ready: presetReady,
      detail: `${SHIELDING_PRESETS.length} disponibles`,
    },
    {
      id: 'snapshot',
      label: 'Snapshot',
      ready: hasResults,
      detail: hasResults ? 'Con calculo' : 'PNG preliminar',
    },
  ];
}
