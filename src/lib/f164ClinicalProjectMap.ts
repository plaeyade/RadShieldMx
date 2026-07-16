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

export interface F164RoomClassification {
  id: string;
  name: string;
  inferredDomain: F164ClinicalDomain;
  confidence: number;
  evidence: string;
}

export interface F164ClinicalFlowRoute {
  id: string;
  label: string;
  from: F164ClinicalDomain;
  to: F164ClinicalDomain;
  routeType: 'patient' | 'staff' | 'radiopharmaceutical' | 'waste' | 'survey';
  ready: boolean;
  evidence: string;
}

export interface F164ClinicalSyncTarget {
  id: string;
  label: string;
  target: 'canvas-2d' | 'medical-3d' | 'memoria-ia' | 'pdf-report' | 'evidence-pack';
  ready: boolean;
  action: string;
}

export interface F164ClinicalVisualExport {
  id: 'svg' | 'png' | 'report-figure';
  label: string;
  ready: boolean;
  format: string;
  action: string;
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
  roomClassifications: F164RoomClassification[];
  flowRoutes: F164ClinicalFlowRoute[];
  syncTargets: F164ClinicalSyncTarget[];
  visualExports: F164ClinicalVisualExport[];
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

function inferRoomDomain(name: string): F164RoomClassification['inferredDomain'] {
  if (includesAny(name, ['linac', 'acelerador', 'radioterapia', 'bunker', 'gamma knife', 'hdr', 'braqui'])) return 'therapy';
  if (includesAny(name, ['pet', 'spect', 'medicina nuclear', 'uptake', 'gamma camara', 'inyeccion'])) return 'nuclear';
  if (includesAny(name, ['ciclotron', 'cyclotron', 'hot cell'])) return 'cyclotron';
  if (includesAny(name, ['radiofarm', 'radiofarmacia', 'hot lab', 'dispensacion', 'preparacion'])) return 'radiopharmacy';
  if (includesAny(name, ['residuo', 'waste', 'decaimiento', 'decay'])) return 'waste';
  if (includesAny(name, ['monitor', 'survey', 'alarma', 'control', 'dosimetria'])) return 'monitoring';
  if (includesAny(name, ['rx', 'rayos x', 'ct', 'tomografia', 'fluoro', 'mastografia', 'mamografia'])) return 'diagnostic';
  return 'radiationProtection';
}

function confidenceForRoom(name: string, domain: F164ClinicalDomain) {
  const normalized = name.toLowerCase();
  if (domain === 'radiationProtection') return 0.52;
  if (includesAny(normalized, [domain, 'pet', 'spect', 'linac', 'gamma knife', 'ciclotron', 'radiofarm', 'residuo'])) return 0.86;
  return 0.72;
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

  const roomClassifications = regions.map((region) => {
    const inferredDomain = inferRoomDomain(region.name);
    return {
      id: region.id,
      name: region.name,
      inferredDomain,
      confidence: confidenceForRoom(region.name, inferredDomain),
      evidence: `Clasificado por nombre de sala/region: "${region.name}". Listo para reemplazarse por OCR/OpenCV cuando exista texto extraido del plano.`,
    };
  });

  const flowRoutes: F164ClinicalFlowRoute[] = [
    {
      id: 'patient-diagnostic-therapy',
      label: 'Paciente: diagnostico/terapia a zona protegida',
      from: sources.some((source) => categoryOf(source.modality?.category) === 'diagnostic') ? 'diagnostic' : 'therapy',
      to: 'radiationProtection',
      routeType: 'patient',
      ready: nodeReady('diagnostic') || nodeReady('therapy'),
      evidence: 'Ruta operativa para revisar circulacion de pacientes y exposicion en barreras/zonas.',
    },
    {
      id: 'radiopharmaceutical-nuclear',
      label: 'Radiofarmaco: radiofarmacia a sala NM/PET',
      from: 'radiopharmacy',
      to: 'nuclear',
      routeType: 'radiopharmaceutical',
      ready: nodeReady('radiopharmacy') && nodeReady('nuclear'),
      evidence: 'Ruta para verificar transferencia, inyeccion, uptake y blindaje de areas de medicina nuclear.',
    },
    {
      id: 'decay-waste',
      label: 'Residuos: sala clinica a decaimiento',
      from: 'nuclear',
      to: 'waste',
      routeType: 'waste',
      ready: nodeReady('nuclear') && nodeReady('waste'),
      evidence: 'Ruta para justificar almacenamiento temporal, decaimiento y control de contaminacion.',
    },
    {
      id: 'survey-monitoring',
      label: 'Inspeccion: puntos criticos a evidencia',
      from: 'monitoring',
      to: 'softwareEvidence',
      routeType: 'survey',
      ready: nodeReady('monitoring') && nodeReady('softwareEvidence'),
      evidence: 'Ruta para sincronizar puntos de monitoreo con Evidence Pack, reporte PDF y recorrido 3D.',
    },
  ];

  const syncTargets: F164ClinicalSyncTarget[] = [
    {
      id: 'canvas-select',
      label: 'Seleccionar en canvas 2D',
      target: 'canvas-2d',
      ready: sources.length + barriers.length + regions.length > 0,
      action: 'Resaltar nodos relacionados con barreras, fuentes, regiones y puntos criticos.',
    },
    {
      id: 'medical-3d-focus',
      label: 'Abrir foco en inspeccion 3D',
      target: 'medical-3d',
      ready: barriers.length > 0 || sources.length > 0,
      action: 'Enviar dominio clinico al visor 3D para revisar equipos, espesores, zonas y acabados.',
    },
    {
      id: 'memoria-ia-evidence',
      label: 'Agregar a Memoria IA',
      target: 'memoria-ia',
      ready: nodeReady('softwareEvidence'),
      action: 'Insertar figura, ruta clinica y advertencias como evidencia contextual.',
    },
    {
      id: 'pdf-report-figure',
      label: 'Exportar figura a PDF',
      target: 'pdf-report',
      ready: true,
      action: 'Usar SVG/PNG como figura ejecutiva en reporte y anexos.',
    },
    {
      id: 'evidence-pack-json',
      label: 'Guardar JSON en Evidence Pack',
      target: 'evidence-pack',
      ready: true,
      action: 'Persistir dominios, rutas, clasificaciones y advertencias con hash del proyecto.',
    },
  ];

  const visualExports: F164ClinicalVisualExport[] = [
    {
      id: 'svg',
      label: 'SVG vectorial',
      ready: true,
      format: 'image/svg+xml',
      action: 'Exportar figura editable para PDF, manual tecnico o auditoria.',
    },
    {
      id: 'png',
      label: 'PNG raster',
      ready: true,
      format: 'image/png',
      action: 'Renderizar SVG en canvas local y descargar PNG para reportes.',
    },
    {
      id: 'report-figure',
      label: 'Figura de reporte',
      ready: true,
      format: 'json+svg',
      action: 'Guardar mapa clinico, rutas y advertencias como bloque de Evidence Pack.',
    },
  ];

  const readyNodes = nodes.filter((node) => node.ready).length;
  const readyLinks = links.filter((link) => link.ready).length;
  const readyFlows = flowRoutes.filter((route) => route.ready).length;
  const score = Math.round(
    ((readyNodes / nodes.length) * 0.55 + (readyLinks / links.length) * 0.25 + (readyFlows / flowRoutes.length) * 0.2) * 100,
  );
  const warnings = [];
  if (!floorPlan?.imageUrl && barriers.length === 0) warnings.push('Importar o trazar plano para activar mapa clinico real.');
  if (sources.length === 0) warnings.push('Agregar equipos/fuentes para clasificar modalidad clinica.');
  if (barriers.length === 0) warnings.push('Trazar barreras para conectar proteccion radiologica y construccion blindada.');
  if (criticalPoints.length === 0) warnings.push('Agregar puntos criticos para monitoreo y evidencia de inspeccion.');
  if (roomClassifications.length === 0) warnings.push('Agregar regiones o aplicar OCR de plano para clasificar salas.');

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
    roomClassifications,
    flowRoutes,
    syncTargets,
    visualExports,
    exportTargets: ['Canvas visual QA', 'SVG/PNG visual export', 'Memoria IA', 'PDF report', 'Evidence Pack', 'Medical 3D inspection'],
    warnings,
    decision:
      'F164 adds an operational clinical-project visualization derived from the floorplan. It complements the CAD canvas without replacing technical editing.',
  };
}

