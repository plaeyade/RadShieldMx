import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f123MaterialDecisionMatrix.ts',
    tokens: [
      'buildF123MaterialDecisionMatrix',
      'buildF123MaterialDecisionSummary',
      'preferred',
      'conditional',
      'kgPerLinearM',
      'F124 selected-barrier material apply workflow',
    ],
  },
  {
    file: 'src/sections/dialogs/MaterialComparisonDialog.tsx',
    tokens: [
      'buildF123MaterialDecisionMatrix',
      'f123-material-decision-matrix',
      'f123-material-row',
      'F123 matriz decision obra',
      'revision estructural',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF123MaterialDecisionSummary',
      'f123-material-decision-summary',
      'F123 Material decision matrix',
      'F123 Matriz decision materiales',
    ],
  },
  {
    file: 'scripts/f123-material-decision-matrix.mjs',
    tokens: [
      'f123_material_decision_matrix.json',
      'fase_123_material_decision_matrix.md',
      'radshield-mx.material-decision-matrix.f123',
      'kg/m2',
      'kg/ml',
    ],
  },
  {
    file: 'outputs/f123_material_decision_matrix.json',
    tokens: ['"phase": "F123"', 'radshield-mx.material-decision-matrix.f123', '"nextPhase": "F124"'],
  },
  {
    file: 'outputs/fase_123_material_decision_matrix.md',
    tokens: ['# F123 Material Decision Matrix', 'kg/m2', 'kg/ml', 'F124'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f123:material-decision', 'test:f123:material-decision'],
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
}

if (failures.length > 0) {
  console.error('F123 material decision contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F123 material decision contracts OK.');
