import type { FloorPlan, ModalityCategory } from '@/types/radshield';

export type F164ClinicalMapStatus = 'clinical-map-ready' | 'clinical-map-draft';
export type F164ClinicalDomain =
  | 'diagnostic'
  | 'therapy'
  | 'nuclear'
  | 'cyclotron'
  | 'radiopharmacy'
  | 'radiationProtection'
  | 'monitoring'
  | 'waste'
  | 'shieldingConstruction'
  | 'softwareEvidence';

export interface F164ClinicalMapNode {
  id: F164ClinicalDomain;
  label: string;
  count: number;
  ready: boolean;
  color: string;
  evidence: string;
}

export interface F164ClinicalMapLink {
  from: F164ClinicalDomain;
  to: F164ClinicalDomain;
  label: string;
  ready: boolean;
}

export interface F164ClinicalProjectMap {
  phase: 'F164';
  status: F164ClinicalMapStatus;
  score: number;
  sourceInspiration: {
    name: string;
    url: string;
    adoptedPattern: string;
  };
  counts: {
    sources: number;
    barriers: number;
    regions: number;
    criticalPoints: number;
    shieldedBarriers: number;
  };
  nodes: F164ClinicalMapNode[];
  links: F164ClinicalMapLink[];
  exportTargets: string[];
  warnings: string[];
  decision: string;
}

const nodeMeta: Record<F164ClinicalDomain, Omit<F164ClinicalMapNode, 'count' | 'ready' | 'evidence'>> = {
  diagnostic: { id: 'diagnostic', label: 'Radiodiagnostico', color: '#2563eb' },
  therapy: { id: 'therapy', label: 'Radioterapia', color: '#e11d48' },
  nuclear: { id: 'nuclear', label: 'Medicina nuclear', color: '#16a34a' },
  cyclotron: { id: 'cyclotron', label: 'Ciclotron', color: '#7c3aed' },
  radiopharmacy: { id: 'radiopharmacy', label: 'Radiofarmacia', color: '#0f766e' },
  radiationProtection: { id: 'radiationProtection', label: 'Proteccion radiologica', color: '#f97316' },
  monitoring: { id: 'monitoring', label: 'Monitoreo', color: '#0891b2' },
  waste: { id: 'waste', label: 'Residuos', color: '#64748b' },
  shieldingConstruction: { id: 'shieldingConstruction', label: 'Construccion blindada', color: '#92400e' },
  softwareEvidence: { id: 'softwareEvidence', label: 'Software/evidencia', color: '#4f46e5' },
};

