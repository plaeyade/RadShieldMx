import { buildF135ReleaseCandidatePackage } from './f135ReleaseCandidatePackage';
import { buildF136ProductionDeployRehearsal } from './f136ProductionDeployRehearsal';
import { buildF137ProductionCutoverChecklist } from './f137ProductionCutoverChecklist';
import { buildF149NormativeNumericQa } from './f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility } from './f149bFastradClinicalUtility';
import { buildF149cMonteCarloGateway } from './f149cMonteCarloGateway';

export type F150GateStatus = 'pass' | 'warn' | 'block';
export type F150ReleaseDecision = 'controlled-rc-go-public-no-go' | 'blocked';

export interface F150ReleaseGate {
  id: string;
  label: string;
  status: F150GateStatus;
  evidence: string;
}

export interface F150ReleaseCandidateControlled {
  phase: 'F150';
  status: 'release-candidate-controlled';
  generatedAt: string;
  releaseName: string;
  decision: F150ReleaseDecision;
  goNoGo: string;
  gates: F150ReleaseGate[];
  acceptedScope: string[];
  deferredScope: string[];
  deliverables: string[];
  productionBlockers: string[];
  immediateNextSteps: string[];
  finalStatement: string;
}

export function buildF150ReleaseCandidateControlled(): F150ReleaseCandidateControlled {
  const f135 = buildF135ReleaseCandidatePackage('ready');
  const f136 = buildF136ProductionDeployRehearsal('ready');
  const f137 = buildF137ProductionCutoverChecklist('ready');
  const f149 = buildF149NormativeNumericQa();
  const f149b = buildF149bFastradClinicalUtility();
  const f149c = buildF149cMonteCarloGateway();

  const gates: F150ReleaseGate[] = [
    {
      id: 'package',
      label: 'F135 paquete RC',
      status: f135.status === 'ready' ? 'pass' : 'block',
      evidence: `${f135.packageDirectory}; ${f135.requiredEvidence.join(' | ')}`,
    },
    {
      id: 'deploy-rehearsal',
      label: 'F136 rehearsal local productivo',
      status: f136.status === 'ready' ? 'pass' : 'block',
      evidence: `${f136.rehearsalMode}; ${f136.validatedSurfaces.join(' | ')}`,
    },
    {
      id: 'cutover',
      label: 'F137 checklist cutover',
      status: f137.status === 'ready' ? 'warn' : 'block',
      evidence: f137.goNoGoDecision,
    },
    {
      id: 'numeric-qa',
      label: 'F149 QA numerico normativo',
      status: f149.releaseReady ? 'pass' : 'block',
      evidence: `Suite ${f149.canonicalSuite.passed}/${f149.canonicalSuite.total}; casos ${f149.totals.passed}/${f149.totals.total}; bloqueos ${f149.totals.releaseBlocking}.`,
    },
    {
      id: 'export-smoke',
      label: 'F149b smoke de exportacion',
      status: f149b.exportSmoke.releaseReady ? 'pass' : 'block',
      evidence: f149b.exportSmoke.surfaces.map((surface) => `${surface.surface}:${surface.status}`).join(' | '),
    },
    {
      id: 'mc-gateway',
      label: 'F149c Monte Carlo Gateway',
      status: f149c.exportPackage.releaseReady ? 'pass' : 'warn',
      evidence: `${f149c.engines.length} motores; ${f149c.exportPackage.artifacts.length} artefactos; MC real externo post-RC.`,
    },
    {
      id: 'public-deploy',
      label: 'Deploy publico',
      status: 'warn',
      evidence: 'F150 no publica: faltan URL objetivo, secretos productivos, backup/restore DB y smoke en host final.',
    },
  ];

  const blocked = gates.some((gate) => gate.status === 'block');
  const decision: F150ReleaseDecision = blocked ? 'blocked' : 'controlled-rc-go-public-no-go';

  return {
    phase: 'F150',
    status: 'release-candidate-controlled',
    generatedAt: '2026-07-15',
    releaseName: 'RadShield-MX F150 Controlled Release Candidate',
    decision,
    goNoGo: blocked
      ? 'NO-GO: existe al menos un gate bloqueante.'
      : 'GO para release candidate local/controlado. NO-GO para publicacion publica hasta completar URL smoke, secretos y backup/restore DB.',
    gates,
    acceptedScope: [
      'Frontend build productivo generado y compilable.',
      'DB/API/MySQL live path validado por fases F130-F133.',
      'Browser RC smoke y paquete F135/F136/F137 cerrados como base local.',
      'Memoria IA, PDF Report, Evidence Pack y Update App portan F149/F149b/F149c.',
      'Monte Carlo forward queda como gateway externo; reverse real queda post-RC.',
    ],
    deferredScope: [
      'Deploy publico final en hosting definitivo.',
      'Secrets productivos y rotacion fuera del repositorio.',
      'Backup MySQL inmediatamente antes de cutover y restore test documentado.',
      'Smoke Playwright contra URL publica final.',
      'Motor Monte Carlo externo ejecutado/commissioned con dataset clinico.',
    ],
    deliverables: [
      'outputs/f150_release_candidate_controlled/f150_release_candidate_controlled.json',
      'outputs/fase_150_release_candidate_controlled.md',
      'outputs/f150_release_candidate_controlled/README_F150_RC.md',
      'dist/index.html',
      'outputs/f135_release_candidate_package/manifest.json',
    ],
    productionBlockers: [
      'Confirmar target hosting/runtime y dominio.',
      'Configurar DATABASE_URL/JWT_SECRET/KIMI_* productivos fuera del codigo.',
      'Capturar backup DB y probar restore antes de produccion.',
      'Ejecutar smoke en URL final despues del deploy.',
      'Congelar cambios grandes hasta cerrar smoke final.',
    ],
    immediateNextSteps: [
      'Mantener F150 como RC controlado.',
      'Preparar deploy target o paquete entregable offline.',
      'Ejecutar backup/restore DB cuando se defina ambiente productivo.',
      'Correr smoke Playwright en URL final antes de public launch.',
      'Abrir backlog post-RC para MC externo real, citation picker vivo y smoke visual 3D con plano real.',
    ],
    finalStatement: blocked
      ? 'F150 no debe liberarse hasta resolver gates bloqueantes.'
      : 'F150 cierra estabilizacion como release candidate controlado: usable para validacion local/full-stack y entrega tecnica, no aun para publicacion publica sin cutover final.',
  };
}

export function formatF150ReleaseCandidateControlledText(summary = buildF150ReleaseCandidateControlled()): string {
  return [
    'F150 RELEASE CANDIDATE CONTROLADO',
    `   Release: ${summary.releaseName}`,
    `   Decision: ${summary.decision}`,
    `   Go/No-Go: ${summary.goNoGo}`,
    '   Gates:',
    ...summary.gates.map((gate) => `   - ${gate.label}: ${gate.status.toUpperCase()} | ${gate.evidence}`),
    '   Alcance aceptado:',
    ...summary.acceptedScope.map((item) => `   - ${item}`),
    '   Diferido:',
    ...summary.deferredScope.map((item) => `   - ${item}`),
    '   Bloqueadores produccion:',
    ...summary.productionBlockers.map((item) => `   - ${item}`),
    `   Cierre: ${summary.finalStatement}`,
  ].join('\n');
}
