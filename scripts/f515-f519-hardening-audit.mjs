import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f515_f519_hardening');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);

const f515 = read('src/lib/f515CanvasEventHardening.ts');
const f519 = read('src/lib/f519NormativeQaExpansion.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const markers = [
  ['F515 schema', f515.includes('radshield-mx.canvas.event-hardening.f515.v1')],
  ['F515 event controller route', f515.includes('eventControllerV2') && f515.includes('stable useCanvas')],
  ['F515 non finite guard scenario', f515.includes('non-finite') || f515.includes('non finite')],
  ['F515 required E2E', f515.includes('right-click/context surface') && f515.includes('quick actions still dispatch')],
  ['F519 schema', f519.includes('radshield-mx.calc.normative-qa.f519-expansion.v1')],
  ['F519 barrier roles', ['primary', 'secondary', 'maze', 'door', 'penetration', 'controlled-zone'].every((item) => f519.includes(item))],
  ['F519 base conservative comparator', f519.includes('baseThickness_mm') && f519.includes('conservativeThickness_mm')],
  ['F519 citations and warnings', f519.includes('citationIds') && f519.includes('Preliminary QA fixture')],
  ['Update Center entry', update.includes('F515 canvas events') && update.includes('F519 QA numerico ampliado')],
  ['Changelog entry', changelog.includes('F515/F519')],
  ['Version manual entry', versions.includes('F515/F519')],
  ['User manual entry', manual.includes('Addendum F515/F519')],
  ['package scripts pending check source', exists('package.json')],
];

const failed = markers.filter(([, ok]) => !ok);
const audit = {
  phaseRange: 'F515/F519',
  generatedAt: new Date().toISOString(),
  status: failed.length ? 'review' : 'pass',
  markers: markers.map(([label, ok]) => ({ label, ok })),
  failed: failed.map(([label]) => label),
};

fs.writeFileSync(path.join(outDir, 'f515_f519_hardening_audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'f515_f519_hardening_summary.md'), [
  '# F515/F519 HARDENING',
  '',
  `Estado: ${audit.status}`,
  '',
  '## Marcadores',
  ...audit.markers.map((item) => `- ${item.label}: ${item.ok ? 'pass' : 'review'}`),
  '',
].join('\n'));

if (failed.length) {
  console.error(`F515/F519 audit failed: ${audit.failed.join(', ')}`);
  process.exit(1);
}

console.log('F515/F519 hardening audit passed.');
