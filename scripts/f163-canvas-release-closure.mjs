import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f163_canvas_release_closure');
mkdirSync(outputDir, { recursive: true });

const output = {
  phase: 'F163',
  status: 'canvas-release-closed',
  generatedAt: new Date().toISOString(),
  externalReview: [
    {
      source: 'https://www.511kev.com/rs-designer',
      finding: 'RS Designer workflow: select floor plan image, add radiation sources/apparatus, trace walls, calculate ambient dose distribution, modify shielding/source properties.',
      radshieldDecision: 'RadShield-MX covers the same release workflow through floorplan canvas, equipment/source placement, barrier tracing, heatmap/isocontours, material presets and evidence export.',
    },
    {
      source: 'https://www.youtube.com/watch?v=dUAN29Nj8eo&t=129s',
      finding: 'YouTube page was not semantically extractable in this environment.',
      radshieldDecision: 'Treat as visual inspiration only; no unverified feature claim is used as a release gate.',
    },
  ],
  acceptanceGates: [
    'Floorplan image/import workflow remains available.',
    'Sources/equipment/apparatus placement remains available.',
    'Wall/barrier tracing, grips and material presets remain available.',
    'Ambient dose heatmap/isocontour evidence remains available.',
    'Canvas export path remains aligned with Memoria IA/PDF/Evidence Pack.',
    'No shielding formula or normative default changed in this closure.',
  ],
  implementedNow: [
    'F163 release closure summary added to app model.',
    'RS Designer parity map documented for canvas/floorplan.',
    'Advanced CAD backlog separated from release blockers.',
    'Deploy blocker remains remote Git access only.',
  ],
  remainingBacklog: [
    'Editable dense isocontour polylines.',
    'Visible snap glyphs.',
    'Manufacturer SVG/PNG symbol catalog.',
    'Independent editable dimension objects.',
    '2D-to-3D walkthrough synchronization QA.',
  ],
  decision:
    'F163 closes canvas stabilization for release. Continue with offline package refresh or deploy retry when Git remote is reachable from Codex.',
};

writeFileSync(path.join(outputDir, 'f163_canvas_release_closure.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_163_canvas_release_closure.md'),
  [
    '# F163 Canvas Release Closure',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## External Review',
    ...output.externalReview.map((item) => `- ${item.source}: ${item.finding} Decision: ${item.radshieldDecision}`),
    '',
    '## Acceptance Gates',
    ...output.acceptanceGates.map((item) => `- ${item}`),
    '',
    '## Implemented Now',
    ...output.implementedNow.map((item) => `- ${item}`),
    '',
    '## Remaining Backlog',
    ...output.remainingBacklog.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F163 canvas release closure ${output.status}: ${output.acceptanceGates.length} gates.`);
