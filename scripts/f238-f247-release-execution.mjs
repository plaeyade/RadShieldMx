import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f238_f247_release_execution');
mkdirSync(outputDir, { recursive: true });

const output = {
  phaseRange: 'F238-F247',
  status: 'ready',
  generatedAt: new Date().toISOString(),
  phases: [
    'F238 manual visual/documental QA final',
    'F239 static deploy smoke readiness',
    'F240 low-risk canvas CAD polish',
    'F241 renderer/event feature-flag plan',
    'F242 DXF/DWG-converted import and equipment symbols',
    'F243 frontend release package decision',
    'F244 versioned TVL/HVL ledger',
    'F245 numeric QA matrix',
    'F246 material cost/time/structure audit',
    'F247 report appendix/export checklist',
  ],
  gates: [
    'F200 static release gate',
    'F230 renderer/event gate',
    'F237 calculation governance',
    'F238-F247 release execution contract',
  ],
  deployDecision: {
    frontend: 'ready-after-static-smoke',
    fullstack: 'requires-db-live-restore-probe',
  },
  outputs: [
    'src/lib/f238ToF247ReleaseExecution.ts',
    'outputs/f238_f247_release_execution/f238_f247_release_execution.json',
    'outputs/fase_238_247_release_execution.md',
  ],
};

writeFileSync(path.join(outputDir, 'f238_f247_release_execution.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_238_247_release_execution.md'),
  [
    '# F238-F247 Release Execution',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Fases',
    ...output.phases.map((item) => `- ${item}`),
    '',
    '## Gates',
    ...output.gates.map((item) => `- ${item}`),
    '',
    '## Deploy',
    `- Frontend: ${output.deployDecision.frontend}`,
    `- Fullstack: ${output.deployDecision.fullstack}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F238-F247 release execution ${output.status}: ${output.phases.length} phases.`);
