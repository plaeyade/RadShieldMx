import type { FloorPlan } from '@/types/radshield';
import type { F426ToF430CalcRendererClosure } from '@/lib/f426ToF430CalcRendererClosure';
import type { F442ToF445RendererV2Runtime } from '@/lib/f442ToF445RendererV2Runtime';
import type { F446ToF448CanvasStrongQa } from '@/lib/f446ToF448CanvasStrongQa';

export type F449MemoryTraceSurfaceRole = 'primary' | 'secondary' | 'maze' | 'door' | 'penetration' | 'structural';

export interface F449CalculationTraceBinding {
  id: string;
  phase: 'F449';
  label: string;
  role: F449MemoryTraceSurfaceRole;
  calculationTrace: string;
  formulaId: string;
  standard: string;
  memorySection: string;
  canvasEvidence: string;
  status: 'ready' | 'needs-data';
}

export interface F450CitationEvidenceBinding {
  id: string;
  phase: 'F450';
  label: string;
  sourceFamily: 'NCRP' | 'IAEA' | 'AAPM' | 'UAQ' | 'Manufacturer' | 'Material';
  citationRule: string;
  evidenceOutput: string;
  hashRule: string;
  status: 'ready' | 'needs-hash';
}

export interface F451VisualAdaptation {
  id: string;
  phase: 'F451';
  fromReference: string;
  adaptedToRadShield: string;
  canvasLayer: string;
  visualEncoding: string;
}

export interface F452BimGraphicPanel {
  id: string;
  phase: 'F452';
  label: string;
  purpose: string;
  visibleElements: string[];
  connectedActions: string[];
}

export interface F453ReleaseHandoff {
  id: string;
  phase: 'F453';
  label: string;
  acceptance: string;
  evidence: string;
  rollback: string;
}

export interface F449ToF453BimMemoryVisual {
  schema: 'radshield-mx.f449-f453.bim-memory-visual.v1';
  phaseRange: 'F449-F453';
  status: 'bim-memory-visual-ready' | 'bim-memory-visual-review';
  traceBindings: F449CalculationTraceBinding[];
  citationBindings: F450CitationEvidenceBinding[];
  visualAdaptations: F451VisualAdaptation[];
  graphicPanels: F452BimGraphicPanel[];
  releaseHandoff: F453ReleaseHandoff[];
  boardTitle: string;
  boardSubtitle: string;
  releaseDecision: string;
}

function hasGeometry(floorPlan: FloorPlan): boolean {
  return getBarriers(floorPlan).length > 0 || getSources(floorPlan).length > 0 || getRegions(floorPlan).length > 0;
}

function getBarriers(floorPlan: FloorPlan) {
  return Array.isArray(floorPlan.barriers) ? floorPlan.barriers : [];
}

function getSources(floorPlan: FloorPlan) {
  return Array.isArray(floorPlan.sources) ? floorPlan.sources : [];
}

function getRegions(floorPlan: FloorPlan) {
  if (Array.isArray(floorPlan.regions)) return floorPlan.regions;
  if (Array.isArray(floorPlan.occupiedRegions)) return floorPlan.occupiedRegions;
  return [];
}

function surfaceStatus(floorPlan: FloorPlan, role: F449MemoryTraceSurfaceRole): F449CalculationTraceBinding['status'] {
  const barriers = getBarriers(floorPlan);
  if (role === 'structural') return barriers.length > 0 ? 'ready' : 'needs-data';
  if (role === 'primary') return barriers.some((barrier) => barrier.barrierType === 'primary') ? 'ready' : 'needs-data';
  if (role === 'secondary') return barriers.length > 0 ? 'ready' : 'needs-data';
  if (role === 'door') return barriers.some((barrier) => /door|puerta/i.test(barrier.name)) ? 'ready' : 'needs-data';
  if (role === 'maze') return barriers.some((barrier) => /maze|laberinto/i.test(barrier.name)) ? 'ready' : 'needs-data';
  return barriers.some((barrier) => /penetration|penetracion|duct|sleeve|hueco|opening/i.test(barrier.name)) ? 'ready' : 'needs-data';
}

