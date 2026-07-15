import type { ComponentType, CSSProperties } from 'react';
import {
  Atom,
  Box,
  Crosshair,
  Eraser,
  Grid3X3,
  Minus,
  MousePointer,
  Move,
  Radio,
  RotateCcw,
  Ruler,
  ScanLine,
  Stethoscope,
  Zap,
} from 'lucide-react';
import type { EquipmentIconKind } from '@/lib/equipmentVisuals';
import { getEquipmentVisualProfileByKind, listEquipmentVisualProfiles } from '@/lib/equipmentVisuals';

export type UnifiedIconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}>;

export interface F98IconProfile {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: UnifiedIconComponent;
  color: string;
  bg: string;
}

export const CANVAS_TOOL_ICON_PROFILES: Record<string, F98IconProfile> = {
  select: {
    id: 'select',
    label: 'Seleccionar',
    shortLabel: 'Sel',
    description: 'Seleccionar objeto (V)',
    icon: MousePointer,
    color: '#475569',
    bg: '#f1f5f9',
  },
  barrier: {
    id: 'barrier',
    label: 'Dibujar barrera',
    shortLabel: 'Barr',
    description: 'Dibujar barrera (B)',
    icon: Minus,
    color: '#f97316',
    bg: '#fff7ed',
  },
  source: {
    id: 'source',
    label: 'Colocar fuente',
    shortLabel: 'Fte',
    description: 'Colocar fuente/equipo (S)',
    icon: Radio,
    color: '#ef4444',
    bg: '#fef2f2',
  },
  region: {
    id: 'region',
    label: 'Zona controlada',
    shortLabel: 'Zona',
    description: 'Definir region ocupada o controlada',
    icon: Grid3X3,
    color: '#0f766e',
    bg: '#f0fdfa',
  },
  measure: {
    id: 'measure',
    label: 'Medir',
    shortLabel: 'Med',
    description: 'Medir distancia (M)',
    icon: Ruler,
    color: '#10b981',
    bg: '#ecfdf5',
  },
  pan: {
    id: 'pan',
    label: 'Mover vista',
    shortLabel: 'Pan',
    description: 'Mover vista (H)',
    icon: Move,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  eraser: {
    id: 'eraser',
    label: 'Borrar',
    shortLabel: 'Del',
    description: 'Borrar seleccion (Del)',
    icon: Eraser,
    color: '#dc2626',
    bg: '#fee2e2',
  },
  reset: {
    id: 'reset',
    label: 'Resetear vista',
    shortLabel: 'Rst',
    description: 'Resetear vista (0)',
    icon: RotateCcw,
    color: '#6b7280',
    bg: '#f3f4f6',
  },
};

const equipmentIcons: Record<EquipmentIconKind, UnifiedIconComponent> = {
  linac: Zap,
  gammaKnife: Crosshair,
  ct: ScanLine,
  petct: Stethoscope,
  hdr: Radio,
  cyclotron: Atom,
  spect: Radio,
  mammography: Stethoscope,
  generic: Box,
};

export const EQUIPMENT_ICON_PROFILES: Record<EquipmentIconKind, F98IconProfile> =
  listEquipmentVisualProfiles().reduce((acc, profile) => {
    acc[profile.iconKind] = {
      id: profile.iconKind,
      label: profile.label,
      shortLabel: profile.shortLabel,
      description: profile.ragTags.join(' | '),
      icon: equipmentIcons[profile.iconKind],
      color: profile.color,
      bg: `${profile.accentColor}33`,
    };
    return acc;
  }, {} as Record<EquipmentIconKind, F98IconProfile>);

export type F98GapStatus = 'done' | 'in_progress' | 'blocked';

export interface F98ReleaseGap {
  id: string;
  area: string;
  status: F98GapStatus;
  currentBase: string;
  remaining: string;
}

export const F98_RELEASE_GAP_CHECKLIST: F98ReleaseGap[] = [
  {
    id: 'canvas_floorplan',
    area: 'Canvas/floorplan',
    status: 'in_progress',
    currentBase: 'Scale, layers, presets, heatmap badges, snapshots and unified canvas icons exist.',
    remaining: 'Finish CAD-like grips, direct edit, snapping polish, cotas, isocontours and richer selection states.',
  },
  {
    id: 'heat_maps',
    area: 'Heat maps',
    status: 'in_progress',
    currentBase: 'F89 risk heatmap and QA export are wired.',
    remaining: 'Add configurable isodosis, regulatory thresholds, legends and report-grade visual export.',
  },
  {
    id: 'medical_3d',
    area: '3D medico',
    status: 'in_progress',
    currentBase: 'Medical 3D receives floorplan/equipment footprint metadata.',
    remaining: 'Turn it into real inspection walkthrough with thicknesses, equipment, controlled zones and finishes.',
  },
  {
    id: 'rag_documents',
    area: 'RAG/documentos',
    status: 'in_progress',
    currentBase: 'Citation ledger, OCR preparation and document manifests exist.',
    remaining: 'Confirm version hashes, deduplicate documents and reingest prior analytic memories in PDF/text.',
  },
  {
    id: 'database',
    area: 'DB',
    status: 'blocked',
    currentBase: 'DATABASE_URL/scripts are ready; UI can continue offline-safe.',
    remaining: 'Recover MySQL pull/server, run migrate/seed/live validation before serious multiuser release.',
  },
  {
    id: 'menus',
    area: 'Menus',
    status: 'in_progress',
    currentBase: 'F92 flow exists; Design and Equipment dropdowns migrated with fallback.',
    remaining: 'Migrate Shielding, Verification, Reports, Evidence and Integrations, then remove duplicates.',
  },
  {
    id: 'analytic_reports',
    area: 'Reportes/memoria analitica',
    status: 'in_progress',
    currentBase: 'Evidence Pack has claim-level citation ledger.',
    remaining: 'Ensure every result carries formula, standard, input, output, justification and citation.',
  },
  {
    id: 'calculation_engine',
    area: 'Motor de calculo',
    status: 'in_progress',
    currentBase: 'Existing unit and validation suites cover core shielding flows.',
    remaining: 'Add more numeric cases against known NCRP, IAEA and UAQ examples before stable release.',
  },
];

export function getCanvasToolIconProfile(toolId: string): F98IconProfile {
  return CANVAS_TOOL_ICON_PROFILES[toolId] ?? CANVAS_TOOL_ICON_PROFILES.select;
}

export function getEquipmentIconProfile(kind: EquipmentIconKind): F98IconProfile {
  const profile = getEquipmentVisualProfileByKind(kind);
  return EQUIPMENT_ICON_PROFILES[profile.iconKind] ?? EQUIPMENT_ICON_PROFILES.generic;
}

export function summarizeF98ReleaseGaps() {
  const total = F98_RELEASE_GAP_CHECKLIST.length;
  const done = F98_RELEASE_GAP_CHECKLIST.filter((item) => item.status === 'done').length;
  const inProgress = F98_RELEASE_GAP_CHECKLIST.filter((item) => item.status === 'in_progress').length;
  const blocked = F98_RELEASE_GAP_CHECKLIST.filter((item) => item.status === 'blocked').length;
  return {
    total,
    done,
    inProgress,
    blocked,
    remainingForFinalRelease: total - done,
    offlineReleaseCanContinue: blocked === 1,
    nextPriority: ['migrate remaining dropdowns', 'expand canvas CAD-like editing', 'resume MySQL live validation'],
  };
}
