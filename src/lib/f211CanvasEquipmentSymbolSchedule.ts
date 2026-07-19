import type { FloorPlan, RadiationSource } from '@/types/radshield';

export interface F211EquipmentSymbolRow {
  id: string;
  label: string;
  modality: string;
  category: string;
  standard: string;
  manufacturerVariant: string;
  rotationDeg: number;
  footprint: string;
  workload: string;
  status: 'ready' | 'partial' | 'missing';
  warnings: string[];
}

export interface F211CanvasEquipmentSymbolSchedule {
  schema: 'radshield-mx.canvas-equipment-symbol-schedule.f211.v1';
  phase: 'F211';
  status: 'canvas-equipment-symbols-ready' | 'canvas-equipment-symbols-review';
  sourceCount: number;
  withFootprintCount: number;
  withManufacturerCount: number;
  withRotationCount: number;
  rows: F211EquipmentSymbolRow[];
  warnings: string[];
  decision: string;
}

function formatNumber(value: unknown, digits = 1): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'N/D';
}

function buildFootprint(source: RadiationSource): string {
  const width = source.footprint_m?.width;
  const depth = source.footprint_m?.depth;
  if (typeof width === 'number' && Number.isFinite(width) && typeof depth === 'number' && Number.isFinite(depth)) {
    return `${width.toFixed(2)} x ${depth.toFixed(2)} m`;
  }
  return 'sin footprint';
}

function buildRow(source: RadiationSource): F211EquipmentSymbolRow {
  const warnings: string[] = [];
  const hasFootprint = source.footprint_m?.width && source.footprint_m?.depth;
  const hasManufacturer = Boolean(source.manufacturerVariant);
  const hasRotation = typeof source.rotationDeg === 'number' && Number.isFinite(source.rotationDeg);

  if (!hasFootprint) warnings.push('Falta footprint real del equipo.');
  if (!hasManufacturer) warnings.push('Falta variante/fabricante.');
  if (!hasRotation) warnings.push('Falta rotacion CAD definida.');
  if (!source.modality?.standard) warnings.push('Falta norma/metodologia asociada.');

  return {
    id: source.id,
    label: source.name || source.modality?.name || source.id,
    modality: source.modality?.name || 'N/D',
    category: source.modality?.category || 'other',
    standard: source.modality?.standard || 'N/D',
    manufacturerVariant: source.manufacturerVariant || 'N/D',
    rotationDeg: hasRotation ? Number(source.rotationDeg) : 0,
    footprint: buildFootprint(source),
    workload: `${formatNumber(source.workloadValue)} ${source.workloadUnit || ''}`.trim(),
    status: warnings.length === 0 ? 'ready' : warnings.length <= 2 ? 'partial' : 'missing',
    warnings,
  };
}

export function buildF211CanvasEquipmentSymbolSchedule(floorPlan?: FloorPlan): F211CanvasEquipmentSymbolSchedule {
  const sources = floorPlan?.sources ?? [];
  const rows = sources.map(buildRow);
  const warnings: string[] = [];
  const withFootprintCount = rows.filter((row) => !row.warnings.includes('Falta footprint real del equipo.')).length;
  const withManufacturerCount = rows.filter((row) => row.manufacturerVariant !== 'N/D').length;
  const withRotationCount = sources.filter((source) => typeof source.rotationDeg === 'number' && Number.isFinite(source.rotationDeg)).length;

  if (sources.length === 0) warnings.push('No hay fuentes/equipos colocados en el floorplan.');
  if (withFootprintCount < sources.length) warnings.push('Hay equipos sin footprint real.');
  if (withManufacturerCount < sources.length) warnings.push('Hay equipos sin variante/fabricante.');
  if (withRotationCount < sources.length) warnings.push('Hay equipos sin rotacion CAD.');

  return {
    schema: 'radshield-mx.canvas-equipment-symbol-schedule.f211.v1',
    phase: 'F211',
    status: warnings.length === 0 ? 'canvas-equipment-symbols-ready' : 'canvas-equipment-symbols-review',
    sourceCount: sources.length,
    withFootprintCount,
    withManufacturerCount,
    withRotationCount,
    rows,
    warnings,
    decision:
      warnings.length === 0
        ? 'Simbolos de equipo listos para inspeccion CAD/3D y memoria analitica.'
        : 'Completar footprint, fabricante o rotacion antes de usar inspeccion 3D o anexos firmables.',
  };
}

export function formatF211EquipmentSymbolScheduleText(schedule: F211CanvasEquipmentSymbolSchedule): string {
  return [
    `${schedule.phase} ${schedule.status}`,
    `Equipos: ${schedule.sourceCount}`,
    `Footprint: ${schedule.withFootprintCount}/${schedule.sourceCount}`,
    `Fabricante: ${schedule.withManufacturerCount}/${schedule.sourceCount}`,
    `Rotacion: ${schedule.withRotationCount}/${schedule.sourceCount}`,
    `Advertencias: ${schedule.warnings.join(' | ') || 'ninguna'}`,
  ].join('\n');
}
