import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f147_medical_3d_inspection');
mkdirSync(outputDir, { recursive: true });

const output = {
  phase: 'F147',
  status: 'ready',
  generatedAt: new Date().toISOString(),
  implemented: [
    'Medical 3D viewer exposes F147 inspection readiness panel.',
    'Walkthrough stations cover room overview, equipment footprint, critical barrier and controlled zone when available.',
    'PNG, OBJ, review JSON and F147 inspection pack exports are available from the 3D dialog.',
    'Inspection pack records equipment, wall thicknesses, materials, controlled zones, finishes and visual QA checklist.',
    'The feature remains additive and does not change shielding calculation constants.',
  ],
  visualLayers: [
    'room volume and clinical finishes',
    'barrier thickness/material geometry',
    'medical equipment footprint',
    'controlled/occupied zones',
    'dose rings/heat visual in dose mode',
    'exportable review artifacts',
  ],
  releaseGates: [
    'Floorplan has at least one barrier or equipment source before final visual capture.',
    'Material constants must be cited through F142/F144 before using rendered material in analytic conclusions.',
    'F125 calculation evidence remains the numeric source of truth.',
  ],
  files: [
    'src/lib/f147Medical3DInspection.ts',
    'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  ],
  decision:
    'F147 turns the 3D floorplan into an inspection workflow for bunker/room review with equipment, thicknesses, controlled zones, finishes, materials and exportable visual evidence.',
};

writeFileSync(path.join(outputDir, 'f147_medical_3d_inspection.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_147_medical_3d_inspection.md'),
  [
    '# F147 Inspeccion 3D Medica',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Implementado',
    ...output.implemented.map((item) => `- ${item}`),
    '',
    '## Capas visuales',
    ...output.visualLayers.map((item) => `- ${item}`),
    '',
    '## Gates',
    ...output.releaseGates.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F147 medical 3D inspection ${output.status}: ${output.visualLayers.length} visual layers.`);
