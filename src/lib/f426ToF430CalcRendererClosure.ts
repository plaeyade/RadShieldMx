import type { Barrier, FloorPlan } from '@/types/radshield';
import type { F416ToF420BimCanvasSequence } from '@/lib/f416ToF420BimCanvasSequence';
import type { F421ToF425BimHandoffPlan } from '@/lib/f421ToF425BimHandoff';

export type F426SurfaceRole = 'primary' | 'secondary' | 'maze' | 'door' | 'penetration';

export interface F426SurfaceRoleCalculation {
  id: string;
  label: string;
  role: F426SurfaceRole;
  barrierCount: number;
  formulaFamily: string;
  standard: string;
  requiredInputs: string[];
  outputs: string[];
  warnings: string[];
  rendererOverlay: string;
  status: 'ready' | 'needs-geometry' | 'needs-calculation';
}

export interface F427PenetrationPenalty {
  id: string;
  label: string;
  appliesTo: F426SurfaceRole[];
  trigger: string;
  penaltyModel: string;
  defaultPenaltyFactor: number;
  evidenceRequired: string[];
  blocking: boolean;
}

export interface F428StructuralLoadItem {
  id: string;
  label: string;
  category: 'material' | 'equipment' | 'wall' | 'slab' | 'door';
  massKgPerM2: number;
  structuralLoadKPa: number;
  source: string;
  status: 'ready' | 'estimate' | 'blocked';
  rendererUse: string;
}

export interface F429NormativeQaCase {
  id: string;
  modality: 'DX' | 'TX' | 'NM' | 'CY';
  label: string;
  standard: string;
  expectedChecks: string[];
  tolerancePercent: number;
  evidenceRule: string;
  status: 'ready' | 'fixture-needed';
}

export interface F430AutoMemoryStep {
  id: string;
  label: string;
  fromCanvas: string;
  output: string;
  requiredEvidence: string[];
  status: 'ready' | 'blocked';
}

export interface F426ToF430RendererDeepStep {
  id: string;
  phase: 'F426' | 'F427' | 'F428' | 'F429' | 'F430';
  label: string;
  implementation: string;
  connectedEvidence: string[];
  status: 'ready' | 'draft' | 'blocked';
}

export interface F426ToF430CalcRendererClosure {
  schema: 'radshield-mx.f426-f430.calc-renderer-closure.v1';
  phaseRange: 'F426-F430';
  status: 'closure-ready';
  surfaceRoleCalculations: F426SurfaceRoleCalculation[];
  penetrationPenalties: F427PenetrationPenalty[];
  structuralLoads: F428StructuralLoadItem[];
  totalStructuralLoadKgPerM2: number;
  normativeQaCases: F429NormativeQaCase[];
  autoMemorySteps: F430AutoMemoryStep[];
  rendererDeepPlan: F426ToF430RendererDeepStep[];
  releaseBlocks: string[];
}

const STANDARD_GRAVITY_M_PER_S2 = 9.80665;
const F428_STRUCTURAL_LOAD_LABEL = 'Carga estructural integrada';
const F430_AUTO_MEMORY_FLOW_LABEL = 'plano -> equipo -> barreras -> calculo -> evidencia -> PDF';

const MATERIAL_DENSITY_KG_M3: Record<string, { density: number; source: string; status: F428StructuralLoadItem['status'] }> = {
  concrete: { density: 2350, source: 'generic-concrete-density', status: 'estimate' },
  ordinary_concrete: { density: 2350, source: 'generic-concrete-density', status: 'estimate' },
  high_density_concrete: { density: 3500, source: 'radshield-material-ledger-hd-concrete', status: 'estimate' },
  hd_concrete: { density: 3500, source: 'radshield-material-ledger-hd-concrete', status: 'estimate' },
  lead: { density: 11340, source: 'radshield-material-ledger-lead', status: 'ready' },
  pb: { density: 11340, source: 'radshield-material-ledger-lead', status: 'ready' },
  steel: { density: 7850, source: 'radshield-material-ledger-steel', status: 'ready' },
  gypsum: { density: 800, source: 'generic-gypsum-density', status: 'estimate' },
  tm_nipoll: { density: 3300, source: 'tm-nipoll-tvl-density-pending-hash', status: 'estimate' },
  contuplex_td: { density: 3000, source: 'contuplex-td-material-pending-hash', status: 'estimate' },
};

function roleForBarrier(barrier: Barrier): F426SurfaceRole {
  const name = barrier.name.toLowerCase();
  if (/door|puerta/i.test(name)) return 'door';
  if (/maze|laberinto/i.test(name)) return 'maze';
  if (/penetration|penetracion|duct|sleeve|hueco|opening/i.test(name)) return 'penetration';
  if (barrier.barrierType === 'primary') return 'primary';
  return 'secondary';
}

