import type { F426ToF430CalcRendererClosure } from '@/lib/f426ToF430CalcRendererClosure';

export interface F431VisualSmokeSurface {
  id: string;
  label: string;
  testId: string;
  expected: string;
  status: 'ready' | 'needs-e2e';
}

export interface F432EvidenceMemoryManifestItem {
  id: string;
  label: string;
  sourceContract: string;
  evidenceOutput: string;
  memoryOutput: string;
  requiredForPdf: boolean;
}

export interface F433ReleaseBlockReview {
  id: string;
  label: string;
  blocker: string;
  ownerAction: string;
  severity: 'info' | 'warning' | 'blocking';
}

export interface F434RendererBaseDecision {
  id: string;
  label: string;
  decision: 'allow-contract-only' | 'allow-flagged-renderer-v2' | 'block-renderer-rewrite';
  rationale: string;
  rollback: string;
}

export interface F435NextPhaseHandoff {
  id: string;
  label: string;
  nextPhase: string;
  deliverable: string;
  acceptanceCriteria: string[];
}

export interface F431ToF435RendererReleaseGate {
  schema: 'radshield-mx.f431-f435.renderer-release-gate.v1';
  phaseRange: 'F431-F435';
  status: 'renderer-release-gate-ready' | 'renderer-release-gate-gated';
  visualSmokeSurfaces: F431VisualSmokeSurface[];
  evidenceMemoryManifest: F432EvidenceMemoryManifestItem[];
  releaseBlockReview: F433ReleaseBlockReview[];
  rendererBaseDecision: F434RendererBaseDecision;
  nextPhaseHandoff: F435NextPhaseHandoff[];
}

