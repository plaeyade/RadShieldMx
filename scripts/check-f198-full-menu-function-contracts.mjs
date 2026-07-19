import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const qa = read('src/lib/f198FullMenuFunctionQa.ts');
const toolbar = read('src/sections/Toolbar.tsx');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

const groups = [
  ['f96-migrated-design-dropdown', 'f96-migrated-design-menu', ['3D Bunker Viewer', 'Floor Plan Features', 'Medical 3D Floor Plan', 'DXF Viewer']],
  ['f97-migrated-equipment-dropdown', 'f97-migrated-equipment-menu', ['Equipment Library', 'Source Library', 'Cyclone KIUBE']],
  ['f107-migrated-shielding-dropdown', 'f107-migrated-shielding-menu', ['Multi-layer / Laminated', 'AAPM TG 108 PET Shielding', 'Therapy Radionuclide Shielding']],
  ['f108-migrated-verification-dropdown', 'f108-migrated-verification-menu', ['NCRP Validation Suite', 'Shielding Verification', 'Sensitivity Analysis']],
  ['f109-migrated-reports-dropdown', 'f109-migrated-reports-menu', ['Memoria IA', 'PDF analitico', 'Reporte CNSNS', 'Evidence Pack bridge']],
  ['f110-migrated-evidence-dropdown', 'f110-migrated-evidence-menu', ['Evidence Pack', 'RAG deep dive', 'Reference Library', 'AI source review']],
  ['f116-migrated-integrations-dropdown', 'f116-migrated-integrations-menu', ['Performance Dashboard', 'Technical Audit', 'CATIA-GDML & CAD to ROOT', 'Shielding Design Agent']],
];

expect('F198 module exports builder', qa.includes('buildF198FullMenuFunctionQa'));
expect('F198 module exports group matrix', qa.includes('F198_MENU_GROUPS'));
expect('F198 protects Archivo as only legacy', qa.includes("visibleLegacyMenus: ['Archivo']"));
expect('F198 points next to F199', qa.includes("nextPhase: 'F199'"));

for (const [trigger, menu, labels] of groups) {
  expect(`Toolbar has trigger ${trigger}`, toolbar.includes(`data-testid="${trigger}"`));
  expect(`Toolbar has menu ${menu}`, toolbar.includes(`data-testid="${menu}"`));
  expect(`F198 matrix has trigger ${trigger}`, qa.includes(trigger));
  expect(`F198 matrix has menu ${menu}`, qa.includes(menu));
  for (const label of labels) {
    expect(`Toolbar has label ${label}`, toolbar.includes(label));
    expect(`F198 matrix has label ${label}`, qa.includes(label));
  }
}

expect('Toolbar hides legacy duplicate groups', toolbar.includes(".filter((menu) => [t('menu.file')].includes(String(menu.label)))"));
expect('Package exposes F198 contract', pkg.scripts?.['test:f198:menus'] === 'node scripts/check-f198-full-menu-function-contracts.mjs');
expect('Package exposes F198 smoke', pkg.scripts?.['test:f198:menus-smoke'] === 'node scripts/check-f198-full-menu-function-smoke.mjs');
expect('Changelog documents F198', changelog.includes('F198'));
expect('Manual versions documents F198', manual.includes('F198'));
expect('User manual documents F198', userManual.includes('F198'));
expect('Update Center documents F198', update.includes('F198 Full menu function QA'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F198 full menu function contracts failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F198 full menu function contracts passed.');
