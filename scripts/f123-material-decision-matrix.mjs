import fs from 'node:fs';
import path from 'node:path';

const rows = [
  ['lead_sheet', 'Lamina de plomo', 22.68, 63.5, 226.8, 'moderate', 4, 5, 'conditional'],
  ['multilayer_hybrid', 'Sistema multicapa hibrido', 234, 655.2, 2340, 'moderate', 4, 4, 'conditional'],
  ['high_density_block', 'Tabique/bloque alta densidad', 336, 940.8, 3360, 'high', 3, 4, 'conditional'],
  ['ordinary_concrete', 'Concreto ordinario', 480, 1344, 4800, 'high', 2, 2, 'viable'],
  ['nelco_modular_panel', 'Panel modular tipo Nelco', 240, 672, 2400, 'high', 5, 5, 'conditional'],
  ['verishield_modular_panel', 'Panel modular tipo VeriShield', 240, 672, 2400, 'high', 5, 5, 'conditional'],
];

const payload = {
  phase: 'F123',
  title: 'Material Decision Matrix',
  status: 'implemented-material-decision-matrix',
  schema: 'radshield-mx.material-decision-matrix.f123',
  areaM2: 10,
  outputs: ['ranking', 'kg/m2', 'kg/ml', 'massKg', 'costIndex', 'scheduleIndex', 'reviewRequired', 'datasheetRequired'],
  rows: rows.map(([materialId, label, kgM2, kgPerLinearM, massKg, structuralRisk, costIndex, scheduleIndex, recommendation], index) => ({
    rank: index + 1,
    materialId,
    label,
    kgM2,
    kgPerLinearM,
    massKg,
    structuralRisk,
    costIndex,
    scheduleIndex,
    recommendation,
  })),
  nextPhase: 'F124',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f123_material_decision_matrix.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F123 Material Decision Matrix',
  '',
  'F123 adds a design decision layer for comparing shielding material options before applying changes to a barrier.',
  '',
  '| Rank | Material | kg/m2 | kg/ml | Risk | Recommendation |',
  '| ---: | --- | ---: | ---: | --- | --- |',
  ...payload.rows.map((row) => `| ${row.rank} | ${row.label} | ${row.kgM2} | ${row.kgPerLinearM} | ${row.structuralRisk} | ${row.recommendation} |`),
  '',
  'Evidence policy: use this matrix for preliminary design tradeoffs; final selection requires shielding calculation, vendor datasheet when flagged and structural review when flagged.',
  '',
  'Next phase: F124 selected-barrier material apply workflow.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_123_material_decision_matrix.md'), markdown);
console.log('F123 material decision matrix outputs written.');