function barrierThicknessMm(barrier: Barrier): number {
  if (Number.isFinite(barrier.thickness_mm)) return Math.max(0, barrier.thickness_mm ?? 0);
  if (typeof barrier.requiredThickness_mm === 'number' && Number.isFinite(barrier.requiredThickness_mm)) {
    return Math.max(0, barrier.requiredThickness_mm);
  }
  if (barrier.requiredThickness_mm && typeof barrier.requiredThickness_mm === 'object') {
    const values = Object.values(barrier.requiredThickness_mm).filter((value): value is number => Number.isFinite(value));
    return Math.max(0, ...values, 0);
  }
  if (Number.isFinite(barrier.concreteEquivalent_mm)) return Math.max(0, barrier.concreteEquivalent_mm ?? 0);
  if (Number.isFinite(barrier.leadEquivalent_mm)) return Math.max(0, barrier.leadEquivalent_mm ?? 0);
  return 0;
}

function normalizeMaterialCode(code?: string): string {
  return (code || 'concrete').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function materialDensity(code?: string) {
  const normalized = normalizeMaterialCode(code);
  return MATERIAL_DENSITY_KG_M3[normalized] ?? MATERIAL_DENSITY_KG_M3.concrete;
}

function countByRole(floorPlan: FloorPlan, role: F426SurfaceRole): number {
  return floorPlan.barriers.filter((barrier) => roleForBarrier(barrier) === role).length;
}

function calculationStatus(floorPlan: FloorPlan, role: F426SurfaceRole): F426SurfaceRoleCalculation['status'] {
  const barriers = floorPlan.barriers.filter((barrier) => roleForBarrier(barrier) === role);
  if (!barriers.length) return 'needs-geometry';
  return barriers.some((barrier) => barrierThicknessMm(barrier) > 0) ? 'ready' : 'needs-calculation';
}

function buildStructuralLoads(floorPlan: FloorPlan): F428StructuralLoadItem[] {
  const barrierLoads = floorPlan.barriers.slice(0, 12).map((barrier) => {
    const material = materialDensity(barrier.materialCode || barrier.material);
    const thicknessM = barrierThicknessMm(barrier) / 1000;
    const massKgPerM2 = material.density * thicknessM;
    return {
      id: `barrier-${barrier.id}`,
      label: barrier.name,
      category: roleForBarrier(barrier) === 'door' ? 'door' : 'wall',
      massKgPerM2: Math.round(massKgPerM2),
      structuralLoadKPa: Number(((massKgPerM2 * STANDARD_GRAVITY_M_PER_S2) / 1000).toFixed(2)),
      source: material.source,
      status: thicknessM > 0 ? material.status : 'blocked',
      rendererUse: `${F428_STRUCTURAL_LOAD_LABEL}: mostrar hatch por carga estructural, kg/m2 y alerta si requiere revision estructural.`,
    } satisfies F428StructuralLoadItem;
  });

  const equipmentLoads = floorPlan.sources.slice(0, 6).map((source) => ({
    id: `equipment-${source.id}`,
    label: source.name,
    category: 'equipment',
    massKgPerM2: 0,
    structuralLoadKPa: 0,
    source: 'equipment-load-pending-manufacturer-spec',
    status: 'blocked',
    rendererUse: 'Reservar footprint real y pedir peso/carga puntual de fabricante antes de memoria firmable.',
  } satisfies F428StructuralLoadItem));

  return [...barrierLoads, ...equipmentLoads];
}

export function buildF426ToF430CalcRendererClosure(args: {
  floorPlan: FloorPlan;
  sequence: F416ToF420BimCanvasSequence;
  handoff: F421ToF425BimHandoffPlan;
}): F426ToF430CalcRendererClosure {
  const { floorPlan, sequence, handoff } = args;
  const hasScale = Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0;
  const hasSources = floorPlan.sources.length > 0;
  const hasBarriers = floorPlan.barriers.length > 0;
  const blockingClashes = sequence.clashCandidates.filter((candidate) => candidate.releaseBlocking).length;
  const structuralLoads = buildStructuralLoads(floorPlan);

  const surfaceRoleCalculations: F426SurfaceRoleCalculation[] = [
    {
      id: 'primary-role-calculation',
      label: 'Primaria',
      role: 'primary',
      barrierCount: countByRole(floorPlan, 'primary'),
      formulaFamily: 'TVL primario NCRP 151 / UAQ',
      standard: 'NCRP 151 + UAQ local review',
      requiredInputs: ['W', 'U', 'T', 'P', 'd', 'TVL1/TVLe', 'materialCode', 'sourceTrace'],
      outputs: ['B', 'nTVL', 'requiredThickness_mm', 'mass_kg_m2', 'passFail'],
      warnings: ['Si energia >10 MV, revisar neutrones y puerta/laberinto.'],
      rendererOverlay: 'Rojo: haz primario, vector fuente-barrera, etiqueta P/U/T/W y espesor.',
      status: calculationStatus(floorPlan, 'primary'),
    },
    {
      id: 'secondary-role-calculation',
      label: 'Secundaria',
      role: 'secondary',
      barrierCount: countByRole(floorPlan, 'secondary'),
      formulaFamily: 'Leakage + scatter dominant check',
      standard: 'NCRP 151 / NCRP 147 segun modalidad',
      requiredInputs: ['leakage', 'scatter', 'T', 'P', 'd', 'TVL', 'patient/scatter geometry'],
      outputs: ['leakageThickness_mm', 'scatterThickness_mm', 'dominant', 'warnings'],
      warnings: ['Comparar metodo base vs conservador antes de PDF final.'],
      rendererOverlay: 'Ambar: dispersa/fuga, etiqueta dominante y distancia critica.',
      status: calculationStatus(floorPlan, 'secondary'),
    },
    {
      id: 'maze-role-calculation',
      label: 'Laberinto',
      role: 'maze',
      barrierCount: countByRole(floorPlan, 'maze'),
      formulaFamily: 'Maze attenuation / skyshine / neutron door precheck',
      standard: 'NCRP 151 + IAEA SR-47',
      requiredInputs: ['pathLength', 'turns', 'doorEquivalent', 'neutronFlag', 'controlPoint'],
      outputs: ['mazeDoseEstimate', 'doorEquivalent', 'additionalShieldingRequired'],
      warnings: ['Laberinto sin trayectoria indirecta bloquea memoria firmable.'],
      rendererOverlay: 'Azul: ruta indirecta, nodos de giro y punto de puerta.',
      status: calculationStatus(floorPlan, 'maze'),
    },
    {
      id: 'door-role-calculation',
      label: 'Puerta',
      role: 'door',
      barrierCount: countByRole(floorPlan, 'door'),
      formulaFamily: 'Door continuity and equivalent shielding',
      standard: 'NCRP 151 + manufacturer/spec evidence',
      requiredInputs: ['doorPbEquivalent', 'frame', 'overlap', 'interlock', 'adjacentBarrierRole'],
      outputs: ['equivalentThickness_mm', 'continuityPassFail', 'doorWarnings'],
      warnings: ['Puerta requiere ficha tecnica, marco, solapes e interlocks.'],
      rendererOverlay: 'Morado: puerta, marco, solape y continuidad de blindaje.',
      status: calculationStatus(floorPlan, 'door'),
    },
    {
      id: 'penetration-role-calculation',
      label: 'Penetracion',
      role: 'penetration',
      barrierCount: countByRole(floorPlan, 'penetration'),
      formulaFamily: 'MEP local shielding penalty',
      standard: 'IAEA SR-47 + project QA',
      requiredInputs: ['system', 'diameter', 'wallRole', 'sleeve', 'offset', 'mitigationEvidence'],
      outputs: ['penaltyFactor', 'localEquivalent_mm', 'blockingRisk'],
      warnings: ['Huecos sin mitigacion son bloqueantes aun si la barrera base pasa.'],
      rendererOverlay: 'Cian: abertura/ducto/sleeve con etiqueta de penalizacion y evidencia.',
      status: calculationStatus(floorPlan, 'penetration'),
    },
  ];

  const penetrationPenalties: F427PenetrationPenalty[] = [
    {
      id: 'sleeve-through-primary',
      label: 'Sleeve en primaria',
      appliesTo: ['primary', 'penetration'],
      trigger: 'Ducto/tuberia cruza barrera primaria o zona de haz directo.',
      penaltyModel: 'Aplicar revision local: equivalente adicional o laberinto; no aceptar hueco recto.',
      defaultPenaltyFactor: 1.25,
      evidenceRequired: ['plano MEP', 'seccion del sleeve', 'material de relleno', 'foto/QA de continuidad'],
      blocking: true,
    },
    {
      id: 'door-frame-continuity',
      label: 'Marco/solape de puerta',
      appliesTo: ['door', 'maze'],
      trigger: 'Puerta blindada o acceso cercano a laberinto.',
      penaltyModel: 'Exigir equivalente de puerta y continuidad de marco; penalizar si falta ficha tecnica.',
      defaultPenaltyFactor: 1.15,
      evidenceRequired: ['ficha proveedor', 'detalle marco', 'solapes', 'interlock'],
      blocking: true,
    },
    {
      id: 'unsealed-opening',
      label: 'Hueco no sellado',
      appliesTo: ['secondary', 'penetration'],
      trigger: 'Abertura sin mitigacion documentada.',
      penaltyModel: 'Bloqueo QA hasta cerrar continuidad o recalcular con blindaje local.',
      defaultPenaltyFactor: 1.5,
      evidenceRequired: ['ubicacion', 'dimension', 'barrera afectada', 'mitigacion firmada'],
      blocking: true,
    },
    {
      id: 'mep-secondary-crossing',
      label: 'MEP en secundaria',
      appliesTo: ['secondary', 'penetration'],
      trigger: 'Charola, ducto o tuberia cruza barrera secundaria.',
      penaltyModel: 'Revisar fuga/dispersa local y agregar hatch de blindaje local si procede.',
      defaultPenaltyFactor: 1.1,
      evidenceRequired: ['capa MEP', 'diametro/seccion', 'sellado', 'revision de carga'],
      blocking: false,
    },
  ];

  const normativeQaCases: F429NormativeQaCase[] = [
    { id: 'linac-6mv-primary', modality: 'TX', label: 'LINAC 6 MV primaria', standard: 'NCRP 151', expectedChecks: ['B', 'nTVL', 'P/T/U/W', 'distancia'], tolerancePercent: 5, evidenceRule: 'Comparar contra caso conocido y memoria previa versionada.' , status: 'fixture-needed' },
    { id: 'linac-15mv-secondary-neutrons', modality: 'TX', label: 'LINAC 15/18 MV secundaria + neutrones', standard: 'NCRP 151 + UAQ', expectedChecks: ['leakage', 'scatter', 'neutronFlag', 'door/maze'], tolerancePercent: 8, evidenceRule: 'Requiere energia maxima, workload y ruta de laberinto.', status: 'fixture-needed' },
    { id: 'ct-rx-ncrp147', modality: 'DX', label: 'CT/RX diagnostico', standard: 'NCRP 147', expectedChecks: ['DLP/patient workload', 'occupancy', 'barrier distance', 'scatter'], tolerancePercent: 8, evidenceRule: 'Usar fixture NCRP 147 con unidades normalizadas.', status: 'fixture-needed' },
    { id: 'gamma-knife-co60', modality: 'TX', label: 'Gamma Knife / Co-60', standard: 'NCRP 151 + IAEA', expectedChecks: ['activity/source term', 'primary geometry', 'door/maze', 'public areas'], tolerancePercent: 8, evidenceRule: 'Comparar contra memoria Gamma Knife reindexada.', status: 'fixture-needed' },
    { id: 'pet-nm-tg108', modality: 'NM', label: 'PET/NM fuente puntual', standard: 'AAPM TG-108 + IAEA', expectedChecks: ['activity', 'time', 'distance', 'occupancy', 'controlled zones'], tolerancePercent: 10, evidenceRule: 'Comparar contra ejemplo PET/NM versionado.', status: 'fixture-needed' },
    { id: 'cyclotron-18mev', modality: 'CY', label: 'Ciclotron 18 MeV', standard: 'IAEA accelerator shielding + NCRP particle accelerator', expectedChecks: ['beam energy/current', 'targets', 'neutrons', 'maze/penetrations'], tolerancePercent: 12, evidenceRule: 'Requiere termino fuente/proveedor y revision de activacion.', status: 'fixture-needed' },
  ];

  const autoMemorySteps: F430AutoMemoryStep[] = [
    { id: 'canvas-plan', label: 'Plano', fromCanvas: 'floorPlan.id, scale, image/vector/hash', output: 'descripcion del layout y escala', requiredEvidence: ['scale_m_per_pixel', 'planHash'], status: hasScale ? 'ready' : 'blocked' },
    { id: 'canvas-equipment', label: 'Equipo', fromCanvas: 'sources[]', output: 'termino fuente por modalidad', requiredEvidence: ['fabricante/modelo', 'workload', 'sourceTrace'], status: hasSources ? 'ready' : 'blocked' },
    { id: 'canvas-barriers', label: 'Barreras', fromCanvas: 'barriers[] + roleForBarrier()', output: 'tabla primaria/secundaria/laberinto/puerta/penetracion', requiredEvidence: ['P', 'T', 'U', 'material', 'role'], status: hasBarriers ? 'ready' : 'blocked' },
    { id: 'canvas-calculation', label: 'Calculo', fromCanvas: 'calculationTrace + role calculations', output: 'formula, norma, inputs, outputs, warnings', requiredEvidence: ['formulaId', 'standard', 'citationIds'], status: floorPlan.barriers.some((barrier) => barrierThicknessMm(barrier) > 0) ? 'ready' : 'blocked' },
    { id: 'canvas-pen-structure', label: 'Penetraciones/carga', fromCanvas: 'F427 + F428', output: 'anexo MEP y carga kg/m2/kPa', requiredEvidence: ['MEP detail', 'density source', 'structural review'], status: structuralLoads.length > 0 ? 'ready' : 'blocked' },
    { id: 'canvas-evidence-pdf', label: 'Evidencia/PDF', fromCanvas: 'F421 visual exports + F425 handoff', output: `${F430_AUTO_MEMORY_FLOW_LABEL}: Memoria IA + Evidence Pack + anexo BIM PDF`, requiredEvidence: ['PNG/PDF/JSON export', 'page/hash', 'QA manifest'], status: handoff.visualExports.some((item) => item.status === 'ready') ? 'ready' : 'blocked' },
  ];

  const rendererDeepPlan: F426ToF430RendererDeepStep[] = [
    { id: 'renderer-geometry-core', phase: 'F426', label: 'Geometry core normalizado', implementation: 'Entidad unica Barrier/Source/Region/Penetration con seleccion y overlay por rol.', connectedEvidence: ['RS_BimEntityId', 'surfaceRole', 'calculationTrace'], status: hasBarriers ? 'ready' : 'draft' },
    { id: 'renderer-cutaway-real', phase: 'F427', label: 'Cutaway 2.5D visible/real', implementation: 'Extruir espesor y huella blindada real con comparacion espacio visible vs estructura.', connectedEvidence: ['cutawayMetrics', 'thickness_mm', 'materialDensity'], status: hasScale && hasBarriers ? 'ready' : 'draft' },
    { id: 'renderer-mep-penetrations', phase: 'F428', label: 'Penetraciones MEP reales', implementation: 'Dibujar sleeves/ductos/openings sobre barrera afectada con penalizacion y bloqueo QA.', connectedEvidence: ['F427PenetrationPenalty', 'MEP layer', 'mitigationEvidence'], status: blockingClashes > 0 ? 'draft' : 'ready' },
    { id: 'renderer-visual-export-evidence', phase: 'F429', label: 'Export visual BIM conectado', implementation: 'Snapshot PNG/PDF/JSON con roles, espesores, MEP, cargas y citas para Evidence/Memoria.', connectedEvidence: ['F421 visualExports', 'F425 handoff', 'QA manifest'], status: handoff.visualExports.some((item) => item.status === 'ready') ? 'ready' : 'draft' },
    { id: 'renderer-e2e-qa', phase: 'F430', label: 'QA visual/E2E renderer profundo', implementation: 'Smoke dedicado para abrir canvas, comprobar overlays F426-F430 y export visual.', connectedEvidence: ['Playwright screenshot', 'releaseBlocks', 'manual/version entry'], status: 'draft' },
  ];

  const releaseBlocks = [
    !hasScale ? 'F430 bloqueado: falta escala verificada del plano.' : '',
    !hasSources ? 'F430 bloqueado: falta equipo/fuente con termino fuente.' : '',
    !hasBarriers ? 'F430 bloqueado: faltan barreras/superficies para clasificar.' : '',
    surfaceRoleCalculations.some((item) => item.status !== 'ready') ? 'F426 pendiente: hay roles sin geometria o sin calculo.' : '',
    blockingClashes > 0 ? `F427/F428 pendiente: ${blockingClashes} cruces MEP/blindaje requieren mitigacion.` : '',
    structuralLoads.some((item) => item.status === 'blocked') ? 'F428 pendiente: faltan cargas de equipo/material o espesores.' : '',
    normativeQaCases.some((item) => item.status !== 'ready') ? 'F429 pendiente: faltan fixtures numericos NCRP/IAEA/UAQ firmables.' : '',
  ].filter(Boolean);

  return {
    schema: 'radshield-mx.f426-f430.calc-renderer-closure.v1',
    phaseRange: 'F426-F430',
    status: 'closure-ready',
    surfaceRoleCalculations,
    penetrationPenalties,
    structuralLoads,
    totalStructuralLoadKgPerM2: structuralLoads.reduce((sum, item) => sum + item.massKgPerM2, 0),
    normativeQaCases,
    autoMemorySteps,
    rendererDeepPlan,
    releaseBlocks,
  };
}
