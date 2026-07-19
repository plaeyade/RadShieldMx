export type F248ToF250Status = 'ready' | 'guarded' | 'blocked';

export interface HighRiskCadImprovement {
  id: string;
  title: string;
  risk: 'high';
  whyRisky: string;
  applyWhen: string;
  requiredGates: string[];
}

export interface F248ToF250Gate {
  phase: 'F248' | 'F249' | 'F250';
  name: string;
  status: F248ToF250Status;
  purpose: string;
  evidence: string[];
  blockers: string[];
  nextAction: string;
}

export interface F248ToF250ReleaseCandidate {
  phaseRange: 'F248-F250';
  status: 'static-frontend-release-candidate' | 'fullstack-release-gated';
  publicUrl: string;
  staticFrontendDecision: 'go-after-public-smoke';
  fullStackDecision: 'blocked-until-db-restore-probe';
  highRiskCadImprovements: HighRiskCadImprovement[];
  gates: F248ToF250Gate[];
  releaseChecklist: string[];
}

export function getHighRiskCadImprovements(): HighRiskCadImprovement[] {
  return [
    {
      id: 'cad-renderer-event-rewrite',
      title: 'Renderer base + pointer/event controller rewrite',
      risk: 'high',
      whyRisky: 'Puede romper seleccion, canvas visible, sidebar, toolbar, drag/drop, DXF y smoke F197/F229 si entra sin feature flag.',
      applyWhen: 'Despues de F250, en rama/flag experimental, con baseline visual F231 y E2E F229 antes y despues.',
      requiredGates: ['F197', 'F207', 'F229', 'F231-F236', 'F200', 'pixel-diff desktop/mobile'],
    },
    {
      id: 'cad-native-dwg',
      title: 'DWG nativo en navegador',
      risk: 'high',
      whyRisky: 'DWG requiere conversion/licencia/servicio externo; prometerlo nativo puede bloquear deploy estatico y romper importacion DXF estable.',
      applyWhen: 'Post-release, como integracion externa DWG->DXF/SVG/IFC con cola, auditoria y fallback manual.',
      requiredGates: ['fixture DWG convertido', 'DXF layer mapping', 'security scan de archivos', 'timeout/retry', 'manual de limites'],
    },
    {
      id: 'cad-real-time-3d-sync',
      title: 'Sincronizacion 2D/3D en tiempo real',
      risk: 'high',
      whyRisky: 'Afecta geometria, espesores, zonas controladas, equipos, estados de seleccion y export visual al mismo tiempo.',
      applyWhen: 'Despues de publicar frontend estable; primero snapshot 2D->3D unidireccional, luego sync bidireccional con versionado.',
      requiredGates: ['F235 handoff', '3D snapshot export', 'geometry hash', 'undo/redo sync', 'visual regression'],
    },
    {
      id: 'cad-boolean-geometry-engine',
      title: 'Operaciones booleanas/CAD solidas para muros, puertas y penetraciones',
      risk: 'high',
      whyRisky: 'Puede cambiar areas, distancias, espesores calculados y memoria analitica si la geometria no conserva escala y unidades.',
      applyWhen: 'Post-F250 con motor geometrico aislado, pruebas unitarias de interseccion y comparacion contra planos conocidos.',
      requiredGates: ['unitNormalization', 'geometry fixtures', 'known floorplans', 'calculation hash invalidation', 'RSO review warning'],
    },
    {
      id: 'cad-gpu-heatmap-isocontours',
      title: 'Heatmaps/isocontornos GPU o WebGL numericos',
      risk: 'high',
      whyRisky: 'La visualizacion puede verse correcta pero no coincidir con el motor numerico, o degradar equipos sin WebGL estable.',
      applyWhen: 'Despues de RC; mantener CPU/reference mode y comparar pixel/valores antes de habilitarlo por defecto.',
      requiredGates: ['numeric reference grid', 'legend regulatory thresholds', 'export image QA', 'fallback CPU', 'mobile smoke'],
    },
  ];
}

export function buildF248ToF250ReleaseCandidate(publicUrl = 'https://radshield-mx-static-dist.vercel.app/'): F248ToF250ReleaseCandidate {
  const normalizedUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
  return {
    phaseRange: 'F248-F250',
    status: 'static-frontend-release-candidate',
    publicUrl: normalizedUrl,
    staticFrontendDecision: 'go-after-public-smoke',
    fullStackDecision: 'blocked-until-db-restore-probe',
    highRiskCadImprovements: getHighRiskCadImprovements(),
    gates: [
      {
        phase: 'F248',
        name: 'Public/static URL smoke',
        status: 'ready',
        purpose: 'Repetir F200/F202 contra la URL publica final y confirmar shell, sidebar, canvas, toolbar, menus y salidas criticas.',
        evidence: ['outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json', 'outputs/f202_public_vercel_smoke_result.json'],
        blockers: ['network-gated smoke debe validarse manualmente desde navegador con red abierta', 'URL publica debe servir HTTPS y SPA fallback'],
        nextAction: 'Subir dist actual a Vercel/static host y correr F202 o checklist manual F203.',
      },
      {
        phase: 'F249',
        name: 'DB/fullstack release decision',
        status: 'guarded',
        purpose: 'Separar frontend estable de fullstack real; API/DB/RAG quedan condicionados a restore probe, secretos y persistencia.',
        evidence: ['outputs/f153_db_backup_restore/f153_db_backup_restore.json', 'outputs/f168_db_live_finalization/f168_db_live_finalization.json'],
        blockers: ['DB live restore probe requerido', 'DATABASE_URL/secretos productivos requeridos', 'RAG/documentos privados no deben ir al host estatico'],
        nextAction: 'Ejecutar restore probe real y smoke backend antes de declarar producto multiusuario.',
      },
      {
        phase: 'F250',
        name: 'Release candidate final',
        status: 'ready',
        purpose: 'Congelar alcance, documentar no-go fullstack, dejar manual F250 y checklist final para deploy estatico.',
        evidence: ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'public/manual_usuario.html'],
        blockers: ['no introducir mejoras CAD de alto riesgo antes del smoke publico', 'no cambiar renderer/eventos sin rama/flag y E2E'],
        nextAction: 'Publicar frontend estatico validado; abrir siguiente ciclo para CAD alto riesgo/DB fullstack.',
      },
    ],
    releaseChecklist: [
      'Build Vite limpio y paquete dist actualizado.',
      'F200/F238-F247/F248-F250 contracts verdes.',
      'Manual HTML muestra cobertura v1-F250.',
      'Update Center contiene F248-F250.',
      'URL publica validada por F202 o F203 manual si Codex no tiene red.',
      'Fullstack no se declara listo hasta DB restore probe real.',
      'Mejoras CAD de alto riesgo quedan post-RC con feature flag y rollback.',
    ],
  };
}

export function buildF248ToF250ReportSection(publicUrl?: string): string {
  const release = buildF248ToF250ReleaseCandidate(publicUrl);
  return [
    'F248-F250 RELEASE CANDIDATE',
    `Public URL: ${release.publicUrl}`,
    `Static frontend: ${release.staticFrontendDecision}`,
    `Fullstack: ${release.fullStackDecision}`,
    'High-risk CAD improvements deferred:',
    ...release.highRiskCadImprovements.map((item) => `- ${item.title}: ${item.applyWhen}`),
    'Release checklist:',
    ...release.releaseChecklist.map((item) => `- ${item}`),
  ].join('\n');
}
