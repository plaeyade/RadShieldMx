import fs from 'node:fs';
import path from 'node:path';

const sampleBarriers = [
  { id: 'north', name: 'Pared norte', materialId: 'ordinary_concrete', kgM2: 480, massKg: 5376, risk: 'high', review: true, datasheet: false },
  { id: 'east', name: 'Pared este', materialId: 'lead_sheet', kgM2: 22.68, massKg: 254.02, risk: 'moderate', review: false, datasheet: true },
  { id: 'south', name: 'Pared sur', materialId: 'nelco_modular_panel', kgM2: 240, massKg: 2688, risk: 'high', review: true, datasheet: true },
  { id: 'west', name: 'Pared oeste', materialId: 'multilayer_hybrid', kgM2: 234, massKg: 2620.8, risk: 'moderate', review: true, datasheet: true },
];

const payload = {
  phase: 'F122',
  title: 'Canvas Structural Overlay',
  status: 'implemented-canvas-overlay-readiness',
  schema: 'radshield-mx.canvas-structural-overlay.f122',
  overlay: {
    barrierCount: sampleBarriers.length,
    totalMassKg: sampleBarriers.reduce((sum, barrier) => sum + barrier.massKg, 0),
    reviewRequiredCount: sampleBarriers.filter((barrier) => barrier.review).length,
    datasheetRequiredCount: sampleBarriers.filter((barrier) => barrier.datasheet).length,
    highOrCriticalCount: sampleBarriers.filter((barrier) => barrier.risk === 'high' || barrier.risk === 'critical').length,
    barriers: sampleBarriers,
  },
  uiContracts: [
    'f122-structural-overlay-panel',
    'f122-structural-risk-chip',
    'f122-review-required-chip',
    'f122-datasheet-required-chip',
  ],
  nextPhase: 'F123',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f122_canvas_structural_overlay.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F122 Canvas Structural Overlay',
  '',
  'F122 connects floorplan barriers to structural impact indicators for shielding materials.',
  '',
  '| Metric | Value |',
  '| --- | ---: |',
  `| Barriers | ${payload.overlay.barrierCount} |`,
  `| Total mass kg | ${payload.overlay.totalMassKg} |`,
  `| Structural review required | ${payload.overlay.reviewRequiredCount} |`,
  `| Vendor datasheet required | ${payload.overlay.datasheetRequiredCount} |`,
  `| High or critical risk | ${payload.overlay.highOrCriticalCount} |`,
  '',
  'Canvas UI: f122-structural-overlay-panel with kg/m2, kg/ml, mass, review and datasheet chips.',
  '',
  'Next phase: F123 material editor and cost/schedule comparator.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_122_canvas_structural_overlay.md'), markdown);
console.log('F122 canvas structural overlay outputs written.');
