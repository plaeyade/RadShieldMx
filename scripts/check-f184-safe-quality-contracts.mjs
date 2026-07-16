import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function expect(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

const shieldDesigner = read('src/pages/ShieldingDesigner.tsx');
const memoria = read('src/sections/dialogs/MemoriaAIWizard.tsx');
const evidence = read('src/sections/dialogs/EvidencePackDialog.tsx');
const materials = read('src/sections/dialogs/MaterialComparisonDialog.tsx');
const packageJson = read('package.json');

expect('F184 module exists', existsSync(join(root, 'src/lib/f184ReleaseQualityWorkflow.ts')));
expect('F184 exports quality builder', read('src/lib/f184ReleaseQualityWorkflow.ts').includes('buildF184ReleaseQualityWorkflow'));
expect('F184 exports text formatter', read('src/lib/f184ReleaseQualityWorkflow.ts').includes('formatF184ReleaseQualityWorkflowText'));
expect('Demo R&F autoload preserved', shieldDesigner.includes("Demo - R&F Room (RadShield Fig.6)"));
expect('Welcome screen state is not disabled', !shieldDesigner.includes('if (false && !showWelcomeScreen'));
expect('Memoria IA imports F184 workflow', memoria.includes("buildF184ReleaseQualityWorkflow"));
expect('Memoria IA renders F184 panel', memoria.includes('data-testid="f184-release-quality-memoria"'));
expect('Generated memory includes F184 section', memoria.includes('QA INTEGRAL F184'));
expect('Evidence Pack renders F184 card', evidence.includes('data-testid="f184-release-quality-evidence"'));
expect('Material toolbox renders F184 integrated summary', materials.includes('data-testid="f184-material-integrated-summary"'));
expect('Material toolbox keeps F123/F124 prior work', materials.includes('data-testid="f123-material-decision-matrix"') && materials.includes('data-testid="f124-material-toolbox"'));
expect('Package exposes F184 test script', packageJson.includes('test:f184:safe-quality'));

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.label}`);
}

if (failed.length) {
  console.error(`\nF184 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('\nF184 safe quality contracts passed.');
