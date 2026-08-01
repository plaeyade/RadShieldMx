import type { F411BimMethodologyPlan } from '@/lib/f411BimCanvasMethodology';

export interface F413BimExecutionStep {
  id: string;
  label: string;
  purpose: string;
  owner: 'CAD/BIM' | 'Fisica Medica' | 'Estructura' | 'QA';
  status: 'ready' | 'draft' | 'blocked' | 'external';
}

export interface F413BimWorkset {
  id: string;
  label: string;
  category: string;
  rule: string;
}

export interface F413BimDeliverable {
  id: string;
  label: string;
  format: 'JSON' | 'PDF' | 'IFC/DXF' | 'Revit RS_*' | 'Evidence Pack';
  requiredForRelease: boolean;
}

export interface F413BimExecutionPlan {
  schema: 'radshield-mx.f413.bim-execution-plan.v1';
  phase: 'F413';
  status: 'bim-execution-ready' | 'bim-execution-draft';
  readinessScore: number;
  steps: F413BimExecutionStep[];
  worksets: F413BimWorkset[];
  deliverables: F413BimDeliverable[];
  methodologyNotes: string[];
}

export function buildF413BimExecutionPlan(plan: F411BimMethodologyPlan): F413BimExecutionPlan {
  const hasGeometry = plan.entityCatalog.some((entity) => entity.id === 'barriers' && entity.count > 0);
  const hasSources = plan.entityCatalog.some((entity) => entity.id === 'sources' && entity.count > 0);
  const hasZones = plan.entityCatalog.some((entity) => entity.id === 'zones' && entity.count > 0);
  const hasParameters = plan.sharedParameterRows.length >= 7;
  const hasRoundtrip = plan.roundtripGates.some((gate) => gate.id === 'rs-parameters' && gate.status === 'ready');
  const score = Math.round(([hasGeometry, hasSources, hasZones, hasParameters, hasRoundtrip].filter(Boolean).length / 5) * 100);

  return {
    schema: 'radshield-mx.f413.bim-execution-plan.v1',
    phase: 'F413',
    status: score >= 60 ? 'bim-execution-ready' : 'bim-execution-draft',
    readinessScore: score,
    steps: [
      {
        id: 'acquire',
        label: 'Acquire',
        purpose: 'Recibir DXF/IFC/PDF/plano base y registrar origen, escala, revision y hash.',
        owner: 'CAD/BIM',
        status: 'ready',
      },
      {
        id: 'normalize',
        label: 'Normalize',
        purpose: 'Normalizar unidades, ejes, niveles, origen y escala antes de dibujar o calcular.',
        owner: 'CAD/BIM',
        status: hasGeometry ? 'ready' : 'draft',
      },
      {
        id: 'classify',
        label: 'Classify',
        purpose: 'Clasificar muros, zonas, equipos, penetraciones, puntos criticos y capas disciplinares.',
        owner: 'Fisica Medica',
        status: hasGeometry || hasZones ? 'ready' : 'draft',
      },
      {
        id: 'bind',
        label: 'Bind RS_*',
        purpose: 'Asignar parametros RS_* a entidades BIM para roundtrip Revit/IFC y Evidence Pack.',
        owner: 'QA',
        status: hasParameters ? 'ready' : 'blocked',
      },
      {
        id: 'calculate',
        label: 'Calculate',
        purpose: 'Ejecutar calculo trazable con fuente, material, P/T/U/W, TVL, geometria y citas.',
        owner: 'Fisica Medica',
        status: hasGeometry && hasSources ? 'ready' : 'draft',
      },
      {
        id: 'coordinate',
        label: 'Coordinate',
        purpose: 'Revisar carga estructural, penetraciones, puertas, ductos, interferencias y costos/obra.',
        owner: 'Estructura',
        status: hasGeometry ? 'draft' : 'blocked',
      },
      {
        id: 'publish',
        label: 'Publish',
        purpose: 'Generar memoria, PDF, anexos, snapshots, JSON reproducible y paquete de evidencia.',
        owner: 'QA',
        status: hasRoundtrip ? 'ready' : 'draft',
      },
    ],
    worksets: [
      { id: 'architecture', label: 'Arquitectura', category: 'IfcWall/IfcDoor/IfcSpace', rule: 'Solo geometria validada por escala y revision.' },
      { id: 'radiological', label: 'Proteccion radiologica', category: 'Barreras/Fuentes/Puntos', rule: 'Siempre con formula, norma, cita y hash.' },
      { id: 'structural', label: 'Estructura/obra', category: 'Materiales/Cargas/Costos', rule: 'Peso y carga superficial antes de aprobar materiales HD.' },
      { id: 'evidence', label: 'Evidencia', category: 'RS_EvidencePackId', rule: 'Toda decision relevante debe apuntar a fuente/documento/pagina/hash.' },
    ],
    deliverables: [
      { id: 'bim-manifest', label: 'BIM execution manifest', format: 'JSON', requiredForRelease: true },
      { id: 'memory', label: 'Memoria analitica con citas', format: 'PDF', requiredForRelease: true },
      { id: 'cad-handoff', label: 'IFC/DXF handoff validado', format: 'IFC/DXF', requiredForRelease: false },
      { id: 'revit-schedule', label: 'Schedule Revit RS_*', format: 'Revit RS_*', requiredForRelease: false },
      { id: 'evidence-pack', label: 'Evidence Pack reproducible', format: 'Evidence Pack', requiredForRelease: true },
    ],
    methodologyNotes: [
      'F413 no activa RVT/DWG nativo: formaliza el proceso para que esas integraciones entren por proveedor externo y contrato verificable.',
      'El flujo BIM debe bloquear memoria firmable si faltan escala, fuente, material versionado, cita/hash o revision profesional.',
      'El mismo identificador RS_BimEntityId debe viajar por canvas, memoria, Evidence Pack, Revit schedule y export JSON.',
    ],
  };
}
