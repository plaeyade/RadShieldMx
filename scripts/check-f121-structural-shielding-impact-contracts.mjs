import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f121StructuralShieldingImpact.ts',
    tokens: [
      'buildF121StructuralShieldingImpactSummary',
      'estimateBarrierStructuralImpact',
      'high_density_block',
      'nelco_modular_panel',
      'verishield_modular_panel',
      'lead_sheet',
      'requiresVendorDatasheet',
      'requiresStructuralReview',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF121StructuralShieldingImpactSummary',
      'f121-structural-shielding-impact',
      'F121 Structural shielding impact',
      'F121 Impacto estructural blindaje',
    ],
  },
  {
    file: 'scripts/f121-structural-shielding-impact.mjs',
    tokens: [
      'f121_structural_shielding_impact.json',
      'fase_121_structural_shielding_impact.md',
      'datasheet-required',
      'kgM2',
      'kgPerLinearM',
    ],
  },
  {
    file: 'outputs/f121_structural_shielding_impact.json',
    tokens: ['"phase": "F121"', 'nelco_modular_panel', 'verishield_modular_panel', 'lead_sheet', '"nextPhase": "F122"'],
  },
  {
    file: 'outputs/fase_121_structural_shielding_impact.md',
    tokens: ['# F121 Structural Shielding Impact', 'kg/m2', 'kg/ml', 'F122'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f121:structural-impact', 'test:f121:structural-impact'],
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
  console.error('F121 structural shielding impact contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F121 structural shielding impact contracts OK.');