function categoryOf(category?: ModalityCategory): F164ClinicalDomain | null {
  if (category === 'diagnostic') return 'diagnostic';
  if (category === 'therapy') return 'therapy';
  if (category === 'nuclear') return 'nuclear';
  if (category === 'cyclotron') return 'cyclotron';
  return null;
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function buildF164ClinicalProjectMap(floorPlan?: FloorPlan): F164ClinicalProjectMap {
  const sources = floorPlan?.sources ?? [];
  const barriers = floorPlan?.barriers ?? [];
  const regions = floorPlan?.occupiedRegions ?? floorPlan?.regions ?? [];
  const criticalPoints = floorPlan?.criticalPoints ?? [];
  const countsByDomain = new Map<F164ClinicalDomain, number>();

  for (const source of sources) {
    const domain = categoryOf(source.modality?.category);
    if (domain) countsByDomain.set(domain, (countsByDomain.get(domain) ?? 0) + 1);

    const descriptor = `${source.name} ${source.modality?.name ?? ''} ${source.manufacturerVariant ?? ''}`;
    if (includesAny(descriptor, ['pet', 'spect', 'fdg', 'tc-99', 'tc99', 'i-131', 'lu-177', 'ga-68'])) {
      countsByDomain.set('radiopharmacy', (countsByDomain.get('radiopharmacy') ?? 0) + 1);
    }
  }

  for (const region of regions) {
    const descriptor = region.name;
    if (includesAny(descriptor, ['hot lab', 'radiofarm', 'radiofarmacia', 'uptake', 'inyeccion'])) {
      countsByDomain.set('radiopharmacy', (countsByDomain.get('radiopharmacy') ?? 0) + 1);
    }
    if (includesAny(descriptor, ['residuo', 'waste', 'decaimiento', 'decay'])) {
      countsByDomain.set('waste', (countsByDomain.get('waste') ?? 0) + 1);
    }
    if (includesAny(descriptor, ['monitor', 'survey', 'alarma'])) {
      countsByDomain.set('monitoring', (countsByDomain.get('monitoring') ?? 0) + 1);
    }
  }

  const shieldedBarriers = barriers.filter((barrier) =>
    Boolean(barrier.materialCode || barrier.shieldingPresetId || barrier.shieldingLayers?.length || barrier.requiredThickness_mm),
  ).length;
  if (barriers.length > 0) countsByDomain.set('shieldingConstruction', barriers.length);
  if (barriers.length > 0 || criticalPoints.length > 0 || regions.length > 0) {
    countsByDomain.set('radiationProtection', barriers.length + criticalPoints.length + regions.length);
  }
  if (criticalPoints.length > 0) countsByDomain.set('monitoring', (countsByDomain.get('monitoring') ?? 0) + criticalPoints.length);
  if (floorPlan || sources.length + barriers.length + regions.length > 0) {
    countsByDomain.set('softwareEvidence', 1);
  }

  const nodes = (Object.keys(nodeMeta) as F164ClinicalDomain[]).map((domain) => {
    const count = countsByDomain.get(domain) ?? 0;
    const meta = nodeMeta[domain];
    return {
      ...meta,
      count,
      ready: count > 0,
      evidence: count > 0 ? `${count} elemento(s) detectado(s) en el plano.` : 'Sin evidencia aun en el floorplan.',
    };
  });

  const linkSpecs: Array<[F164ClinicalDomain, F164ClinicalDomain, string]> = [
    ['diagnostic', 'radiationProtection', 'scatter/leakage'],
    ['therapy', 'shieldingConstruction', 'primary/secondary barriers'],
    ['nuclear', 'radiopharmacy', 'activity workflow'],
    ['radiopharmacy', 'waste', 'decay/storage'],
    ['cyclotron', 'monitoring', 'neutron/gamma survey'],
    ['radiationProtection', 'softwareEvidence', 'calculation evidence'],
    ['shieldingConstruction', 'softwareEvidence', 'material appendix'],
    ['monitoring', 'softwareEvidence', 'survey plan'],
  ];

  const nodeReady = (domain: F164ClinicalDomain) => nodes.find((node) => node.id === domain)?.ready ?? false;
  const links = linkSpecs.map(([from, to, label]) => ({
    from,
    to,
    label,
    ready: nodeReady(from) && nodeReady(to),
  }));

  const readyNodes = nodes.filter((node) => node.ready).length;
  const readyLinks = links.filter((link) => link.ready).length;
  const score = Math.round(((readyNodes / nodes.length) * 0.65 + (readyLinks / links.length) * 0.35) * 100);
  const warnings = [];
  if (!floorPlan?.imageUrl && barriers.length === 0) warnings.push('Importar o trazar plano para activar mapa clinico real.');
  if (sources.length === 0) warnings.push('Agregar equipos/fuentes para clasificar modalidad clinica.');
  if (barriers.length === 0) warnings.push('Trazar barreras para conectar proteccion radiologica y construccion blindada.');
  if (criticalPoints.length === 0) warnings.push('Agregar puntos criticos para monitoreo y evidencia de inspeccion.');

  return {
    phase: 'F164',
    status: score >= 45 ? 'clinical-map-ready' : 'clinical-map-draft',
    score,
    sourceInspiration: {
      name: 'NuviaTech Healthcare nuclear healthcare map',
      url: 'https://www.nuviatech-healthcare.com/nuclear-healthcare/',
      adoptedPattern:
        'Department/product-family map adapted into a project-specific clinical map driven by floorplan objects.',
    },
    counts: {
      sources: sources.length,
      barriers: barriers.length,
      regions: regions.length,
      criticalPoints: criticalPoints.length,
      shieldedBarriers,
    },
    nodes,
    links,
    exportTargets: ['Canvas visual QA', 'Memoria IA', 'PDF report', 'Evidence Pack', 'Medical 3D inspection'],
    warnings,
    decision:
      'F164 adds an operational clinical-project visualization derived from the floorplan. It complements the CAD canvas without replacing technical editing.',
  };
}
