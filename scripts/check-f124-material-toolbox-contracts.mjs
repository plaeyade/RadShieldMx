import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f124MaterialToolboxConsolidation.ts',
    tokens: [
      'buildF124MaterialToolboxSummary',
      'buildF124MaterialToolboxInventory',
      'covered-by-f115-f120',
      'covered-by-f85-f100-and-f122',
      'partial-pending-report-evidence-gate',
      'LeadFreeMaterialsDialog',
    ],
  },
  {
    file: 'src/sections/dialogs/MaterialComparisonDialog.tsx',
    tokens: [
      'buildF124MaterialToolboxSummary',
      'f124-material-toolbox',
      'f124-toolbox-subtool',
      'f124-toolbox-legacy-resolution',
    ],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    tokens: ['component={MaterialComparisonDialog}'],
    custom(text, failures) {
      const count = (text.match(/name="materialComparison"/g) ?? []).length;
      if (count !== 1) failures.push(`src/pages/ShieldingDesigner.tsx: expected one materialComparison mount, found ${count}`);
      if (text.includes('component={LeadFreeMaterialsDialog}')) {
        failures.push('src/pages/ShieldingDesigner.tsx: LeadFreeMaterialsDialog still mounted as a duplicate materialComparison route');
      }
    },
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF124MaterialToolboxSummary',
      'f124-material-toolbox-summary',
      'F124 Material toolbox consolidation',
      'F124 Toolbox materiales',
    ],
  },
  {
    file: 'scripts/f124-material-toolbox-consolidation.mjs',
    tokens: [
      'f124_material_toolbox_consolidation.json',
      'fase_124_material_toolbox_consolidation.md',
      'radshield-mx.material-toolbox-consolidation.f124',
      'partial-pending-report-evidence-gate',
    ],
  },
  {
    file: 'outputs/f124_material_toolbox_consolidation.json',
    tokens: ['"phase": "F124"', 'radshield-mx.material-toolbox-consolidation.f124', '"nextPhase": "F125"'],
  },
  {
    file: 'outputs/fase_124_material_toolbox_consolidation.md',
    tokens: ['# F124 Material Toolbox Consolidation', 'Canonical dialog', 'F125 calculation-memory evidence gate'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f124:material-toolbox', 'test:f124:material-toolbox'],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const text = fs.readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) failures.push(`${check.file}: missing token "${token}"`);
  }
  if (check.custom) check.custom(text, failures);
}

if (failures.length > 0) {
  console.error('F124 material toolbox contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F124 material toolbox contracts OK.');
