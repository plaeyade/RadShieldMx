import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { buildF86EvidenceSummary } from '@/lib/canvasF85Workflow';
import { createEvidenceSource, type EvidenceSource } from '@/lib/evidencePack';
import { buildF125CalculationEvidenceGate, buildF125CalculationEvidenceSection } from '@/lib/f125CalculationEvidenceGate';
import { buildF126ReleaseEvidenceSection } from '@/lib/f126ReleaseEvidenceHardening';
import { buildF409OutputSurfaceIntegration, formatF409OutputSurfaceIntegrationText } from '@/lib/f409OutputSurfaceIntegration';
import type { FloorPlan } from '@/types/radshield';

export interface AnalyticMemorySnapshot {
  barriers: number;
  sources: number;
  regions: number;
  sampleLines: number;
  samplePoints: number;
  results: number;
  criticalPoints: number;
  presetBarriers: number;
  presetCoveragePct: number;
  maxThickness: number;
  standards: string[];
}

export function buildAnalyticMemorySnapshot(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): AnalyticMemorySnapshot {
  const f86Evidence = buildF86EvidenceSummary(floorPlan);
  return {
    barriers: floorPlan?.barriers.length ?? 0,
    sources: floorPlan?.sources.length ?? 0,
    regions: floorPlan?.occupiedRegions.length ?? floorPlan?.regions?.length ?? 0,
    sampleLines: sampleLines.length,
    samplePoints: sampleLines.reduce((acc, line) => acc + line.points.length, 0),
    results: barrierResults.length,
    criticalPoints: f86Evidence.criticalPoints,
    presetBarriers: f86Evidence.presetBarriers,
    presetCoveragePct: f86Evidence.presetCoveragePct,
    maxThickness: barrierResults.reduce(
      (max, result) => Math.max(max, result.maxBarrierThickness_mm || result.thicknessConcrete_mm || result.thicknessLead_mm || 0),
      0,
    ),
    standards: Array.from(new Set((floorPlan?.sources ?? []).map(source => source.modality?.standard || source.modality?.category || 'desconocido'))),
  };
}

