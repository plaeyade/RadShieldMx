import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('outputs');
fs.mkdirSync(outDir, { recursive: true });

const summary = {
  phase: 'F118',
  status: 'implemented-confirmed',
  title: 'Profile-aware preselection',
  profileStorageKey: 'radshield:f113:active-modality-profile',
  targets: [
    'Memoria IA equipment suggestion',
    'PDF Report template suggestion',
    'Evidence Pack objective suggestion',
  ],
  controls: [
    'f118-apply-suggested-equipment',
    'f118-apply-suggested-report-template',
    'f118-apply-evidence-objective',
  ],
  confirmationPolicy: 'Suggestions from the active DX/TX/NM/CY profile are visible but are applied only after an explicit user click.',
  noSilentDefaults: true,
  preservedSurfaces: [
    'DX/TX/NM/CY modality profile selectors',
    'Memoria IA manual equipment selection',
    'PDF Report template selector',
    'Evidence Pack manual objective editing',
  ],
  nextPhase: 'F119 should smoke-test Memoria IA, PDF Report and Evidence Pack across DX/TX/NM/CY active profiles.',
};

fs.writeFileSync(
  path.join(outDir, 'f118_profile_aware_preselection.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

fs.writeFileSync(
  path.join(outDir, 'fase_118_profile_aware_preselection.md'),
  [
    '# F118 Profile-aware preselection',
    '',
    `Status: ${summary.status}`,
    '',
    '## Targets',
    ...summary.targets.map((item) => `- ${item}`),
    '',
    '## Explicit Apply Controls',
    ...summary.controls.map((item) => `- ${item}`),
    '',
    `Confirmation policy: ${summary.confirmationPolicy}`,
    '',
    `No silent defaults: ${summary.noSilentDefaults ? 'yes' : 'no'}`,
    '',
    `Next phase: ${summary.nextPhase}`,
    '',
  ].join('\n'),
);

console.log('F118 profile-aware preselection manifest generated.');
