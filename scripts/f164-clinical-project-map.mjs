import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f164_clinical_project_map');
mkdirSync(outputDir, { recursive: true });

const output = {
  phase: 'F164',
  status: 'clinical-map-ready',
  generatedAt: new Date().toISOString(),
  sourceInspiration: {
    url: 'https://www.nuviatech-healthcare.com/nuclear-healthcare/',
    pattern: 'Healthcare department/product-family map adapted into project-specific floorplan visualization.',
  },
  implemented: [
    'Clinical project map builder derived from FloorPlan sources, barriers, regions and critical points.',
    'SVG ClinicalProjectMap component for canvas, Memoria IA, PDF report or Evidence Pack reuse.',
    'CanvasArea compact panel that converts floorplan objects into clinical domains.',
    'Update Center summary for F164 release tracking.',
  ],
  domains: [
    'Radiodiagnostico',
    'Radioterapia',
    'Medicina nuclear',
    'Ciclotron',
    'Radiofarmacia',
    'Proteccion radiologica',
    'Monitoreo',
    'Residuos',
    'Construccion blindada',
    'Software/evidencia',
  ],
  exportTargets: ['Canvas visual QA', 'Memoria IA', 'PDF report', 'Evidence Pack', 'Medical 3D inspection'],
  releaseNotes: [
    'The map is derived from real floorplan objects when present.',
    'It does not change shielding calculations or regulatory defaults.',
    'It should be exported as a visual executive summary, not used as CAD geometry.',
  ],
  nextBacklog: [
    'Add PNG export hook for ClinicalProjectMap.',
    'Add room-name classifier from OCR/OpenCV plan labels.',
    'Show patient/staff/radiopharmaceutical/waste flow arrows from configured rooms.',
    'Synchronize selected clinical node with 2D canvas and Medical 3D inspection.',
  ],
  decision:
    'F164 adds a NuviaTech-inspired clinical ecosystem visualization in the correct place: derived from the floorplan and exported to evidence/report surfaces without cluttering CAD editing.',
};

writeFileSync(path.join(outputDir, 'f164_clinical_project_map.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_164_clinical_project_map.md'),
  [
    '# F164 Clinical Project Map',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Implemented',
    ...output.implemented.map((item) => `- ${item}`),
    '',
    '## Domains',
    ...output.domains.map((item) => `- ${item}`),
    '',
    '## Export Targets',
    ...output.exportTargets.map((item) => `- ${item}`),
    '',
    '## Release Notes',
    ...output.releaseNotes.map((item) => `- ${item}`),
    '',
    '## Next Backlog',
    ...output.nextBacklog.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F164 clinical project map ${output.status}: ${output.domains.length} domains.`);
