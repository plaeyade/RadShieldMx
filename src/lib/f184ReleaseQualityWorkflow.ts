import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

export type F184QualityStatus = 'ready' | 'partial' | 'missing';
export type F184QualityScope = 'calculation' | 'canvas' | 'memoria' | 'materials' | 'rag' | 'export';

export interface F184QualityItem {
  id: string;
  scope: F184QualityScope;
  label: string;
  status: F184QualityStatus;
  evidence: string;
  nextAction: string;
}

export interface F184ReleaseQualityWorkflow {
  phase: 'F184';
  status: 'implemented-safe-release-quality-workflow';
  score: number;
  readyCount: number;
  partialCount: number;
  missingCount: number;
  items: F184QualityItem[];
  guardrails: string[];
  nextActions: string[];
  decision: string;
}

function statusScore(status: F184QualityStatus): number {
  if (status === 'ready') return 1;
  if (status === 'partial') return 0.5;
  return 0;
}

function qualityItem(
  id: string,
  scope: F184QualityScope,
  label: string,
  status: F184QualityStatus,
  evidence: string,
  nextAction: string,
): F184QualityItem {
  return { id, scope, label, status, evidence, nextAction };
}

function hasAny(value: unknown[] | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasUsableResult(result: CanvasBarrierResult): boolean {
  return Number.isFinite(result.maxBarrierThickness_mm) && result.maxBarrierThickness_mm > 0;
}

function hasLinkedSample(sampleLines: CanvasSampleLine[], barrierId: string): boolean {
  return sampleLines.some((line) => line.barrierId === barrierId && line.points.length > 0);
}

export function buildF184ReleaseQualityWorkflow(
  floorPlan?: FloorPlan,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): F184ReleaseQualityWorkflow {
  const barriers = floorPlan?.barriers ?? [];
  const sources = floorPlan?.sources ?? [];
  const regions = floorPlan?.regions ?? [];
  const materialCodes = new Set(
    barriers.flatMap((barrier) => {
      const layered = barrier.shieldingLayers?.map((layer) => layer.materialCode) ?? [];
      return [...layered, barrier.materialCode, barrier.material].filter(Boolean);
    }),
  );
  const calculatedResults = barrierResults.filter(hasUsableResult);
  const linkedResults = barrierResults.filter((result) => hasUsableResult(result) && hasLinkedSample(sampleLines, result.barrierId));
  const hasHeatmapContext = hasAny(sampleLines) || calculatedResults.length > 0;
  const hasMaterialQuantities = barriers.some((barrier) =>
    Number.isFinite(barrier.thickness_mm)
    || Number.isFinite(barrier.concreteEquivalent_mm)
    || Number.isFinite(barrier.leadEquivalent_mm)
    || Boolean(barrier.requiredThickness_mm)
    || Boolean(barrier.shieldingLayers?.length),
  );

  const items: F184QualityItem[] = [
    qualityItem(
      'f184-floorplan-base',
      'canvas',
      'Plano base con barreras, fuentes y zonas',
      barriers.length > 0 && sources.length > 0 ? 'ready' : barriers.length > 0 || sources.length > 0 ? 'partial' : 'missing',
      `${barriers.length} barreras, ${sources.length} fuentes, ${regions.length} zonas`,
      'Mantener el demo R&F activo y cargar un plano real antes de exportar memoria final.',
    ),
    qualityItem(
      'f184-calculation-results',
      'calculation',
      'Resultados calculados por barrera',
      calculatedResults.length === barriers.length && barriers.length > 0 ? 'ready' : calculatedResults.length > 0 ? 'partial' : 'missing',
      `${calculatedResults.length}/${Math.max(barriers.length, 1)} barreras con espesor numerico`,
      'Ejecutar Calcular y revisar barreras sin espesor valido.',
    ),
    qualityItem(
      'f184-sample-line-evidence',
      'calculation',
      'Evidencia espacial 0.3 m / puntos de muestra',
      linkedResults.length === calculatedResults.length && calculatedResults.length > 0 ? 'ready' : linkedResults.length > 0 ? 'partial' : 'missing',
      `${linkedResults.length}/${Math.max(calculatedResults.length, 1)} resultados con linea/puntos vinculados`,
      'Agregar lineas de muestreo y conservar puntos criticos para Evidence Pack.',
    ),
    qualityItem(
      'f184-canvas-professional-readiness',
      'canvas',
      'Canvas CAD sin cambios destructivos de layout',
      barriers.length > 0 ? 'partial' : 'missing',
      hasHeatmapContext ? 'Heatmap/calculo disponible para overlay; UI principal no se reordena en F184.' : 'Sin datos suficientes para heatmap/overlay.',
      'Pulir grips, cotas, snapping y seleccion en microcambios con smoke visual despues de F184.',
    ),
    qualityItem(
      'f184-material-toolbox',
      'materials',
      'Materiales consolidados: TVL, densidad, peso, costo, tiempo y carga',
      materialCodes.size > 0 && hasMaterialQuantities ? 'ready' : materialCodes.size > 0 ? 'partial' : 'missing',
      `${materialCodes.size} materiales detectados; cantidades ${hasMaterialQuantities ? 'presentes' : 'pendientes'}`,
      'Usar el comparador de materiales como toolbox canonica y verificar fichas/TVL comerciales.',
    ),
    qualityItem(
      'f184-memoria-evidence-flow',
      'memoria',
      'Flujo Memoria IA con formula, norma, input, output y cita',
      calculatedResults.length > 0 && linkedResults.length > 0 ? 'ready' : calculatedResults.length > 0 ? 'partial' : 'missing',
      `F125 puede auditar ${barrierResults.length} resultados; F146/F149/F149c disponibles como anexos.`,
      'Completar equipo, workload, barreras, calculo y citas verificadas antes del PDF firmado.',
    ),
    qualityItem(
      'f184-rag-traceability',
      'rag',
      'RAG/documentos con hash, pagina y deduplicacion',
      'partial',
      'F126/F144/F146/F170 ya definen ledger, gobierno de fuentes y hashes; OCR pendiente se conserva como advertencia.',
      'Cerrar OCR pendiente y reindexar documentos canonicos solo si cambia hash/version.',
    ),
    qualityItem(
      'f184-export-readiness',
      'export',
      'PDF, Evidence Pack, anexos y checklist CNSNS/UAQ/NCRP/IAEA',
      calculatedResults.length > 0 && materialCodes.size > 0 ? 'partial' : 'missing',
      'Export esta habilitado, pero release firmado requiere QA numerico, anexos materiales y Evidence Pack verificado.',
      'Repetir smoke de exportacion despues de calcular un plano completo.',
    ),
  ];

  const readyCount = items.filter((item) => item.status === 'ready').length;
  const partialCount = items.filter((item) => item.status === 'partial').length;
  const missingCount = items.filter((item) => item.status === 'missing').length;
  const score = Math.round((items.reduce((sum, item) => sum + statusScore(item.status), 0) / items.length) * 100);

  return {
    phase: 'F184',
    status: 'implemented-safe-release-quality-workflow',
    score,
    readyCount,
    partialCount,
    missingCount,
    items,
    guardrails: [
      'No mover sidebar, topbar, demo R&F ni canvas shell durante esta fase.',
      'Toda mejora visual de canvas debe entrar como microcambio con smoke antes/despues.',
      'Materiales comerciales pueden citarse, pero no reemplazan constantes normativas sin revision profesional.',
      'Monte Carlo externo permanece gateway validable; no se declara MC clinico certificado sin datasets/motores versionados.',
    ],
    nextActions: items.filter((item) => item.status !== 'ready').map((item) => item.nextAction),
    decision:
      'F184 prioriza calidad verificable del motor, memoria, materiales, RAG y export sin tocar el layout que sostiene el canvas/sidebar.',
  };
}

export function formatF184ReleaseQualityWorkflowText(workflow: F184ReleaseQualityWorkflow): string {
  return [
    'F184 - RELEASE QUALITY WORKFLOW SEGURO',
    `Score: ${workflow.score}% | ready ${workflow.readyCount} | partial ${workflow.partialCount} | missing ${workflow.missingCount}`,
    ...workflow.items.map((item) => [
      `- ${item.label} [${item.status}]`,
      `  Scope: ${item.scope}`,
      `  Evidencia: ${item.evidence}`,
      `  Siguiente: ${item.nextAction}`,
    ].join('\n')),
    'Guardrails:',
    ...workflow.guardrails.map((item) => `- ${item}`),
    `Decision: ${workflow.decision}`,
  ].join('\n');
}
