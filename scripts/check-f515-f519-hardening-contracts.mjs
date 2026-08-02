import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const f515 = read('src/lib/f515CanvasEventHardening.ts');
const f519 = read('src/lib/f519NormativeQaExpansion.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('exports F515 builder', f515.includes('buildF515CanvasEventHardening'));
expect('F515 covers stable fallback and rollback', f515.includes('route-to-stable-useCanvas') && f515.includes('rollback'));
expect('F515 covers pointer modes', ['drag', 'snap', 'lasso', 'pan', 'zoom', 'delete', 'undo'].every((item) => f515.includes(item)));
expect('exports F519 builder', f519.includes('buildF519NormativeQaExpansion'));
expect('F519 covers all barrier roles', ['primary', 'secondary', 'maze', 'door', 'penetration', 'controlled-zone'].every((item) => f519.includes(item)));
expect('F519 covers modality spread', ['LINAC', 'CT_RX', 'GAMMA_KNIFE', 'PET_NM', 'CYCLOTRON'].every((item) => f519.includes(item)));
expect('F519 has comparator fields', f519.includes('baseThickness_mm') && f519.includes('conservativeThickness_mm'));
expect('package prepare script exists', pkg.scripts?.['prepare:f515-f519:hardening'] === 'node scripts/f515-f519-hardening-audit.mjs');
expect('package test script exists', pkg.scripts?.['test:f515-f519:hardening'] === 'node scripts/check-f515-f519-hardening-contracts.mjs');
expect('Update Center documents F515/F519', update.includes('F515 canvas events') && update.includes('F519 QA numerico ampliado'));
expect('Changelog documents F515/F519', changelog.includes('F515/F519'));
expect('Version manual documents F515/F519', versions.includes('F515/F519'));
expect('User manual documents F515/F519', manual.includes('Addendum F515/F519'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F515/F519 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F515/F519 hardening contracts passed.');
