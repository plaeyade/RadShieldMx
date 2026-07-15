import fs from 'node:fs';
import path from 'node:path';

const materials = [
  ['ordinary_concrete', 'Concreto ordinario', 2400, 200, false],
  ['high_density_concrete', 'Concreto alta densidad', 3600, 160, true],
  ['high_density_block', 'Tabique/bloque alta densidad', 2800, 120, true],
  ['tm_nipoll_dense_block', 'Bloque modular denso tipo TM/Nipoll', 3000, 100, true],
  ['nelco_modular_panel', 'Panel modular tipo Nelco', 3200, 75, true],
  ['verishield_modular_panel', 'Panel modular tipo VeriShield', 3200, 75, true],
  ['lead_sheet', 'Lamina de plomo', 11340, 2, true],
  ['multilayer_hybrid', 'Sistema multicapa hibrido', 2600, 90, true],
];

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function riskFromKgM2(kgM2) {
  if (kgM2 >= 1000) return 'critical';
  if (kgM2 >= 450) return 'high';
  if (kgM2 >= 150) return 'moderate';
  return 'low';
}

function estimate([id, label, densityKgM3, thicknessMm, datasheetRequired]) {
  const lengthM = 4;
  const heightM = 2.8;
  const areaM2 = lengthM * heightM;
  const volumeM3 = areaM2 * (thicknessMm / 1000);
  const kgM2 = densityKgM3 * (thicknessMm / 1000);
  return {
    id,
    label,
    densityKgM3,
    thicknessMm,
    datasheetStatus: datasheetRequired ? 'datasheet-required' : 'generic-planning-value',
    kgM2: round(kgM2),
    kgPerLinearM: round(kgM2 * heightM),
    massKg: round(volumeM3 * densityKgM3),
    structuralRisk: riskFromKgM2(kgM2),
  };
}

const estimates = materials.map(estimate);
const payload = {
  phase: 'F121',
  title: 'Structural Shielding Impact',
  status: 'implemented-planning-layer',
  sourceBasis: [
    'CYPECAD-inspired flow: materials, loads, drawings, quantities and BIM handoff',
    'Concrete shielding literature: density, microstructure and aggregates drive shielding and weight',
    'PET broad-beam literature: buildup and geometry can change required thickness',
  ],
  scope: [
    'Estimate kg/m2 and kg/ml by shielding material',
    'Flag structural review and vendor datasheet requirements',
    'Prepare F122 canvas overlay for weight/cost/schedule impact',
  ],
  estimates,
  nextPhase: 'F122',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f121_structural_shielding_impact.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F121 Structural Shielding Impact',
  '',
  'F121 adds a planning layer that connects shielding material choices with structural load, constructability, cost and schedule.',
  '',
  '| Material | kg/m2 | kg/ml | Risk | Datasheet |',
  '| --- | ---: | ---: | --- | --- |',
  ...estimates.map((item) => `| ${item.label} | ${item.kgM2} | ${item.kgPerLinearM} | ${item.structuralRisk} | ${item.datasheetStatus} |`),
  '',
  'Important: vendor-type materials such as TM/Nipoll, Nelco and VeriShield require certified datasheets before final shielding or structural decisions.',
  '',
  'Next phase: F122 canvas structural overlay for visual weight/cost/schedule inspection.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_121_structural_shielding_impact.md'), markdown);
console.log('F121 structural shielding impact outputs written.');