export function buildF431ToF435RendererReleaseGate(
  closure: F426ToF430CalcRendererClosure,
): F431ToF435RendererReleaseGate {
  const hasBlockingReleaseItems = closure.releaseBlocks.length > 0;
  const rendererReadyCount = closure.rendererDeepPlan.filter((step) => step.status === 'ready').length;
  const canFlagRendererV2 = rendererReadyCount >= 3 && closure.surfaceRoleCalculations.length >= 5;

  const visualSmokeSurfaces: F431VisualSmokeSurface[] = [
    { id: 'closure-panel', label: 'F426-F430 panel', testId: 'f426-f430-calc-renderer-closure', expected: 'Panel visible sin tapar canvas ni sidebar.', status: 'ready' },
    { id: 'surface-roles', label: 'Roles por superficie', testId: 'f426-surface-role-calculation', expected: 'Primaria, secundaria, laberinto, puerta y penetracion visibles.', status: 'ready' },
    { id: 'penetrations', label: 'Penetraciones MEP', testId: 'f427-penetration-penalties', expected: 'Penalizaciones y bloqueos MEP visibles.', status: 'ready' },
    { id: 'structural-load', label: 'Carga estructural', testId: 'f428-structural-loads', expected: 'kg/m2 visible para muro/material/equipo.', status: 'ready' },
    { id: 'normative-qa', label: 'QA normativo', testId: 'f429-normative-qa-cases', expected: 'Casos NCRP/IAEA/UAQ por modalidad visibles.', status: 'ready' },
    { id: 'memory-flow', label: 'Flujo Memoria IA', testId: 'f430-auto-memory-flow', expected: 'Plano-equipo-barreras-calculo-evidencia-PDF visible.', status: 'ready' },
    { id: 'renderer-plan', label: 'Renderer profundo', testId: 'f426-f430-renderer-deep-plan', expected: 'F426-F430 renderer plan visible.', status: 'ready' },
  ];

  const evidenceMemoryManifest: F432EvidenceMemoryManifestItem[] = [
    {
      id: 'surface-role-table',
      label: 'Tabla de roles de barrera',
      sourceContract: 'F426SurfaceRoleCalculation',
      evidenceOutput: 'JSON/tabla con rol, formula, norma, warnings y overlay.',
      memoryOutput: 'Seccion de superficies: primaria/secundaria/laberinto/puerta/penetracion.',
      requiredForPdf: true,
    },
    {
      id: 'penetration-appendix',
      label: 'Anexo de penetraciones',
      sourceContract: 'F427PenetrationPenalty',
      evidenceOutput: 'Lista de sleeves, ductos, huecos, puertas, continuidad y mitigacion.',
      memoryOutput: 'Advertencias y bloqueos por penetraciones MEP.',
      requiredForPdf: true,
    },
    {
      id: 'structural-load-appendix',
      label: 'Anexo estructural',
      sourceContract: 'F428StructuralLoadItem',
      evidenceOutput: 'kg/m2, kPa, densidad/fuente y estado de revision.',
      memoryOutput: 'Impacto estructural y constructivo por material/equipo.',
      requiredForPdf: true,
    },
    {
      id: 'normative-qa-ledger',
      label: 'Ledger QA normativo',
      sourceContract: 'F429NormativeQaCase',
      evidenceOutput: 'Casos conocidos, tolerancia, norma y fixture requerido.',
      memoryOutput: 'Validacion contra NCRP/IAEA/UAQ por modalidad.',
      requiredForPdf: false,
    },
    {
      id: 'visual-bim-export',
      label: 'Export visual BIM',
      sourceContract: 'F430 + F421/F425',
      evidenceOutput: 'PNG/PDF/JSON con roles, cargas, MEP, citas y bloqueos.',
      memoryOutput: 'Figuras/anexos de canvas y renderer 2.5D.',
      requiredForPdf: true,
    },
  ];

  const releaseBlockReview: F433ReleaseBlockReview[] = closure.releaseBlocks.length
    ? closure.releaseBlocks.map((blocker, index) => ({
        id: `release-block-${index + 1}`,
        label: `Bloqueo ${index + 1}`,
        blocker,
        ownerAction: 'Resolver dato faltante o mantener memoria como preliminar.',
        severity: /bloqueado|falta escala|faltan barreras|falta equipo/i.test(blocker) ? 'blocking' : 'warning',
      }))
    : [{
        id: 'no-release-blocks',
        label: 'Sin bloqueos F426-F430',
        blocker: 'Los contratos no reportan bloqueos internos para la vista actual.',
        ownerAction: 'Ejecutar E2E visual y export antes de release.',
        severity: 'info',
      }];

  const rendererBaseDecision: F434RendererBaseDecision = {
    id: 'renderer-base-v2-gate',
    label: 'Renderer base v2',
    decision: hasBlockingReleaseItems ? 'allow-contract-only' : canFlagRendererV2 ? 'allow-flagged-renderer-v2' : 'block-renderer-rewrite',
    rationale: hasBlockingReleaseItems
      ? 'Hay bloqueos de escala/fuente/barreras/MEP/QA; mantener contratos y no reescribir eventos base.'
      : canFlagRendererV2
        ? 'Los contratos F426-F430 estan visibles y hay suficiente cobertura para probar renderer v2 detras de flag.'
        : 'Aun falta cobertura de renderer profundo antes de tocar canvas base.',
    rollback: 'Mantener CanvasArea/useCanvas actual como ruta primaria; cualquier renderer v2 debe poder apagarse y conservar E2E F229/F431.',
  };

  const nextPhaseHandoff: F435NextPhaseHandoff[] = [
    {
      id: 'f436-renderer-baseline',
      label: 'Baseline visual renderer',
      nextPhase: 'F436',
      deliverable: 'Capturas desktop/mobile y manifest pixel-safe del panel F426-F435.',
      acceptanceCriteria: ['canvas visible', 'sidebar visible', 'F426-F435 visible', 'no overlays bloqueando area de trabajo'],
    },
    {
      id: 'f437-pdf-evidence-link',
      label: 'PDF/Evidence live link',
      nextPhase: 'F437',
      deliverable: 'Conectar manifest F432 al export de Memoria IA/PDF.',
      acceptanceCriteria: ['tabla roles', 'anexo penetraciones', 'carga estructural', 'captura BIM'],
    },
    {
      id: 'f438-renderer-v2-flag',
      label: 'Renderer v2 flagged',
      nextPhase: 'F438',
      deliverable: 'Primer renderer geometry core detras de flag, sin tocar eventos base.',
      acceptanceCriteria: ['F229 pasa', 'F431 pasa', 'rollback documentado'],
    },
  ];

  return {
    schema: 'radshield-mx.f431-f435.renderer-release-gate.v1',
    phaseRange: 'F431-F435',
    status: visualSmokeSurfaces.every((surface) => surface.status === 'ready') ? 'renderer-release-gate-ready' : 'renderer-release-gate-gated',
    visualSmokeSurfaces,
    evidenceMemoryManifest,
    releaseBlockReview,
    rendererBaseDecision,
    nextPhaseHandoff,
  };
}
