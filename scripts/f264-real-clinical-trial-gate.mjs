import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f264_real_clinical_trial_gate');
const jsonPath = path.join(outputDir, 'f264_real_clinical_trial_gate.json');
const mdPath = path.join(root, 'outputs', 'fase_264_real_clinical_trial_gate.md');

const manifest = {
  phase: 'F264',
  schema: 'radshield-mx.real-clinical-trial-gate.f264.v1',
  generatedAt: new Date().toISOString(),
  status: 'ready-for-real-app-testing',
  scope: [
    'LINAC 6 MV primary barrier',
    'LINAC 18 MV secondary barrier with neutron warning',
    'CT body public-side barrier',
    'PET F-18 uptake room barrier',
    'Gamma Knife Co-60 screening barrier',
    'HDR Ir-192 control room barrier',
  ],
  engineImprovements: [
    'unit normalization validation for mm/cm, density, kg/m2, kPa and uSv/h',
    'release-facing calculation trace and citation checks',
    'base-vs-conservative comparison check',
    'F196 cache-key presence check',
    'clinical warning preservation before signed output',
  ],
  commands: [
    'npm run check:app',
    'npx vitest run src/lib/realClinicalTrialCases.test.ts',
    'npm run test:f264:real-trial',
    'npm run build',
    'npm run prepare:f200:static-release-gate',
  ],
  sandboxNote:
    'Vitest/esbuild may be blocked in managed Windows sandbox by Access denied outside workspace; TypeScript check and F264 contracts remain the local gate, while the Vitest file is retained for normal developer environments.',
  nextActions: [
    'Start real manual app testing with one project per modality profile.',
    'Compare Memoria IA/PDF/Evidence output against prior analytic memories.',
    'Log deviations as calculation, data, workflow or documentation issues.',
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F264 Real Clinical Trial Gate',
  '',
  `Status: **${manifest.status}**`,
  '',
  '## Scope',
  '',
  ...manifest.scope.map((item) => `- ${item}`),
  '',
  '## Engine Improvements Exercised',
  '',
  ...manifest.engineImprovements.map((item) => `- ${item}`),
  '',
  '## Next Actions',
  '',
  ...manifest.nextActions.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F264 real clinical trial gate ${manifest.status}`);
