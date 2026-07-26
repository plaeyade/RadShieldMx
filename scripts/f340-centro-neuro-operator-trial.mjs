import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f340_centro_neuro_operator_trial');
const f339Path = path.join(root, 'outputs', 'f339_real_case_centro_neuro', 'f339_real_case_centro_neuro.json');
const renderedPagePath = path.join(root, 'outputs', 'f339_real_case_centro_neuro', 'centro_neuro_page-1.png');
fs.mkdirSync(outDir, { recursive: true });

function readJson(fullPath) {
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
}

function sha256(fullPath) {
  return fs.existsSync(fullPath) ? crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex') : null;
}

function pngSize(fullPath) {
  if (!fs.existsSync(fullPath)) return null;
  const buffer = fs.readFileSync(fullPath);
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const f339 = readJson(f339Path);
const seed = f339?.floorPlanSeedCandidate;
const imageSize = pngSize(renderedPagePath);
const renderedPageRelative = path.relative(root, renderedPagePath).replaceAll(path.sep, '/');
const renderedPageHash = sha256(renderedPagePath);

const layers = [
  { id: 'background-pdf', name: 'PDF base', visible: true, locked: true, purpose: 'Visual background only.' },
  { id: 'zones-controlled', name: 'Controlled zones', visible: true, locked: false, purpose: 'Trace controlled/supervised/public areas.' },
  { id: 'rooms-equipment', name: 'Equipment rooms', visible: true, locked: false, purpose: 'Cyclotron, Gamma Knife, LINAC and radiofarmacia footprints.' },
  { id: 'barriers-shielding', name: 'Shielding barriers', visible: true, locked: false, purpose: 'Walls, doors, penetrations and ceiling/floor barriers.' },
  { id: 'annotations-citations', name: 'Annotations and citations', visible: true, locked: false, purpose: 'Normative references, assumptions and warnings.' },
  { id: 'heatmap-isodose', name: 'Heatmap/isodose', visible: false, locked: false, purpose: 'Calculated only after scale/source/material gates pass.' },
  { id: 'structural-load', name: 'Structural load', visible: true, locked: false, purpose: 'Equipment and shielding mass review.' },
];

const roomPlans = (seed?.detectedRooms ?? []).map((room) => {
  const center = {
    x: Math.round(room.imageBboxApprox.x + room.imageBboxApprox.width / 2),
    y: Math.round(room.imageBboxApprox.y + room.imageBboxApprox.height / 2),
  };
  return {
    ...room,
    center,
    canvasLayer: room.label === 'RADIOFARMACIA' ? 'zones-controlled' : 'rooms-equipment',
    requiredActions: [
      'Confirm room boundary against architectural drawing.',
      'Trace walls as editable barriers with material placeholders.',
      'Confirm doors, mazes, penetrations and controlled-area adjacency.',
      'Attach source terms and occupancy before calculation.',
    ],
  };
});

const equipmentPlacements = [
  {
    id: 'eq-cyclotron-centro-neuro',
    roomId: 'centro-neuro-cyclotron',
    symbol: 'cyclotron-vault',
    profile: 'CY',
    placementStatus: 'placeholder-ready',
    requiredMetadata: ['model', 'protonEnergyMeV', 'beamCurrentUa', 'targets', 'selfShielding', 'vendorSourceTerm'],
  },
  {
    id: 'eq-gamma-knife-centro-neuro',
    roomId: 'centro-neuro-lgk',
    symbol: 'gamma-knife',
    profile: 'TX',
    placementStatus: 'placeholder-ready',
    visibleEquipmentWeightKg: 36502,
    requiredMetadata: ['model', 'co60Activity', 'referenceDate', 'patientsPerWeek', 'sourceInventory', 'isocenter'],
  },
  {
    id: 'eq-linac-centro-neuro',
    roomId: 'centro-neuro-linac',
    symbol: 'linac',
    profile: 'TX',
    placementStatus: 'placeholder-ready',
    visibleEquipmentWeightKg: 3341,
    requiredMetadata: ['model', 'energyMv', 'workloadGyPerWeek', 'useFactors', 'isocenter', 'mazeDoorSchedule'],
  },
];

const calculationDryRuns = (f339?.trialScenarios ?? []).map((scenario) => {
  const standards = scenario.equipment === 'Cyclotron'
    ? ['IAEA Safety Reports cyclotron design', 'NCRP 144/151 where applicable', 'UAQ local methodology']
    : scenario.equipment.includes('Gamma')
      ? ['NCRP 49/151 support', 'IAEA design guidance', 'UAQ memoria workflow']
      : ['NCRP 151', 'IAEA radiotherapy design guidance', 'UAQ memoria workflow'];
  return {
    caseId: scenario.caseId,
    equipment: scenario.equipment,
    modalityProfile: scenario.modalityProfile,
    roomId: scenario.roomId,
    dryRunStatus: 'ready-for-manual-input',
    standards,
    requiredInputs: scenario.requiredOperatorInputs,
    blockedCalculationsUntil: [
      'scale calibration is confirmed',
      'source term is versioned',
      'occupancy map is approved',
      'barrier material and density are selected',
      'doors/mazes/penetrations are reviewed',
    ],
    expectedOutputs: [
      'barrier-by-barrier inputs and outputs',
      'warnings and assumptions',
      'formulaId and standard citation IDs',
      'material appendix rows',
      'Medical 3D snapshot targets',
      'Memoria IA and Evidence Pack handoff',
    ],
  };
});

const medical3DReview = {
  engine: 'Three/R3F stable path',
  roomProfiles: ['CY-Cyclotron', 'TX-GammaKnife', 'TX-LINAC'],
  snapshotTargets: [
    { id: 'f340-cyclotron-overview', roomId: 'centro-neuro-cyclotron', view: 'top-oblique', evidenceUse: 'vault and radiofarmacia adjacency' },
    { id: 'f340-lgk-structural', roomId: 'centro-neuro-lgk', view: 'walkthrough', evidenceUse: 'equipment weight and controlled room review' },
    { id: 'f340-linac-barriers', roomId: 'centro-neuro-linac', view: 'barrier-inspection', evidenceUse: 'primary/secondary/maze review' },
  ],
  exportRequirements: ['sceneHash', 'visualEvidence', 'PNG', 'JSON', 'AI brief'],
};

const reportWorkflow = {
  memoriaIaSections: [
    'project and floorplan source',
    'scale calibration evidence',
    'equipment/source term by modality',
    'occupancy and controlled areas',
    'barrier calculations with formula/citation IDs',
    'material TVL/density/weight/cost/time/load appendix',
    'Medical 3D visual evidence',
    'warnings, assumptions and qualified-review checklist',
  ],
  exports: ['Memoria IA draft', 'PDF report', 'Evidence Pack JSON', 'CNSNS/UAQ checklist candidate'],
  clinicalGate: 'draft-only until all calculation dry-run blockers are resolved',
};

const svgPath = path.join(outDir, 'f340_centro_neuro_overlay.svg');
const svgWidth = imageSize?.width ?? 1275;
const svgHeight = imageSize?.height ?? 1650;
const colors = {
  CY: '#f97316',
  NM: '#10b981',
  TX: '#2563eb',
};
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`,
  `  <image href="../f339_real_case_centro_neuro/centro_neuro_page-1.png" x="0" y="0" width="${svgWidth}" height="${svgHeight}" opacity="0.68"/>`,
  '  <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="#0f172a" stroke-width="6"/>',
  ...roomPlans.map((room) => {
    const color = colors[room.modalityProfile] ?? '#64748b';
    const box = room.imageBboxApprox;
    return [
      `  <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="8" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="5"/>`,
      `  <circle cx="${room.center.x}" cy="${room.center.y}" r="16" fill="${color}" stroke="#ffffff" stroke-width="4"/>`,
      `  <text x="${box.x + 12}" y="${box.y + 30}" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${color}">${escapeXml(room.label)}</text>`,
      `  <text x="${box.x + 12}" y="${box.y + 58}" font-family="Arial, sans-serif" font-size="18" fill="#0f172a">Perfil ${escapeXml(room.modalityProfile)} - ${escapeXml(room.equipmentSymbol)}</text>`,
    ].join('\n');
  }),
  '  <g font-family="Arial, sans-serif">',
  '    <rect x="24" y="24" width="430" height="138" rx="10" fill="#ffffff" fill-opacity="0.92" stroke="#94a3b8" stroke-width="2"/>',
  '    <text x="44" y="58" font-size="24" font-weight="700" fill="#0f172a">F340 Centro Neuro Trial</text>',
  '    <text x="44" y="88" font-size="18" fill="#334155">Ciclotron + Gamma Knife + LINAC</text>',
  '    <text x="44" y="116" font-size="16" fill="#b45309">Requiere calibracion de escala antes de calcular</text>',
  '    <text x="44" y="142" font-size="16" fill="#334155">Salida: canvas, 3D, memoria IA, PDF, Evidence Pack</text>',
  '  </g>',
  '</svg>',
  '',
].join('\n');
fs.writeFileSync(svgPath, svg, 'utf8');

