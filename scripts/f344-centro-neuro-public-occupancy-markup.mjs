import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f344_centro_neuro_public_occupancy_markup');
const f343Path = path.join(root, 'outputs', 'f343_centro_neuro_preflight', 'f343_centro_neuro_preflight.json');

fs.mkdirSync(outDir, { recursive: true });

function readJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

const f343 = readJson(f343Path);
const scalePolicy = {
  ratioLabel: '1:100',
  status: 'user-confirmed-for-draft-and-markup',
  finalCalculationCaution: 'Confirm against one known architectural dimension before signed calculations or construction release.',
  inheritedPixelScale: f343?.source?.provisionalScale ?? null,
};

const publicOccupancyPolicy = {
  adjacencyClass: 'publico en general',
  defaultOccupancyFactorT: 1,
  designGoalP: 'public-design-goal-pending-project-policy',
  status: 'applied-to-all-unknown-adjacencies-for-conservative-draft',
  caution: 'Using publico en general with T=1 is conservative for markup. Final P/T values must be approved before signed shielding.',
};

const fmReviewPolicy = {
  review: 'revision-fm-rso-final',
  status: 'deferred-to-final-release-gate',
  blocksMarkup: false,
  blocksSignedCalculation: true,
  requiredBefore: ['signed analytical memory', 'construction issue', 'CNSNS/UAQ final evidence pack'],
};

const rooms = [
  {
    roomId: 'centro-neuro-linac',
    label: 'LINAC Elekta Versa HD 15 MeV',
    modalityProfile: 'TX',
    occupancyDefault: publicOccupancyPolicy.adjacencyClass,
    drawActions: ['place isocenter', 'trace primary barriers', 'trace secondary barriers', 'tag maze/door', 'tag penetrations'],
  },
  {
    roomId: 'centro-neuro-lgk',
    label: 'Gamma Knife Esprit',
    modalityProfile: 'TX',
    occupancyDefault: publicOccupancyPolicy.adjacencyClass,
    drawActions: ['place isocenter', 'trace room envelope', 'tag door/maze', 'tag structural load', 'tag Co-60 source inventory pending'],
  },
  {
    roomId: 'centro-neuro-cyclotron',
    label: 'Cyclone KIUBE 18 MeV',
    modalityProfile: 'CY',
    occupancyDefault: publicOccupancyPolicy.adjacencyClass,
    drawActions: ['trace vault', 'tag target/exhaust routes', 'tag neutron barriers', 'tag activation areas', 'tag penetrations'],
  },
  {
    roomId: 'centro-neuro-radiofarmacia',
    label: 'Radiofarmacia / hot lab context',
    modalityProfile: 'NM',
    occupancyDefault: publicOccupancyPolicy.adjacencyClass,
    drawActions: ['trace controlled workflow', 'tag hot cells', 'tag transfer paths', 'tag waste/storage points'],
  },
];

const canvasMarkupLayers = [
  { layerId: 'pdf-base-locked', label: 'PDF base 1:100', state: 'locked', purpose: 'visual underlay only' },
  { layerId: 'rooms-equipment', label: 'Rooms and equipment footprints', state: 'editable', purpose: 'place Versa HD, LGK Esprit, KIUBE and hot lab context' },
  { layerId: 'public-adjacencies', label: 'Colindancias publico en general', state: 'editable', purpose: 'default adjacent occupancy class for draft' },
  { layerId: 'barriers', label: 'Shielding barriers', state: 'editable', purpose: 'walls, floor, ceiling, maze, doors and barrier IDs' },
  { layerId: 'penetrations', label: 'Penetrations', state: 'editable-required', purpose: 'HVAC, conduits, gases, door joints, cyclotron exhaust' },
  { layerId: 'materials-structure', label: 'Material + structural load', state: 'editable', purpose: 'high-density concrete draft, weight, cost and schedule metadata' },
  { layerId: 'citations-evidence', label: 'Citations and assumptions', state: 'editable-required', purpose: 'formula, standard, page, document hash and warnings' },
];

