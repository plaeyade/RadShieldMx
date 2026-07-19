import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f220_canvas_cad_priority_actions');
fs.mkdirSync(outDir, { recursive: true });

const actions = [
  { id: 'direct-edit', priority: 'P0', next: 'F220/F221', status: 'implemented-entry' },
  { id: 'advanced-snap', priority: 'P0', next: 'F221', status: 'implemented-entry' },
  { id: 'editable-dimensions', priority: 'P0', next: 'F222', status: 'implemented-entry' },
  { id: 'lasso-select', priority: 'P1', next: 'F223', status: 'implemented-entry' },
  { id: 'isocontours', priority: 'P1', next: 'F224', status: 'implemented-entry' },
  { id: 'equipment-footprints', priority: 'P1', next: 'F225', status: 'implemented-entry' },
  { id: 'medical-3d', priority: 'P2', next: 'F226', status: 'implemented-entry' },
];

const payload = {
  schema: 'radshield-mx.canvas-cad-priority-actions.f220.v1',
  phase: 'F220',
  status: 'cad-priority-actions-ready',
  actions,
  guardrail: 'F220 agrega entradas operativas y no reescribe renderer, eventos base, calculos, DXF, DB ni sidebar.',
  nextRecommendedPhases: ['F221 advanced snapping', 'F222 editable dimensions', 'F223 lasso selection', 'F224 real isocontours', 'F225 equipment footprints', 'F226 medical 3D inspection'],
};

fs.writeFileSync(path.join(outDir, 'f220_canvas_cad_priority_actions.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_220_canvas_cad_priority_actions.md'),
  [
    '# F220 - Canvas CAD Priority Actions',
    '',
    `- Estado: ${payload.status}`,
    `- Guardrail: ${payload.guardrail}`,
    '',
    ...actions.map((action) => `- ${action.priority}: ${action.id} -> ${action.next} (${action.status})`),
    '',
    `Siguientes fases: ${payload.nextRecommendedPhases.join(', ')}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({ status: payload.status, actions: actions.length }, null, 2));