const gates = [
  { id: 'f339-ready', pass: f339?.status === 'real-case-centro-neuro-ready-for-operator-trial', evidence: 'outputs/f339_real_case_centro_neuro/f339_real_case_centro_neuro.json' },
  { id: 'rendered-background-ready', pass: fs.existsSync(renderedPagePath) && Boolean(imageSize), evidence: renderedPageRelative },
  { id: 'three-room-scenarios-ready', pass: calculationDryRuns.length === 3, evidence: 'cyclotron,gamma-knife,linac' },
  { id: 'layers-defined', pass: layers.length >= 7, evidence: 'background,zones,equipment,barriers,annotations,heatmap,structural' },
  { id: 'equipment-placeholders-ready', pass: equipmentPlacements.length === 3 && equipmentPlacements.every((item) => item.requiredMetadata.length >= 5), evidence: 'equipment placement metadata required' },
  { id: 'calculation-gates-explicit', pass: calculationDryRuns.every((item) => item.blockedCalculationsUntil.length >= 5), evidence: 'scale/source/occupancy/materials/penetrations' },
  { id: 'medical-3d-handoff-ready', pass: medical3DReview.snapshotTargets.length === 3 && medical3DReview.exportRequirements.includes('sceneHash'), evidence: 'Three/R3F snapshot targets' },
  { id: 'report-workflow-ready', pass: reportWorkflow.memoriaIaSections.length >= 8 && reportWorkflow.exports.length >= 4, evidence: 'Memoria IA/PDF/Evidence/CNSNS-UAQ' },
  { id: 'visual-overlay-ready', pass: fs.existsSync(svgPath), evidence: 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const manifest = {
  schema: 'radshield-mx.f340.centro-neuro-operator-trial.v1',
  phase: 'F340',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'centro-neuro-operator-trial-ready' : 'centro-neuro-operator-trial-gated',
  source: {
    f339Manifest: path.relative(root, f339Path).replaceAll(path.sep, '/'),
    renderedPage: renderedPageRelative,
    renderedPageSha256: renderedPageHash,
    imageSize,
    sourcePdfSha256: f339?.pdfSource?.sha256 ?? null,
  },
  canvasImportPlan: {
    backgroundImage: renderedPageRelative,
    backgroundMode: 'locked-underlay',
    scaleCalibration: {
      status: 'required-before-calculation',
      operatorAction: 'Pick two known architectural points and enter real distance in meters.',
      invalidates: ['barrier lengths', 'wall thickness measurements', 'dose distance calculations', '3D dimensions', 'structural load per area'],
    },
    layers,
    roomPlans,
  },
  equipmentPlacements,
  calculationDryRuns,
  medical3DReview,
  reportWorkflow,
  gates,
  blockers,
  nextRecommendedPhase: blockers.length === 0
    ? 'F341: execute interactive browser smoke on the current app URL using the F340 plan, then capture canvas/menu/3D/report screenshots.'
    : 'Resolve F340 gates and regenerate the operator trial package before browser smoke.',
};

fs.writeFileSync(path.join(outDir, 'f340_centro_neuro_operator_trial.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f340_canvas_import_plan.json'), `${JSON.stringify(manifest.canvasImportPlan, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f340_calculation_dry_runs.csv'),
  [
    'caseId,equipment,modalityProfile,roomId,status,standards,blockedCalculationsUntil',
    ...calculationDryRuns.map((item) => [
      item.caseId,
      item.equipment,
      item.modalityProfile,
      item.roomId,
      item.dryRunStatus,
      item.standards.join('; '),
      item.blockedCalculationsUntil.join('; '),
    ].map((value) => JSON.stringify(String(value))).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F340 Centro Neuro Operator Trial',
  '',
  `Status: ${manifest.status}`,
  `Rendered background: ${manifest.source.renderedPage}`,
  `Overlay: outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg`,
  '',
  '## Canvas Plan',
  ...layers.map((layer) => `- ${layer.name}: ${layer.purpose}`),
  '',
  '## Equipment',
  ...equipmentPlacements.map((item) => `- ${item.symbol} (${item.profile}) in ${item.roomId}: ${item.placementStatus}. Required: ${item.requiredMetadata.join(', ')}.`),
  '',
  '## Calculation Dry Runs',
  ...calculationDryRuns.map((item) => `- ${item.caseId}: ${item.equipment}. Blocked until ${item.blockedCalculationsUntil.join('; ')}.`),
  '',
  '## 3D And Reports',
  `- 3D engine: ${medical3DReview.engine}. Snapshots: ${medical3DReview.snapshotTargets.map((item) => item.id).join(', ')}.`,
  `- Reports: ${reportWorkflow.exports.join(', ')}.`,
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_340_centro_neuro_operator_trial.md'), md, 'utf8');
console.log(`F340 ${manifest.status}: ${calculationDryRuns.length} dry-runs, ${gates.filter((gate) => gate.pass).length}/${gates.length} gates.`);
if (blockers.length) process.exit(1);
