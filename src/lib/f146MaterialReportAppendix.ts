import { MATERIALS, type Barrier, type FloorPlan, type ShieldingMaterial } from '@/types/radshield';
import { buildF142MemoriaIaMaterialEvidence, type F142MaterialCitation } from '@/lib/f142MemoriaIaMaterialEvidence';

export interface F146MaterialAppendixRow {
  barrierId: string;
  barrierName: string;
  barrierType: Barrier['barrierType'];
  materialCode: string;
  materialName: string;
  category: string;
  thickness_mm: number;
  length_m: number;
  height_m: number;
  area_m2: number;
  volume_m3: number;
  density_g_cm3: number;
  weight_kg: number;
  estimatedCostUSD: number;
  tvlSummary: string;
  citationSource: string;
  citationPages: string;
  citationHash: string;
  evidenceStatus: 'normative-default' | 'review-required' | 'partial-ocr-review' | 'missing-material';
  uncertaintyNote: string;
  warnings: string[];
}

export interface F146MaterialReportAppendix {
  phase: 'F146';
  status: 'implemented-material-report-appendix';
  floorPlanName: string;
  rows: F146MaterialAppendixRow[];
  totals: {
    barriers: number;
    materials: string[];
    totalVolume_m3: number;
    totalWeight_kg: number;
    estimatedCostUSD: number;
    reviewRequired: number;
  };
  requiredReportSections: string[];
  exportWarnings: string[];
  decision: string;
}

const DEFAULT_HEIGHT_M = 3.1;

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeCode(code?: string) {
  return (code || 'CONCRETE235').trim().toUpperCase();
}

function findMaterial(code: string): ShieldingMaterial | undefined {
  const normalized = normalizeCode(code);
  return MATERIALS.find((material) => normalizeCode(material.code) === normalized);
}

function getBarrierThickness(barrier: Barrier, materialCode: string): number {
  if (barrier.shieldingLayers?.length) {
    const layer = barrier.shieldingLayers.find((item) => normalizeCode(item.materialCode) === normalizeCode(materialCode));
    if (layer?.thickness_mm) return layer.thickness_mm;
  }
  if (typeof barrier.requiredThickness_mm === 'number') return barrier.requiredThickness_mm;
  if (barrier.requiredThickness_mm && typeof barrier.requiredThickness_mm === 'object') {
    const direct = barrier.requiredThickness_mm[materialCode] ?? barrier.requiredThickness_mm[normalizeCode(materialCode)];
    if (typeof direct === 'number') return direct;
    const values = Object.values(barrier.requiredThickness_mm).filter((value): value is number => Number.isFinite(value));
    if (values.length) return Math.max(...values);
  }
  return barrier.thickness_mm || barrier.concreteEquivalent_mm || barrier.leadEquivalent_mm || 0;
}

function getBarrierLengthM(barrier: Barrier, scale: number): number {
  const dx = barrier.x2 - barrier.x1;
  const dy = barrier.y2 - barrier.y1;
  return Math.max(Math.sqrt(dx * dx + dy * dy) * scale, 0);
}

function materialTvlSummary(material?: ShieldingMaterial): string {
  if (!material) return 'Sin TVL registrado';
  const entries = Object.entries(material.TVL_mm || {}).slice(0, 5);
  if (!entries.length) return 'TVL no tabulado; requiere fuente externa o calculo fisico.';
  return entries.map(([energy, tvl]) => `${energy}:${tvl} mm`).join(' | ');
}

function citationForMaterial(material?: ShieldingMaterial, citations: F142MaterialCitation[] = []) {
  if (!material) return undefined;
  const text = `${material.code} ${material.name} ${material.category} ${material.manufacturer || ''}`.toLowerCase();
  if (text.includes('nipol') || text.includes('td-')) return citations.find((citation) => citation.source.includes('tmnipol')) || citations[0];
  if (text.includes('block') || text.includes('bloque')) return citations.find((citation) => citation.source.includes('bloques')) || citations[0];
  if (text.includes('scanpro')) return citations.find((citation) => citation.source.includes('scanpro')) || citations[0];
  return undefined;
}

function evidenceStatus(material?: ShieldingMaterial, citation?: F142MaterialCitation): F146MaterialAppendixRow['evidenceStatus'] {
  if (!material) return 'missing-material';
  if (citation?.warning) return 'partial-ocr-review';
  if (material.category === 'Convencional') return 'normative-default';
  return 'review-required';
}

function materialCodesForBarrier(barrier: Barrier): string[] {
  if (barrier.shieldingLayers?.length) return barrier.shieldingLayers.map((layer) => layer.materialCode);
  return [barrier.materialCode || barrier.material || 'CONCRETE235'];
}

