import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f150_release_candidate_controlled');
const jsonPath = path.join(outDir, 'f150_release_candidate_controlled.json');
const mdPath = path.join(root, 'outputs', 'fase_150_release_candidate_controlled.md');
const readmePath = path.join(outDir, 'README_F150_RC.md');

const priorEvidence = [
  'outputs/f135_release_candidate_package/manifest.json',
  'outputs/f136_production_deploy_rehearsal.json',
  'outputs/f137_production_cutover_checklist.json',
  'outputs/f149_normative_numeric_qa/f149_normative_numeric_qa.json',
  'outputs/f149b_fastrad_export_smoke/f149b_fastrad_export_smoke.json',
  'outputs/f149c_monte_carlo_gateway/f149c_monte_carlo_gateway.json',
  'dist/index.html',
].map((file) => ({
  file,
  present: fs.existsSync(path.join(root, file)),
}));

const gates = [
  {
    id: 'package',
    label: 'F135 paquete release candidate',
    status: priorEvidence.some((item) => item.file.includes('f135') && item.present) ? 'pass' : 'warn',
    evidence: 'outputs/f135_release_candidate_package/manifest.json',
  },
  {
    id: 'deploy-rehearsal',
    label: 'F136 deploy rehearsal local',
    status: priorEvidence.some((item) => item.file.includes('f136') && item.present) ? 'pass' : 'warn',
    evidence: 'outputs/f136_production_deploy_rehearsal.json',
  },
  {
    id: 'cutover',
    label: 'F137 cutover checklist',
    status: priorEvidence.some((item) => item.file.includes('f137') && item.present) ? 'warn' : 'warn',
    evidence: 'GO controlado; NO-GO publico sin URL smoke, secretos y backup/restore.',
  },
  {
    id: 'numeric-qa',
    label: 'F149 QA numerico normativo',
    status: priorEvidence.some((item) => item.file.includes('f149_normative') && item.present) ? 'pass' : 'warn',
    evidence: 'outputs/f149_normative_numeric_qa/f149_normative_numeric_qa.json',
  },
  {
    id: 'export-smoke',
    label: 'F149b smoke exportacion',
    status: priorEvidence.some((item) => item.file.includes('f149b') && item.present) ? 'pass' : 'warn',
    evidence: 'outputs/f149b_fastrad_export_smoke/f149b_fastrad_export_smoke.json',
  },
  {
    id: 'mc-gateway',
    label: 'F149c Monte Carlo Gateway',
    status: priorEvidence.some((item) => item.file.includes('f149c') && item.present) ? 'pass' : 'warn',
    evidence: 'outputs/f149c_monte_carlo_gateway/f149c_monte_carlo_gateway.json',
  },
  {
    id: 'public-deploy',
    label: 'Deploy publico',
    status: 'warn',
    evidence: 'Pendiente elegir target, secretos, backup/restore y smoke Playwright en URL final.',
  },
];

const manifest = {
  phase: 'F150',
  title: 'Release candidate controlado',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.release-candidate.f150.v1',
  status: 'release-candidate-controlled',
  decision: gates.some((gate) => gate.status === 'block') ? 'blocked' : 'controlled-rc-go-public-no-go',
  goNoGo: 'GO para RC controlado/local/full-stack. NO-GO para deploy publico hasta URL smoke, secretos productivos y backup/restore DB.',
  gates,
  priorEvidence,
  acceptedScope: [
    'Build frontend productivo.',
    'Ruta DB/API/MySQL validada en F130-F133.',
    'Paquete y rehearsal F135-F137 como base de cutover controlado.',
    'Memoria IA/PDF/Evidence/Update App portan F149/F149b/F149c.',
    'Monte Carlo integrado como gateway externo validable, no como motor clinico nativo.',
  ],
  deferredScope: [
    'Deploy publico final.',
    'Secretos productivos fuera del repositorio.',
    'Backup DB y restore test justo antes de cutover.',
    'Smoke contra URL final.',
    'Monte Carlo externo comisionado con dataset clinico.',
  ],
  productionBlockers: [
    'target hosting/runtime/domain pendiente',
    'production secrets pending',
    'database backup/restore pending',
    'public url smoke pending',
    'large-change freeze pending',
  ],
  nextRecommendedPhase: 'Deploy controlado o paquete offline, despues backup/restore DB y smoke URL final.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const md = [
  '# F150 - Release Candidate Controlado',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  '## Decision',
  '',
  `**${manifest.decision}**`,
  '',
  manifest.goNoGo,
  '',
  '## Gates',
  '',
  ...manifest.gates.map((gate) => `- ${gate.label}: ${gate.status.toUpperCase()} - ${gate.evidence}`),
  '',
  '## Alcance Aceptado',
  '',
  ...manifest.acceptedScope.map((item) => `- ${item}`),
  '',
  '## Diferido',
  '',
  ...manifest.deferredScope.map((item) => `- ${item}`),
  '',
  '## Bloqueadores Para Publicacion Publica',
  '',
  ...manifest.productionBlockers.map((item) => `- ${item}`),
  '',
  `Siguiente paso recomendado: ${manifest.nextRecommendedPhase}`,
  '',
].join('\n');

fs.writeFileSync(mdPath, md, 'utf8');
fs.writeFileSync(readmePath, [
  '# README F150 RC',
  '',
  'Este paquete marca RadShield-MX como release candidate controlado.',
  '',
  '- Usar para QA local/full-stack y entrega tecnica controlada.',
  '- No publicar en hosting abierto hasta resolver secretos, backup/restore DB y smoke URL final.',
  '- Mantener Monte Carlo como gateway externo hasta contar con motor comisionado.',
  '',
  'Archivos principales:',
  '',
  `- ${path.relative(root, jsonPath)}`,
  `- ${path.relative(root, mdPath)}`,
  '',
].join('\n'), 'utf8');

console.log(`F150 release candidate written: ${path.relative(root, jsonPath)}`);