export function buildF449ToF453BimMemoryVisual(args: {
  floorPlan: FloorPlan;
  closure: F426ToF430CalcRendererClosure;
  runtime: F442ToF445RendererV2Runtime;
  strongQa: F446ToF448CanvasStrongQa;
}): F449ToF453BimMemoryVisual {
  const { floorPlan, closure, runtime, strongQa } = args;
  const geometryReady = hasGeometry(floorPlan);
  const qaReady = strongQa.status === 'canvas-strong-qa-ready';
  const runtimeReady = runtime.status !== 'renderer-v2-runtime-blocked';

  const traceBindings: F449CalculationTraceBinding[] = [
    {
      id: 'f449-primary-barrier-memory',
      phase: 'F449',
      label: 'Primary barrier',
      role: 'primary',
      calculationTrace: 'source -> primary ray -> barrier -> requiredThickness_mm -> pass/fail',
      formulaId: 'NCRP151_PRIMARY_TVL',
      standard: 'NCRP 151 / UAQ analytic memory workflow',
      memorySection: 'Memoria IA > Barreras primarias',
      canvasEvidence: 'Red wall role, beam vector, P/T/U/W labels, TVL material citation.',
      status: surfaceStatus(floorPlan, 'primary'),
    },
    {
      id: 'f449-secondary-barrier-memory',
      phase: 'F449',
      label: 'Secondary barrier',
      role: 'secondary',
      calculationTrace: 'leakage/scatter -> dominant method -> secondary barrier -> warning set',
      formulaId: 'NCRP151_SECONDARY_DOMINANT',
      standard: 'NCRP 151 / NCRP 147 according to modality',
      memorySection: 'Memoria IA > Barreras secundarias',
      canvasEvidence: 'Amber walls with leakage/scatter tags and conservative check.',
      status: surfaceStatus(floorPlan, 'secondary'),
    },
    {
      id: 'f449-maze-door-memory',
      phase: 'F449',
      label: 'Maze and door',
      role: 'maze',
      calculationTrace: 'indirect path -> maze attenuation -> door residual -> penetration warning',
      formulaId: 'MAZE_DOOR_ATTENUATION_PRECHECK',
      standard: 'NCRP 151 / IAEA SRS-47 / local RSO review',
      memorySection: 'Memoria IA > Laberinto, puerta y continuidad',
      canvasEvidence: 'Blue maze route, purple door, direction arrows and continuity badges.',
      status: surfaceStatus(floorPlan, 'maze'),
    },
    {
      id: 'f449-penetration-memory',
      phase: 'F449',
      label: 'MEP penetrations',
      role: 'penetration',
      calculationTrace: 'duct/sleeve/opening -> shielding continuity penalty -> evidence item',
      formulaId: 'PENETRATION_CONTINUITY_PENALTY',
      standard: 'IAEA SRS-47 shielding continuity + project detail',
      memorySection: 'Memoria IA > Penetraciones y detalles constructivos',
      canvasEvidence: 'Cyan sleeves/ducts over barriers with blocking review tag.',
      status: surfaceStatus(floorPlan, 'penetration'),
    },
    {
      id: 'f449-structural-load-memory',
      phase: 'F449',
      label: 'Structural load',
      role: 'structural',
      calculationTrace: 'material density x thickness -> kg/m2 -> kPa -> structural warning',
      formulaId: 'STRUCTURAL_LOAD_KG_M2',
      standard: 'Material ledger + structural coordination workflow',
      memorySection: 'Memoria IA > Materiales, peso y estructura',
      canvasEvidence: `${closure.structuralLoads.length} load items linked to material/equipment evidence.`,
      status: surfaceStatus(floorPlan, 'structural'),
    },
  ];

  const citationBindings: F450CitationEvidenceBinding[] = [
    {
      id: 'f450-ncrp-151-citation',
      phase: 'F450',
      label: 'NCRP 151',
      sourceFamily: 'NCRP',
      citationRule: 'Citar reporte, pagina/tabla si existe chunk, formulaId y hash documental.',
      evidenceOutput: 'PDF memoria + Evidence Pack + citation picker vivo.',
      hashRule: 'document_hash + page + chunk_id',
      status: 'ready',
    },
    {
      id: 'f450-iaea-srs47-citation',
      phase: 'F450',
      label: 'IAEA SRS-47',
      sourceFamily: 'IAEA',
      citationRule: 'Usar para criterios de diseno, continuidad, laberinto y proteccion del publico.',
      evidenceOutput: 'Anexo normativo y advertencias clinicas.',
      hashRule: 'document_hash + page + extraction_method',
      status: 'ready',
    },
    {
      id: 'f450-material-citation',
      phase: 'F450',
      label: 'Material TVL/density',
      sourceFamily: 'Material',
      citationRule: 'Cada TVL, densidad, costo y carga debe apuntar a fuente/proveedor o memoria aprobada.',
      evidenceOutput: 'Anexo de materiales con TVL, densidad, kg/m2, costo, tiempo, incertidumbre y cita.',
      hashRule: 'material_source_hash + page + row_id',
      status: 'needs-hash',
    },
    {
      id: 'f450-manufacturer-citation',
      phase: 'F450',
      label: 'Manufacturer equipment',
      sourceFamily: 'Manufacturer',
      citationRule: 'Footprint, energia maxima, peso, penetraciones y servicios salen de ficha o site planning guide.',
      evidenceOutput: 'Ficha de equipo dentro del Evidence Pack.',
      hashRule: 'manufacturer_doc_hash + page + equipment_variant',
      status: getSources(floorPlan).length > 0 ? 'ready' : 'needs-hash',
    },
  ];

  const visualAdaptations: F451VisualAdaptation[] = [
    {
      id: 'f451-visible-vs-real-room',
      phase: 'F451',
      fromReference: 'Imagen: sala visible vs bunker real mucho mayor.',
      adaptedToRadShield: 'Cutaway 2.5D que muestra sala interior y masa de blindaje exterior.',
      canvasLayer: 'shielding-shell',
      visualEncoding: 'Concrete shell, inner room, dimension tags and hidden shielding emphasis.',
    },
    {
      id: 'f451-every-wall-has-job',
      phase: 'F451',
      fromReference: 'Imagen: cada muro tiene un trabajo distinto.',
      adaptedToRadShield: 'Roles por superficie: primaria, secundaria, laberinto, puerta y penetraciones.',
      canvasLayer: 'surface-role-overlay',
      visualEncoding: 'Red/amber/blue/purple/cyan role map with labels and legend.',
    },
    {
      id: 'f451-built-on-standards',
      phase: 'F451',
      fromReference: 'Imagen: built on science, backed by standards.',
      adaptedToRadShield: 'Panel de citas normativas conectado a formulaId y Evidence Pack.',
      canvasLayer: 'evidence-strip',
      visualEncoding: 'NCRP/IAEA/AAPM/UAQ chips with hash/page rule.',
    },
    {
      id: 'f451-bim-ribbon-frame',
      phase: 'F451',
      fromReference: 'Frames/video: interfaz BIM/CAD con ribbon, project manager, capas, view cube y propiedades.',
      adaptedToRadShield: 'Sidebar BIM estable, ribbon clinico, panel de capas y mini view cube medico.',
      canvasLayer: 'bim-ui-chrome',
      visualEncoding: 'Project tree, toolbar lanes, properties card and navigation widget.',
    },
    {
      id: 'f451-mep-coordination',
      phase: 'F451',
      fromReference: 'Frames/video: coordinacion MEP y elementos etiquetados.',
      adaptedToRadShield: 'Ductos, sleeves y huecos como objetos trazables que penalizan continuidad de blindaje.',
      canvasLayer: 'mep-penetrations',
      visualEncoding: 'Cyan callouts and warning badges linked to F427.',
    },
  ];

  const graphicPanels: F452BimGraphicPanel[] = [
    {
      id: 'f452-project-manager',
      phase: 'F452',
      label: 'Project manager',
      purpose: 'Navegar plano, equipos, materiales, capas, evidencia y reportes.',
      visibleElements: ['BIM tree', 'layers', 'properties', 'current selection'],
      connectedActions: ['open project', 'select layer', 'show evidence', 'export visual'],
    },
    {
      id: 'f452-cutaway-board',
      phase: 'F452',
      label: 'Cutaway bunker',
      purpose: 'Mostrar lo visible vs lo que realmente protege: muros, losa, puerta, laberinto y equipo.',
      visibleElements: ['inner room', 'concrete shell', 'source footprint', 'role callouts'],
      connectedActions: ['inspect 3D', 'toggle structure', 'export report capture'],
    },
    {
      id: 'f452-memory-flow',
      phase: 'F452',
      label: 'Memory flow',
      purpose: 'Conectar canvas con calculo, citas, evidencia y PDF.',
      visibleElements: ['floorplan', 'equipment', 'barriers', 'formulas', 'citations', 'PDF'],
      connectedActions: ['run calculation', 'open Memoria IA', 'open Evidence Pack'],
    },
  ];

  const releaseHandoff: F453ReleaseHandoff[] = [
    {
      id: 'f453-visual-regression',
      phase: 'F453',
      label: 'Visual regression',
      acceptance: 'La tarjeta BIM, SVG board y fila F449-F453 deben renderizar sin ocultar canvas/sidebar.',
      evidence: 'e2e/f449-f453-bim-memory-visual.spec.ts',
      rollback: 'Retirar solo el panel F449-F453; runtime/canvas base no se toca.',
    },
    {
      id: 'f453-memory-qa',
      phase: 'F453',
      label: 'Memory QA',
      acceptance: 'Cada rol visual debe mapear a formulaId, norma, seccion de memoria y evidencia.',
      evidence: `${traceBindings.length} trace bindings + ${citationBindings.length} citation bindings.`,
      rollback: 'Mantener calculo F426-F430 y ocultar tablero visual.',
    },
    {
      id: 'f453-canvas-qa',
      phase: 'F453',
      label: 'Canvas QA',
      acceptance: 'F446-F448 strong QA se mantiene listo y el overlay v2 no intercepta eventos.',
      evidence: `${strongQa.regressionGates.filter((gate) => gate.pass).length}/${strongQa.regressionGates.length} gates.`,
      rollback: 'Desactivar visual BIM si afecta acciones rapidas o boton derecho.',
    },
  ];

  const readyTraceCount = traceBindings.filter((item) => item.status === 'ready').length;
  const status = geometryReady && qaReady && runtimeReady ? 'bim-memory-visual-ready' : 'bim-memory-visual-review';

  return {
    schema: 'radshield-mx.f449-f453.bim-memory-visual.v1',
    phaseRange: 'F449-F453',
    status,
    traceBindings,
    citationBindings,
    visualAdaptations,
    graphicPanels,
    releaseHandoff,
    boardTitle: 'BIM Shielding Memory Board',
    boardSubtitle: `${readyTraceCount}/${traceBindings.length} trace bindings ready | ${runtime.instructions.length} renderer instructions | ${closure.totalStructuralLoadKgPerM2} kg/m2 structural estimate`,
    releaseDecision: status === 'bim-memory-visual-ready'
      ? 'Listo para mostrar BIM grafico conectado a calculo, evidencia y Memoria IA sin tocar eventos base.'
      : 'Revisar geometria/citas faltantes antes de usar como memoria firmable; visual seguro para demo.',
  };
}