export function buildF146MaterialReportAppendix(floorPlan?: FloorPlan): F146MaterialReportAppendix {
  const materialEvidence = buildF142MemoriaIaMaterialEvidence();
  const barriers = floorPlan?.barriers || [];
  const scale = floorPlan?.scale_m_per_pixel || 0.01;
  const rows = barriers.flatMap((barrier): F146MaterialAppendixRow[] => {
    const length_m = getBarrierLengthM(barrier, scale);
    return materialCodesForBarrier(barrier).map((materialCode) => {
      const material = findMaterial(materialCode);
      const citation = citationForMaterial(material, materialEvidence.citations);
      const thickness_mm = getBarrierThickness(barrier, materialCode);
      const height_m = DEFAULT_HEIGHT_M;
      const area_m2 = length_m * height_m;
      const volume_m3 = area_m2 * Math.max(thickness_mm, 0) / 1000;
      const density_g_cm3 = material?.density || 0;
      const weight_kg = volume_m3 * density_g_cm3 * 1000;
      const estimatedCostUSD = volume_m3 * (material?.cost_per_m3 || 0);
      const sourceText = citation
        ? `${citation.source}|${citation.title}|${citation.pages}|${citation.use}`
        : `${material?.code || materialCode}|${material?.name || 'unknown'}|builtin-materials`;
      const status = evidenceStatus(material, citation);
      const warnings = [
        ...(citation?.warning ? [citation.warning] : []),
        ...(status === 'review-required' ? ['Valor de material comercial/laboratorio requiere revision humana antes de promoverlo a constante controlada.'] : []),
        ...(status === 'missing-material' ? ['Material no encontrado en MATERIALS; no usar en reporte final sin alta documental.'] : []),
      ];

      return {
        barrierId: barrier.id,
        barrierName: barrier.name || barrier.id,
        barrierType: barrier.barrierType,
        materialCode,
        materialName: material?.name || materialCode,
        category: material?.category || 'desconocido',
        thickness_mm,
        length_m,
        height_m,
        area_m2,
        volume_m3,
        density_g_cm3,
        weight_kg,
        estimatedCostUSD,
        tvlSummary: materialTvlSummary(material),
        citationSource: citation?.source || 'MATERIALS builtin / normative defaults',
        citationPages: citation?.pages || 'N/A',
        citationHash: hashText(sourceText),
        evidenceStatus: status,
        uncertaintyNote: citation?.uncertaintyNote || 'Registrar incertidumbre si el valor proviene de ensayo, proveedor o tabla no normativa.',
        warnings,
      };
    });
  });

  const totalVolume_m3 = rows.reduce((sum, row) => sum + row.volume_m3, 0);
  const totalWeight_kg = rows.reduce((sum, row) => sum + row.weight_kg, 0);
  const estimatedCostUSD = rows.reduce((sum, row) => sum + row.estimatedCostUSD, 0);
  const materials = Array.from(new Set(rows.map((row) => row.materialCode)));
  const reviewRequired = rows.filter((row) => row.evidenceStatus !== 'normative-default').length;

  return {
    phase: 'F146',
    status: 'implemented-material-report-appendix',
    floorPlanName: floorPlan?.name || 'Sin plano activo',
    rows,
    totals: {
      barriers: barriers.length,
      materials,
      totalVolume_m3,
      totalWeight_kg,
      estimatedCostUSD,
      reviewRequired,
    },
    requiredReportSections: [
      'Tabla por barrera: material, espesor, TVL, densidad, peso, costo estimado y estado de evidencia.',
      'Notas de incertidumbre y OCR para valores de proveedor/laboratorio.',
      'Separacion explicita entre fuente normativa y evidencia de material comercial.',
      'Advertencia estructural cuando peso total o kg/m2 requiera revision de ingenieria.',
      'Hash documental por fuente/pagina para trazabilidad en Evidence Pack.',
    ],
    exportWarnings: [
      'F146 no cambia constantes de calculo ni valida automaticamente TVL comerciales.',
      'Los costos/pesos son estimaciones de reporte; deben verificarse contra cuantificacion ejecutiva.',
      'Materiales con evidenceStatus distinto de normative-default requieren firma/revision antes de dictamen final.',
    ],
    decision:
      'F146 integra la evidencia de materiales en reportes y Memoria IA con TVL, densidad, peso, costo, incertidumbre, fuente, pagina/hash y advertencias por barrera.',
  };
}

export function formatF146MaterialAppendixText(appendix: F146MaterialReportAppendix): string {
  const rows = appendix.rows.length
    ? appendix.rows.map((row) => [
        `- ${row.barrierName} (${row.barrierType})`,
        `${row.materialName} [${row.materialCode}]`,
        `espesor ${row.thickness_mm.toFixed(1)} mm`,
        `densidad ${row.density_g_cm3.toFixed(2)} g/cm3`,
        `peso ${row.weight_kg.toFixed(1)} kg`,
        `costo USD ${row.estimatedCostUSD.toFixed(0)}`,
        `TVL ${row.tvlSummary}`,
        `cita ${row.citationSource} ${row.citationPages} ${row.citationHash}`,
        `estado ${row.evidenceStatus}`,
      ].join(' | ')).join('\n')
    : '- Sin barreras/materiales activos en el plano.';

  return [
    'ANEXO F146 - MATERIALES, TVL, DENSIDAD, PESO E INCERTIDUMBRE',
    `Plano: ${appendix.floorPlanName}`,
    `Totales: ${appendix.totals.barriers} barreras | materiales ${appendix.totals.materials.join(', ') || 'N/A'} | volumen ${appendix.totals.totalVolume_m3.toFixed(3)} m3 | peso ${appendix.totals.totalWeight_kg.toFixed(1)} kg | costo USD ${appendix.totals.estimatedCostUSD.toFixed(0)} | revision ${appendix.totals.reviewRequired}`,
    rows,
    'Advertencias:',
    ...appendix.exportWarnings.map((warning) => `- ${warning}`),
  ].join('\n');
}