export function createFloorPlanEvidenceSources(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): EvidenceSource[] {
  if (!floorPlan) return [];

  const snapshot = buildAnalyticMemorySnapshot(floorPlan, barrierResults, sampleLines);
  const f86Evidence = buildF86EvidenceSummary(floorPlan);
  const f125Gate = buildF125CalculationEvidenceGate(floorPlan, barrierResults, sampleLines);
  const f409OutputIntegration = buildF409OutputSurfaceIntegration(floorPlan, barrierResults, sampleLines);
  const generatedAt = new Date().toISOString();
  const dxfImportEvidence = floorPlan.importMetadata
    ? createEvidenceSource({
      id: 'ev-dxf-import-review',
      title: `Revision de importacion CAD/DXF: ${floorPlan.importMetadata.fileName ?? floorPlan.name}`,
      url: `radshield://cad-import/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'La geometria importada desde CAD/DXF conserva metadata de origen, modo, estado de revision y conteo de barreras para trazabilidad de memoria analitica.',
      excerpt: [
        `Archivo: ${floorPlan.importMetadata.fileName ?? floorPlan.name}`,
        `modo: ${floorPlan.importMetadata.mode ?? 'sin modo'}`,
        `estado: ${floorPlan.importMetadata.status ?? 'sin estado'}`,
        `barreras mapeadas: ${floorPlan.importMetadata.mappedBarriers ?? floorPlan.barriers.length}`,
        `escala: ${floorPlan.scale_m_per_pixel} m/px`,
        `warnings: ${(floorPlan.importMetadata.warnings ?? []).length}`,
      ].join('; '),
      notes: floorPlan.importMetadata.status === 'final'
        ? 'El operador confirmo la geometria DXF para calculo/memoria. Aun debe verificarse contra planos firmados, colindancias y escala final.'
        : 'La geometria DXF sigue preliminar. No debe usarse como base final de memoria hasta confirmar escala, capas, continuidad de blindaje y barreras.',
      confidence: floorPlan.importMetadata.status === 'final' && snapshot.barriers > 0 ? 'high' : 'medium',
      tags: ['DXF', 'CAD', 'floorplan', 'memoria', 'evidencia', floorPlan.importMetadata.status ?? 'preliminary'],
      documentId: `dxf-import-${floorPlan.id}`,
      sectionRef: 'Revision CAD/DXF y gate de geometria',
      verificationStatus: floorPlan.importMetadata.status === 'final' ? 'reviewed' : 'draft',
    })
    : null;

  return [
    ...(dxfImportEvidence ? [dxfImportEvidence] : []),
    createEvidenceSource({
      id: 'ev-f75-floorplan',
      title: `FloorPlan RadShield-MX: ${floorPlan.name}`,
      url: `radshield://floorplan/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'El layout activo contiene geometria, fuentes y regiones suficientes para iniciar memoria analitica.',
      excerpt: `${snapshot.barriers} barreras, ${snapshot.sources} fuentes, ${snapshot.regions} regiones, escala ${floorPlan.scale_m_per_pixel} m/px.`,
      notes: 'Evidencia local generada desde el estado activo del canvas. Verificar contra planos arquitectonicos importados antes de firma regulatoria.',
      confidence: snapshot.barriers > 0 && snapshot.sources > 0 ? 'high' : 'medium',
      tags: ['F75', 'F76', 'floorplan', 'canvas', 'memoria'],
      documentId: `floorplan-${floorPlan.id}`,
      sectionRef: 'Canvas floorplan geometry snapshot',
      verificationStatus: snapshot.barriers > 0 && snapshot.sources > 0 ? 'reviewed' : 'draft',
    }),
    createEvidenceSource({
      id: 'ev-f75-calculation-results',
      title: 'Resultados de calculo de blindaje en canvas',
      url: `radshield://calculation/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'El motor de calculo produjo resultados y lineas de muestreo trazables para barreras del plano.',
      excerpt: `${snapshot.results} resultados, ${snapshot.sampleLines} lineas 0.3m, ${snapshot.samplePoints} puntos, espesor maximo ${snapshot.maxThickness.toFixed(1)} mm.`,
      notes: 'Usar junto con NCRP/AAPM/IAEA aplicable y revisar barreras sin resultado antes de emitir memoria final.',
      confidence: snapshot.results > 0 ? 'high' : 'medium',
      tags: ['F75', 'F76', 'calculo', 'blindaje', '0.3m'],
      documentId: `calculation-${floorPlan.id}`,
      sectionRef: 'Canvas shielding calculation results',
      verificationStatus: snapshot.results > 0 ? 'reviewed' : 'draft',
    }),
    createEvidenceSource({
      id: 'ev-f75-standard-routing',
      title: 'Ruteo normativo por modalidad',
      url: 'radshield://standards/routing',
      sourceType: 'standard',
      capturedAt: generatedAt,
      claim: 'Las fuentes del plano conservan modalidad/estandar para documentar el metodo de calculo.',
      excerpt: `Estandares/modalidades detectadas: ${snapshot.standards.join(', ') || 'sin fuentes'}.`,
      notes: 'Confirmar criterio final contra NCRP 147, NCRP 151, TG-108, IAEA/OIEA o CNSNS segun modalidad del proyecto.',
      confidence: snapshot.standards.length > 0 ? 'high' : 'medium',
      tags: ['F75', 'F76', 'NCRP', 'AAPM', 'IAEA', 'CNSNS'],
      documentId: `standards-routing-${floorPlan.id}`,
      sectionRef: 'Modality standards routing',
      verificationStatus: snapshot.standards.length > 0 ? 'reviewed' : 'draft',
    }),
    createEvidenceSource({
      id: 'ev-f86-canvas-qa',
      title: 'Canvas QA F86: puntos criticos y presets de blindaje',
      url: `radshield://canvas-qa/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'El canvas conserva puntos criticos y presets de blindaje trazables para auditoria y memoria analitica.',
      excerpt: `${f86Evidence.criticalPoints} puntos criticos, ${f86Evidence.presetBarriers} barreras con preset (${f86Evidence.presetCoveragePct}%). Presets: ${f86Evidence.presetNames.join(', ') || 'sin presets'}.`,
      notes: 'Los presets F86 son preconfiguraciones de QA; el calculo final debe validarse contra NCRP/AAPM/IAEA/CNSNS y resultados del motor de blindaje.',
      confidence: f86Evidence.readyForEvidence ? 'high' : 'medium',
      tags: ['F86', 'canvas-qa', 'critical-points', 'shielding-presets', 'memoria'],
      documentId: `canvas-qa-${floorPlan.id}`,
      sectionRef: 'F86 canvas QA snapshot',
      verificationStatus: f86Evidence.readyForEvidence ? 'reviewed' : 'draft',
    }),
    createEvidenceSource({
      id: 'ev-f125-calculation-memory-evidence-gate',
      title: 'F125 gate calculo-memoria-evidencia por resultado',
      url: `radshield://calculation-evidence-gate/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'Cada resultado de calculo debe conservar formula, norma, entradas, salidas, cita, evidencia y estado QA antes de emitir memoria o reporte final.',
      excerpt: `${f125Gate.resultCount} resultados auditables; ${f125Gate.completeCount} completos; ${f125Gate.reviewRequiredCount} requieren revision; ${f125Gate.missingResultCount} sin resultado valido.`,
      notes: 'F125 no sustituye la revision del fisico medico ni la cita paginada final; obliga el contrato minimo de trazabilidad por resultado.',
      confidence: f125Gate.completeCount === f125Gate.resultCount && f125Gate.resultCount > 0 ? 'high' : 'medium',
      tags: ['F125', 'calculo', 'memoria', 'evidencia', 'QA'],
      documentId: `f125-${floorPlan.id}`,
      sectionRef: 'F125 calculation-memory evidence gate',
      verificationStatus: f125Gate.reviewRequiredCount === 0 && f125Gate.missingResultCount === 0 && f125Gate.resultCount > 0 ? 'reviewed' : 'draft',
    }),
    createEvidenceSource({
      id: 'ev-f409-output-surface-integration',
      title: 'F409 integracion de salidas F405-F408',
      url: `radshield://output-surface-integration/${floorPlan.id}`,
      sourceType: 'technicalReport',
      capturedAt: generatedAt,
      claim: 'Memoria IA, Evidence Pack, PDF/heatmap y Medical 3D reciben el mismo bundle trazable de calculo, evidencia visual y escena externa.',
      excerpt: `${f409OutputIntegration.status}; superficies listas ${f409OutputIntegration.readyCount}; revision ${f409OutputIntegration.reviewCount}; bloqueadas ${f409OutputIntegration.blockedCount}; F405 ${f409OutputIntegration.traceability.status}; F407 ${f409OutputIntegration.heatmap.status}; F408 ${f409OutputIntegration.unity.status}.`,
      notes: f409OutputIntegration.decision,
      confidence: f409OutputIntegration.status === 'output-surfaces-integrated' ? 'high' : 'medium',
      tags: ['F409', 'F405', 'F407', 'F408', 'Memoria IA', 'Evidence Pack', 'Medical 3D'],
      documentId: `f409-${floorPlan.id}`,
      sectionRef: 'F409 output surface integration',
      verificationStatus: f409OutputIntegration.blockedCount === 0 ? 'reviewed' : 'draft',
    }),
  ];
}

