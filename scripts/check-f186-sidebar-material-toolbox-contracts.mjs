import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

const files = [
  'src/sections/Sidebar.tsx',
  'src/sections/dialogs/MaterialComparisonDialog.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'src/pages/ShieldingDesigner.tsx',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

for (const file of files) expect(`Missing ${file}`, existsSync(file));

const sidebar = read('src/sections/Sidebar.tsx');
const materials = read('src/sections/dialogs/MaterialComparisonDialog.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const packageJson = read('package.json');
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');

expect(
  'Sidebar stable expanded width',
  sidebar.includes('data-testid="f186-sidebar-stable-width"') &&
    (sidebar.includes('w-[286px]') || (sidebar.includes('DEFAULT_SIDEBAR_WIDTH = 286') && sidebar.includes('data-f188-sidebar-resizable="true"')))
);
expect('Sidebar stable collapsed width', sidebar.includes('data-testid="f186-sidebar-collapsed-stable"') && sidebar.includes('w-12'));
expect('Sidebar buttons expose aria labels', sidebar.includes('aria-label={`${label}: ${title}`}'));
expect('Quick actions include Mat', sidebar.includes("label: 'Mat'") && sidebar.includes("action: 'material'"));
expect('Mat opens materialComparison', sidebar.includes("case 'material': open('materialComparison'); break;"));
expect('Quick actions grid accounts for Mat', sidebar.includes('data-testid="f186-quick-actions-with-mat"') && sidebar.includes('grid-cols-5'));
expect('Material toolbox full table exists', materials.includes('data-testid="f186-material-toolbox-full-table"'));
expect('Material toolbox rows exist', materials.includes('data-testid="f186-material-toolbox-row"'));
for (const token of ['TVL mm', 'Dens.', 'kg/m2', 'kg total', 'Costo', 'Dias', 'Carga']) {
  expect(`Material toolbox column ${token}`, materials.includes(token));
}
expect('Update Center documents F186', update.includes('F186 Sidebar + Mat toolbox'));
expect('Package exposes F186 test', packageJson.includes('test:f186:sidebar-materials'));
expect('Changelog documents F186', changelog.includes('F186'));
expect('Manual documents F186', manual.includes('F186'));
expect('Demo R&F autoload preserved', designer.includes("Demo - R&F Room (RadShield Fig.6)"));
expect('Welcome screen not disabled', !designer.includes('if (false && !showWelcomeScreen'));

if (failures.length) {
  console.error('F186 sidebar/material toolbox contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F186 sidebar/material toolbox contracts OK.');
