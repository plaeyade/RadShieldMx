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
    'F165-ready outputs: SVG/PNG export plan, OCR-ready room classification, clinical flow routes and 2D/3D/report sync targets.',
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
  exportTargets: ['Canvas visual QA', 'SVG/PNG visual export', 'Memoria IA', 'PDF report', 'Evidence Pack', 'Medical 3D inspection'],
  releaseNotes: [
    'The map is derived from real floorplan objects when present.',
    'It does not change shielding calculations or regulatory defaults.',
    'It should be exported as a visual executive summary, not used as CAD geometry.',
  ],
  closedByF165: [
    'PNG export hook defined through SVG-to-canvas plan.',
    'Room-name classifier implemented from occupied region labels with OCR/OpenCV handoff.',
    'Patient/radiopharmaceutical/waste/survey flow arrows implemented.',
    'Selected clinical node sync targets defined for 2D canvas, Medical 3D, Memoria IA, PDF and Evidence Pack.',
  ],
  nextBacklog: [
    'Bind selected clinical domain to actual canvas object highlight state.',
    'Persist exported clinical figure inside project records once DB live is active.',
    'Use OCR text boxes from imported drawings to replace heuristic room-name classification.',
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
    '## Closed By F165',
    ...output.closedByF165.map((item) => `- ${item}`),
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
