import fs from 'node:fs';
import path from 'node:path';

const inventory = [
  ['material-comparison', 'Comparador HVL/TVL + matriz de decision', 'canonical-toolbox', 'stable'],
  ['material-property-calculator', 'Editor fisico de materiales', 'kept-as-specialized-subtool', 'usable-with-review'],
  ['lead-free-materials', 'Alternativas sin plomo', 'deduplicated-route', 'stable'],
  ['cost-estimator', 'Estimador CAPEX/OPEX', 'kept-as-specialized-subtool', 'stable'],
  ['cost-optimizer', 'Optimizador de costo', 'kept-as-specialized-subtool', 'stable'],
  ['predictive-material', 'Material predictivo', 'kept-as-specialized-subtool', 'usable-with-review'],
  ['f121-f122-f123', 'Capas impacto/overlay/matriz', 'integrated-as-decision-layer', 'stable'],
].map(([id, label, disposition, stability]) => ({ id, label, disposition, stability }));

const phaseReconciliation = [
  {
    phase: 'old-f121',
    status: 'covered-by-f115-f120',
    currentHandling: 'Post-smoke UX/documental polish was absorbed by visual smoke, profile handoff, screenshots and update-center traceability.',
  },
  {
    phase: 'old-f122',
    status: 'covered-by-f85-f100-and-f122',
    currentHandling: 'Canvas/floorplan QA is mostly covered by CAD-like phases plus F122 structural overlay; final E2E remains a release-candidate gate.',
  },
  {
    phase: 'old-f123',
    status: 'partial-pending-report-evidence-gate',
    currentHandling: 'Formula/standard/input/output/citation/evidence per result must still be enforced in final report and analytic-memory exports.',
  },
];

const payload = {
  phase: 'F124',
  title: 'Material Toolbox Consolidation',
  status: 'implemented-toolbox-consolidation',
  schema: 'radshield-mx.material-toolbox-consolidation.f124',
  canonicalDialog: 'materialComparison',
  duplicateRemoved: 'LeadFreeMaterialsDialog no longer mounts as materialComparison',
  inventory,
  phaseReconciliation,
  registryDebt: ['Resolved after F126 review: materialProperty, nuclearMedicine and neutronRemoval use dedicated dialog routes'],
  nextPhase: 'F125',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f124_material_toolbox_consolidation.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F124 Material Toolbox Consolidation',
  '',
  'F124 consolidates the material editor, material comparison, lead-free alternatives, cost/time tradeoffs and structural-impact decision layers into one canonical toolbox entry point.',
  '',
  `Canonical dialog: \`${payload.canonicalDialog}\``,
  '',
  `Duplicate removed: ${payload.duplicateRemoved}.`,
  '',
  '| Tool | Disposition | Stability |',
  '| --- | --- | --- |',
  ...payload.inventory.map((item) => `| ${item.label} | ${item.disposition} | ${item.stability} |`),
  '',
  '## Previous Phase Reconciliation',
  '',
  '| Phase | Status | Handling |',
  '| --- | --- | --- |',
  ...payload.phaseReconciliation.map((item) => `| ${item.phase} | ${item.status} | ${item.currentHandling} |`),
  '',
  '## Registry Debt',
  '',
  ...payload.registryDebt.map((item) => `- ${item}`),
  '',
  'Next phase: F125 calculation-memory evidence gate.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_124_material_toolbox_consolidation.md'), markdown);
console.log('F124 material toolbox consolidation outputs written.');
