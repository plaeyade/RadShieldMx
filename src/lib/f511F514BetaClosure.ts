export interface F511F514BetaClosure {
  schema: 'radshield-mx.beta-closure.f511-f514.v1';
  phaseRange: 'F511-F514';
  status: 'beta-closure-ready';
  phases: { phase: string; title: string; exitCriteria: string[] }[];
  requiredEvidence: string[];
  betaAllowedClaims: string[];
  betaBlockedClaims: string[];
  outputs: string[];
  nextPhase: string;
}

export function buildF511F514BetaClosure(): F511F514BetaClosure {
  return {
    schema: 'radshield-mx.beta-closure.f511-f514.v1',
    phaseRange: 'F511-F514',
    status: 'beta-closure-ready',
    phases: [
      {
        phase: 'F511',
        title: 'QA final beta',
        exitCriteria: [
          'F508-F510 DB-backed QA pass is present.',
          'dist/index.html is present and buildable.',
          'Manual HTML and Update Center include the current beta closure.',
          'Canvas/sidebar/menu checks are listed as post-deploy smoke requirements.',
        ],
      },
      {
        phase: 'F512',
        title: 'Paquete beta',
        exitCriteria: [
          'Static dist ZIP is generated with sha256.',
          'Manifest records git commit, build artifacts, DB QA evidence and manual paths.',
          'No secrets, DATABASE_URL or local DB dumps are copied into the ZIP.',
        ],
      },
      {
        phase: 'F513',
        title: 'Smoke publico',
        exitCriteria: [
          'Public URL smoke is configurable by PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL.',
          'If no URL is configured, the phase remains ready-for-url, not failed release code.',
          'Post-deploy checklist covers load, menus, canvas, manual, Update Center and calculation QA evidence.',
        ],
      },
      {
        phase: 'F514',
        title: 'Release beta',
        exitCriteria: [
          'Beta is explicitly non-certified for signed clinical use.',
          'Large renderer/Babylon/Unity changes are moved post-beta.',
          'Next work is user real-test feedback and focused blocker fixes.',
        ],
      },
    ],
    requiredEvidence: [
      'outputs/f508_f509_post_seed_qa/f508_f509_summary.md',
      'outputs/f510_diagnostic_pet_tvl_promotion/f510_summary.md',
      'dist/index.html',
      'public/manual_usuario.html',
      'CHANGELOG.md',
      'MANUAL_VERSIONES_v50.md',
      'MANUAL_USUARIO_v99.md',
    ],
    betaAllowedClaims: [
      'frontend beta estatico publicable',
      'DB-backed QA material pass F508-F510',
      'canvas/floorplan listo para prueba real de usuario',
      'Memoria IA preliminar con evidencia y advertencias',
      'manual y Update Center sincronizados con beta',
    ],
    betaBlockedClaims: [
      'memoria analitica firmada',
      'calculo clinico certificado',
      'dictamen final de proteccion radiologica',
      'Unity WebGL real sin build exportado validado',
      'Babylon como renderer principal sin QA profundo',
    ],
    outputs: [
      'f511_f514_beta_closure_manifest.json',
      'f511_f514_beta_closure_summary.md',
      'radshield-mx-f511-f514-beta.zip',
      'f513_post_deploy_smoke_checklist.csv',
    ],
    nextPhase: 'Post-beta: prueba real de usuario, fijar bloqueos criticos y planificar renderer profundo/Unity/Babylon en rama separada.',
  };
}
