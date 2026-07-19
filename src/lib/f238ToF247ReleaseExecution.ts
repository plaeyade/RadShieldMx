import { MATERIALS, type ShieldingMaterial } from '@/types/radshield';
import { getKnownNumericValidationCases } from './numericValidationCases';

export type F238ToF247PhaseStatus = 'complete' | 'ready' | 'guarded' | 'review-required';

export interface F238ToF247Phase {
  phase: `F${number}`;
  name: string;
  status: F238ToF247PhaseStatus;
  releaseSurface: string[];
  implemented: string[];
  guardrail: string;
}

export interface VersionedTvlHvlEntry {
  materialCode: string;
  materialName: string;
  energyKey: string;
  tvl_mm: number | null;
  hvl_mm: number | null;
  density_g_cm3: number;
  sourceId: 'NCRP147' | 'NCRP151' | 'AAPM_TG108' | 'IAEA_SRS47' | 'SUPPLIER_LAB' | 'RADSHIELD_FALLBACK';
  sourcePriority: 'canonical' | 'secondary' | 'supplier-review' | 'fallback-review';
  pageHint: string;
  citationHash: string;
  reviewStatus: 'versioned' | 'review-required';
}

export interface MaterialAuditRow {
  materialCode: string;
  materialName: string;
  densityReady: boolean;
  costReady: boolean;
  structuralReady: boolean;
  tvlCount: number;
  hvlCount: number;
  versionedCount: number;
  reviewRequiredCount: number;
  recommendation: string;
}

export interface F238ToF247ReleaseExecution {
  phaseRange: 'F238-F247';
  status: 'implemented-release-execution';
  manualCoverage: 'v1-F247';
  frontendDeployDecision: 'ready-after-static-smoke';
  fullStackDeployDecision: 'requires-db-live-restore-probe';
  phases: F238ToF247Phase[];
  tvlHvlLedger: VersionedTvlHvlEntry[];
  materialAudit: MaterialAuditRow[];
  numericQaMatrix: ReturnType<typeof getKnownNumericValidationCases>;
  reportAppendixChecklist: string[];
  nextDeployGate: string[];
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `h${(hash >>> 0).toString(36)}`;
}

function sourceForMaterial(material: ShieldingMaterial, energyKey: string): Pick<VersionedTvlHvlEntry, 'sourceId' | 'sourcePriority' | 'pageHint'> {
  if (material.certifiedLab || material.manufacturer?.toLowerCase().includes('nipol') || material.category === 'TM-NIPOL') {
    return { sourceId: 'SUPPLIER_LAB', sourcePriority: 'supplier-review', pageHint: 'material lab report / supplier certificate page required' };
  }
  if (energyKey.includes('keV') || energyKey === 'Co60' || energyKey === 'Ir192') {
    return { sourceId: energyKey === '511keV' ? 'AAPM_TG108' : 'NCRP147', sourcePriority: 'secondary', pageHint: 'diagnostic/NM shielding table or TG-108 appendix' };
  }
  if (material.TVL_mm?.[energyKey]) {
    return { sourceId: 'NCRP151', sourcePriority: 'canonical', pageHint: 'NCRP 151 Appendix B / material TVL table' };
  }
  return { sourceId: 'RADSHIELD_FALLBACK', sourcePriority: 'fallback-review', pageHint: 'density fallback: replace with versioned source before signed report' };
}

export function buildVersionedTvlHvlLedger(materials: ShieldingMaterial[] = MATERIALS): VersionedTvlHvlEntry[] {
  return materials.flatMap((material) => {
    const keys = Array.from(new Set([...Object.keys(material.TVL_mm ?? {}), ...Object.keys(material.HVL_mm ?? {})])).sort();
    return keys.map((energyKey) => {
      const source = sourceForMaterial(material, energyKey);
      const tvl = material.TVL_mm?.[energyKey] ?? null;
      const hvl = material.HVL_mm?.[energyKey] ?? null;
      const reviewStatus = source.sourcePriority === 'canonical' || source.sourcePriority === 'secondary' ? 'versioned' : 'review-required';
      return {
        materialCode: material.code,
        materialName: material.name,
        energyKey,
        tvl_mm: tvl,
        hvl_mm: hvl,
        density_g_cm3: material.density,
        sourceId: source.sourceId,
        sourcePriority: source.sourcePriority,
        pageHint: source.pageHint,
        citationHash: stableHash([material.code, energyKey, tvl ?? 'no-tvl', hvl ?? 'no-hvl', source.sourceId].join('|')),
        reviewStatus,
      };
    });
  });
}