export function buildF164ClinicalMapSvg(map: F164ClinicalProjectMap) {
  const readyNodes = map.nodes.filter((node) => node.ready).length;
  const warnings = map.warnings.slice(0, 3).join(' | ') || 'Sin advertencias criticas';
  const rows = map.nodes
    .map((node, index) => {
      const y = 78 + index * 22;
      return `<g><circle cx="38" cy="${y - 4}" r="5" fill="${node.ready ? node.color : '#cbd5e1'}"/><text x="52" y="${y}" font-size="11" fill="#334155">${node.label}: ${node.count}</text></g>`;
    })
    .join('');
  const flows = map.flowRoutes
    .map((route, index) => `<text x="278" y="${82 + index * 24}" font-size="10" fill="${route.ready ? '#0f766e' : '#64748b'}">${route.label}</text>`)
    .join('');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="360" viewBox="0 0 760 360" role="img" aria-label="RadShield-MX clinical project map">',
    '<rect width="760" height="360" rx="18" fill="#f8fafc"/>',
    '<rect x="18" y="18" width="724" height="324" rx="14" fill="#ffffff" stroke="#99f6e4"/>',
    '<text x="34" y="46" font-size="20" font-weight="700" fill="#0f766e">RadShield-MX F164 Clinical Project Map</text>',
    `<text x="34" y="66" font-size="12" fill="#64748b">Score ${map.score}% / ${readyNodes} dominios activos / Export SVG-PNG-PDF-Evidence</text>`,
    rows,
    '<text x="278" y="56" font-size="14" font-weight="700" fill="#0f172a">Flujos operativos</text>',
    flows,
    '<text x="278" y="206" font-size="14" font-weight="700" fill="#0f172a">Sincronizacion</text>',
    ...map.syncTargets.map(
      (target, index) =>
        `<text x="278" y="${230 + index * 20}" font-size="10" fill="${target.ready ? '#1d4ed8' : '#64748b'}">${target.label}: ${target.target}</text>`,
    ),
    `<text x="34" y="326" font-size="10" fill="#92400e">${warnings}</text>`,
    '</svg>',
  ].join('');
}

export function buildF164ClinicalMapExportPlan(floorPlan?: FloorPlan) {
  const map = buildF164ClinicalProjectMap(floorPlan);
  return {
    phase: 'F164',
    schema: 'radshield-mx.clinical-project-map.exports.v1',
    map,
    svg: buildF164ClinicalMapSvg(map),
    pngHook:
      'Browser hook: create Image from SVG Blob, draw to HTMLCanvasElement, then canvas.toBlob("image/png") for report-ready export.',
    recommendedFileNames: {
      svg: 'radshield-f164-clinical-project-map.svg',
      png: 'radshield-f164-clinical-project-map.png',
      json: 'radshield-f164-clinical-project-map.json',
    },
  };
}
