import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f148_memory_profile_selector');
mkdirSync(outputDir, { recursive: true });

const output = {
  phase: 'F148',
  status: 'ready',
  generatedAt: new Date().toISOString(),
  profiles: ['DIAGNOSTIC', 'LINAC', 'GAMMA_KNIFE', 'BRAQUI_CO60', 'NUCLEAR_MEDICINE', 'CYCLOTRON'],
  modalityMapping: {
    dx: 'DIAGNOSTIC',
    tx: 'LINAC',
    nm: 'NUCLEAR_MEDICINE',
    cy: 'CYCLOTRON',
  },
  implemented: [
    'Memoria IA profile selector visible in the wizard.',
    'Profile changes exported memory sections and evidence routing.',
    'DX/TX/NM/CY active profile can preselect the closest memory route.',
    'Diagnostic, Nuclear Medicine, LINAC and Gamma Knife profiles use F144 source governance.',
    'Equipment selection can preselect the closest memory profile.',
    'Warnings and required inputs are preserved in exported text.',
  ],
  policy: [
    'Profile selection does not change calculation constants silently.',
    'Prior memories remain examples only.',
    'Vendor guides remain planning evidence.',
    'Final numeric values still require F125 formula/input/output/citation/evidence gate.',
  ],
  files: [
    'src/lib/f148MemoryProfileSelector.ts',
    'src/sections/dialogs/MemoriaAIWizard.tsx',
  ],
  decision:
    'F148 lets the user choose the analytic-memory modality route before export while preserving DX/TX/NM/CY routing, F144 source hierarchy and F125 calculation QA.',
};

writeFileSync(path.join(outputDir, 'f148_memory_profile_selector.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_148_memory_profile_selector.md'),
  [
    '# F148 Selector de Perfil de Memoria',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Profiles: ${output.profiles.join(', ')}`,
    '',
    '## Implemented',
    ...output.implemented.map((item) => `- ${item}`),
    '',
    '## Policy',
    ...output.policy.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F148 memory profile selector ${output.status}: ${output.profiles.length} profiles.`);