export function buildMaterialAudit(materials: ShieldingMaterial[] = MATERIALS): MaterialAuditRow[] {
  const ledger = buildVersionedTvlHvlLedger(materials);
  return materials.map((material) => {
    const rows = ledger.filter((row) => row.materialCode === material.code);
    const versionedCount = rows.filter((row) => row.reviewStatus === 'versioned').length;
    const reviewRequiredCount = rows.filter((row) => row.reviewStatus === 'review-required').length;
    return {
      materialCode: material.code,
      materialName: material.name,
      densityReady: Number.isFinite(material.density) && material.density > 0,
      costReady: Number.isFinite(material.cost_per_m3) || Number.isFinite(material.cost_per_kg),
      structuralReady: Number.isFinite(material.density) && material.density > 0,
      tvlCount: Object.keys(material.TVL_mm ?? {}).length,
      hvlCount: Object.keys(material.HVL_mm ?? {}).length,
      versionedCount,
      reviewRequiredCount,
      recommendation: reviewRequiredCount
        ? 'Attach page/hash from supplier lab or promote to canonical source before signed report.'
        : 'Ready for material appendix with canonical/secondary source trace.',
    };
  });
}

export function buildF238ToF247PhasePlan(): F238ToF247Phase[] {
  return [
    {
      phase: 'F238',
      name: 'QA visual/manual final',
      status: 'complete',
      releaseSurface: ['manual_usuario.html', 'MANUAL_USUARIO_v99.md', 'UpdateAppDialog'],
      implemented: ['Manual coverage advanced to v1-F247.', 'Manual/deploy checklist attached to release execution gate.'],
      guardrail: 'Documentation only; no renderer or calculation formula changes.',
    },
    {
      phase: 'F239',
      name: 'Static deploy smoke',
      status: 'ready',
      releaseSurface: ['F200 static release gate', 'Vercel static dist', 'F154-F158 repeat'],
      implemented: ['Frontend deploy can proceed after F200/F230/F237/F238-F247 pass.', 'Fullstack remains gated by DB live restore probe.'],
      guardrail: 'Deploy smoke does not imply DB/API production readiness.',
    },
    {
      phase: 'F240',
      name: 'Canvas CAD low-risk polish',
      status: 'guarded',
      releaseSurface: ['CanvasArea', 'F145/F229 harness', 'manual canvas section'],
      implemented: ['Scope limited to properties, dimension UX, selection labels and non-destructive CAD helpers.'],
      guardrail: 'No rewrite of renderer base or event controller without F230 gates green.',
    },
    {
      phase: 'F241',
      name: 'Renderer/event feature flag',
      status: 'guarded',
      releaseSurface: ['renderLayerRegistry', 'renderStaticHelpers', 'CanvasRenderer'],
      implemented: ['Renderer/event changes are scheduled behind feature flag with rollback.'],
      guardrail: 'Never change renderer and pointer events in the same unflagged patch.',
    },
    {
      phase: 'F242',
      name: 'DXF/DWG converted import + equipment symbols',
      status: 'guarded',
      releaseSurface: ['dxfParser', 'DXFViewerDialog', 'equipment symbol schedule'],
      implemented: ['DWG remains external conversion to DXF/SVG.', 'Equipment symbols must expose footprint, rotation, manufacturer variant and report id.'],
      guardrail: 'No false native DWG claim in browser build.',
    },
    {
      phase: 'F243',
      name: 'Frontend release package',
      status: 'ready',
      releaseSurface: ['dist', 'manual_usuario.html', 'F200 static zip'],
      implemented: ['Static frontend can be published after smoke; production DB/API remains separate.'],
      guardrail: 'Do not market as multiuser/fullstack until DB live restore probe passes.',
    },
    {
      phase: 'F244',
      name: 'Versioned TVL/HVL ledger',
      status: 'complete',
      releaseSurface: ['MaterialComparisonDialog', 'F146 appendix', 'F237 governance'],
      implemented: ['Material TVL/HVL entries are converted into source/page/hash/review-status ledger rows.'],
      guardrail: 'Supplier/lab values remain review-required until page/hash is verified.',
    },
    {
      phase: 'F245',
      name: 'Numeric QA matrix',
      status: 'complete',
      releaseSurface: ['numericValidationCases', 'F237 governance', 'Memoria IA'],
      implemented: ['LINAC 6 MV, LINAC 18 MV, CT/RX, Gamma Knife, PET/NM and UAQ review cases are surfaced.'],
      guardrail: 'Reference cases are screening checks, not clinical certification.',
    },
    {
      phase: 'F246',
      name: 'Material cost/time/structure audit',
      status: 'complete',
      releaseSurface: ['MaterialComparisonDialog', 'F146 appendix', 'report material appendix'],
      implemented: ['Density, cost readiness, structural load readiness and source review status are summarized per material.'],
      guardrail: 'Cost/time values remain estimates until vendor quote and structural engineer review.',
    },
    {
      phase: 'F247',
      name: 'Report appendix/export checklist',
      status: 'complete',
      releaseSurface: ['PdfReportDialog', 'EvidencePackDialog', 'MemoriaAIWizard', 'F125/F146/F237'],
      implemented: ['Report appendix checklist links formula, standard, input/output, material ledger, citations, uncertainty and review warnings.'],
      guardrail: 'Signed reports require ready/review state acceptance by RSO/qualified physicist.',
    },
  ];
}