const barrierDrafts = rooms.flatMap((room) => [
  {
    barrierId: `${room.roomId}-north`,
    roomId: room.roomId,
    side: 'north',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
  {
    barrierId: `${room.roomId}-south`,
    roomId: room.roomId,
    side: 'south',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
  {
    barrierId: `${room.roomId}-east`,
    roomId: room.roomId,
    side: 'east',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
  {
    barrierId: `${room.roomId}-west`,
    roomId: room.roomId,
    side: 'west',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
  {
    barrierId: `${room.roomId}-floor`,
    roomId: room.roomId,
    side: 'floor',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
  {
    barrierId: `${room.roomId}-ceiling`,
    roomId: room.roomId,
    side: 'ceiling',
    adjacencyClass: publicOccupancyPolicy.adjacencyClass,
    occupancyFactorT: publicOccupancyPolicy.defaultOccupancyFactorT,
    designGoalP: publicOccupancyPolicy.designGoalP,
    status: 'ready-for-canvas-trace',
  },
]);

const calculationGates = [
  { id: 'scale-1-100-confirmed-for-markup', status: 'pass', evidence: scalePolicy.ratioLabel },
  { id: 'public-occupancy-applied', status: 'pass', evidence: publicOccupancyPolicy.adjacencyClass },
  { id: 'fm-review-final-not-markup-blocker', status: 'pass', evidence: fmReviewPolicy.status },
  { id: 'source-terms-still-required', status: 'pending-before-signed-calc', evidence: 'vendor source terms/workload/activity required' },
  { id: 'penetrations-still-required', status: 'pending-before-signed-calc', evidence: 'canvas markup required' },
  { id: 'material-citations-still-required', status: 'pending-before-signed-calc', evidence: 'TVL/density/page/hash required' },
];

const manifest = {
  schema: 'radshield-mx.f344.centro-neuro-public-occupancy-markup.v1',
  phase: 'F344',
  generatedAt: new Date().toISOString(),
  status: 'centro-neuro-markup-ready-signed-calculation-blocked',
  source: {
    f343Manifest: 'outputs/f343_centro_neuro_preflight/f343_centro_neuro_preflight.json',
    sourcePdfSha256: f343?.source?.sourcePdfSha256 ?? null,
  },
  scalePolicy,
  publicOccupancyPolicy,
  fmReviewPolicy,
  rooms,
  canvasMarkupLayers,
  barrierDrafts,
  calculationGates,
  signedCalculationProduced: false,
  markupHash: sha256Text(JSON.stringify({ scalePolicy, publicOccupancyPolicy, fmReviewPolicy, rooms, canvasMarkupLayers, barrierDrafts })),
  nextRecommendedPhase: 'F345: draft calculation packet with public-adjacency barriers, source-term placeholders, material citation placeholders and no signed output.',
};

fs.writeFileSync(path.join(outDir, 'f344_centro_neuro_public_occupancy_markup.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f344_canvas_layers.csv'),
  [
    ['layerId', 'label', 'state', 'purpose'].map(csvCell).join(','),
    ...canvasMarkupLayers.map((layer) => [layer.layerId, layer.label, layer.state, layer.purpose].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'f344_barrier_public_adjacencies.csv'),
  [
    ['barrierId', 'roomId', 'side', 'adjacencyClass', 'occupancyFactorT', 'designGoalP', 'status'].map(csvCell).join(','),
    ...barrierDrafts.map((barrier) => [
      barrier.barrierId,
      barrier.roomId,
      barrier.side,
      barrier.adjacencyClass,
      barrier.occupancyFactorT,
      barrier.designGoalP,
      barrier.status,
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F344 Centro Neuro Public Occupancy Markup',
  '',
  `Status: ${manifest.status}`,
  `Scale: ${scalePolicy.ratioLabel} (${scalePolicy.status})`,
  `Default adjacency: ${publicOccupancyPolicy.adjacencyClass}, T=${publicOccupancyPolicy.defaultOccupancyFactorT}`,
  `FM/RSO review: ${fmReviewPolicy.status}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  '',
  '## Canvas Layers',
  ...canvasMarkupLayers.map((layer) => `- ${layer.layerId}: ${layer.label}, ${layer.state}.`),
  '',
  '## Rooms',
  ...rooms.map((room) => `- ${room.label}: ${room.drawActions.join('; ')}.`),
  '',
  '## Calculation Gates',
  ...calculationGates.map((gate) => `- ${gate.id}: ${gate.status} (${gate.evidence}).`),
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_344_centro_neuro_public_occupancy_markup.md'), md, 'utf8');

console.log(`F344 ${manifest.status}: ${rooms.length} rooms, ${barrierDrafts.length} public-adjacency barriers, ${canvasMarkupLayers.length} layers.`);
