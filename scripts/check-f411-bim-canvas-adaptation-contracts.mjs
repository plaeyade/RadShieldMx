import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  {
    file: 'src/lib/f411BimCanvasMethodology.ts',
    markers: [
      'F411BimMethodologyPlan',
      'projectTree',
      'layerRows',
      'interfacePattern',
      'bimDataNeeds',
      'workflowNeeds',
      'IDs persistentes por objeto',
      'Importadores auditados',
      'F412BimEntityRow',
      'entityCatalog',
      'sharedParameterRows',
      'roundtripGates',
      'REVIT_SHARED_PARAMETERS',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    markers: [
      'buildF411BimCanvasMethodology',
      'f411-bim-ribbon',
      'data-testid={`f411-bim-ribbon-${item.id}`}',
      'f411-bim-project-manager',
      'f411-bim-details',
      'f411-bim-layers',
      'f411-bim-navigation-rail',
      'f411-bim-command-line',
      'f412-bim-entity-catalog',
      'f412-bim-rs-parameters',
      'f412-bim-roundtrip-gates',
    ],
  },
  {
    file: 'e2e/f411-bim-canvas.spec.ts',
    markers: [
      'radshield-mx.f411.bim-canvas-ui.v1',
      'radshield_canvas_chrome_mode_f375',
      'f411-bim-ribbon',
      'f411-bim-project-manager',
      'f411-bim-navigation-rail',
      'f412-bim-entity-catalog',
    ],
  },
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  const text = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  for (const marker of check.markers) {
    if (!text.includes(marker)) failures.push(`${check.file}: missing "${marker}"`);
  }
}

if (failures.length) {
  console.error('F411 BIM canvas adaptation contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F411 BIM canvas adaptation contracts passed.');