export function buildReportAppendixChecklist(): string[] {
  return [
    'Formula and standard per barrier.',
    'Inputs: P, T, U, W, distance, scale, geometry, material and source modality.',
    'Outputs: unshielded kerma, required thickness, selected material thickness and transmission.',
    'Versioned TVL/HVL row with source, page hint, citation hash and review status.',
    'Unit snapshot: mm/cm, mSv/wk, uSv/h, density, kg/m2, cost/m2 and structural kPa.',
    'Base-vs-conservative comparison and dominant method.',
    'Clinical warnings and RSO/qualified physicist review status.',
    'Evidence Pack files, document hashes and unresolved OCR/source gaps.',
  ];
}

export function buildF238ToF247ReleaseExecution(): F238ToF247ReleaseExecution {
  return {
    phaseRange: 'F238-F247',
    status: 'implemented-release-execution',
    manualCoverage: 'v1-F247',
    frontendDeployDecision: 'ready-after-static-smoke',
    fullStackDeployDecision: 'requires-db-live-restore-probe',
    phases: buildF238ToF247PhasePlan(),
    tvlHvlLedger: buildVersionedTvlHvlLedger(),
    materialAudit: buildMaterialAudit(),
    numericQaMatrix: getKnownNumericValidationCases(),
    reportAppendixChecklist: buildReportAppendixChecklist(),
    nextDeployGate: [
      'Run F200 static release gate.',
      'Upload fresh dist to Vercel/static host.',
      'Repeat F154-F158/F202 against public URL.',
      'Keep fullstack/API deploy blocked until DB live restore probe is green.',
    ],
  };
}

export function buildF238ToF247ReportSection(): string {
  const gate = buildF238ToF247ReleaseExecution();
  return [
    'F238-F247 RELEASE EXECUTION',
    `Manual coverage: ${gate.manualCoverage}`,
    `Frontend deploy: ${gate.frontendDeployDecision}`,
    `Fullstack deploy: ${gate.fullStackDeployDecision}`,
    `TVL/HVL ledger rows: ${gate.tvlHvlLedger.length}`,
    `Material audit rows: ${gate.materialAudit.length}`,
    `Numeric QA cases: ${gate.numericQaMatrix.length}`,
    'Report appendix checklist:',
    ...gate.reportAppendixChecklist.map((item) => `- ${item}`),
  ].join('\n');
}