export function buildAnalyticMemoryEvidenceSection(
  floorPlan: FloorPlan | undefined,
  barrierResults: CanvasBarrierResult[] = [],
  sampleLines: CanvasSampleLine[] = [],
): string {
  if (!floorPlan) return '';
  const snapshot = buildAnalyticMemorySnapshot(floorPlan, barrierResults, sampleLines);
  const sources = createFloorPlanEvidenceSources(floorPlan, barrierResults, sampleLines);
  const f409OutputIntegration = buildF409OutputSurfaceIntegration(floorPlan, barrierResults, sampleLines);
  return `
7. EVIDENCIA TRAZABLE DEL CANVAS (F76)
   Proyecto activo: ${floorPlan.name}
   Barreras: ${snapshot.barriers}
   Fuentes: ${snapshot.sources}
   Regiones/Zonas: ${snapshot.regions}
   Resultados de calculo: ${snapshot.results}
   Lineas de muestreo 0.3 m: ${snapshot.sampleLines}
   Puntos de muestreo: ${snapshot.samplePoints}
   Puntos criticos F86: ${snapshot.criticalPoints}
   Barreras con preset F86: ${snapshot.presetBarriers} (${snapshot.presetCoveragePct}%)
   Espesor maximo registrado: ${snapshot.maxThickness.toFixed(1)} mm
   Estandares/modalidades detectadas: ${snapshot.standards.join(', ') || 'sin fuentes'}

   Fuentes internas del Evidence Pack:
${sources.map(source => `   - ${source.title}: ${source.claim}`).join('\n')}

   Nota QA: esta seccion proviene del estado vivo del canvas y del Evidence Pack.
   Debe revisarse contra planos firmados, documentos NCRP/AAPM/IAEA/CNSNS y criterios del fisico medico responsable antes de emitir version final.

${buildF125CalculationEvidenceSection(floorPlan, barrierResults, sampleLines)}

7.4 INTEGRACION DE SALIDAS F409 / F405-F408
${formatF409OutputSurfaceIntegrationText(f409OutputIntegration)}

${buildF126ReleaseEvidenceSection(sources)}
`;
}
