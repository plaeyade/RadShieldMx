import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f341_centro_neuro_calibrated_trial');
const f340Path = path.join(root, 'outputs', 'f340_centro_neuro_operator_trial', 'f340_centro_neuro_operator_trial.json');
fs.mkdirSync(outDir, { recursive: true });

function readJson(fullPath) {
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

const f340 = readJson(f340Path);
const imageSize = f340?.source?.imageSize ?? { width: 1275, height: 1650 };
const drawingScale = {
  ratioLabel: '1:100',
  drawingUnits: 1,
  realUnits: 100,
  source: 'user-provided',
  status: 'accepted-for-draft',
  caution: 'A plotted 1:100 PDF gives a provisional pixel scale only; confirm with a known architectural dimension before signed calculations.',
};
const renderDpi = 150;
const provisionalScale = {
  dpi: renderDpi,
  metersPerPixel: Number(((0.0254 / renderDpi) * drawingScale.realUnits).toFixed(8)),
  centimetersPerPixel: Number(((2.54 / renderDpi) * drawingScale.realUnits).toFixed(5)),
  pageRealWidthMeters: Number((((imageSize.width * 0.0254) / renderDpi) * drawingScale.realUnits).toFixed(3)),
  pageRealHeightMeters: Number((((imageSize.height * 0.0254) / renderDpi) * drawingScale.realUnits).toFixed(3)),
  status: 'provisional-until-field-or-cad-dimension-check',
};

const defaultMaterial = {
  materialId: 'high-density-concrete-draft',
  label: 'Concreto alta densidad',
  family: 'concrete-heavy',
  densityKgM3Draft: 3200,
  tvlStatus: 'versioned-value-required-before-signed-calculation',
  acceptedUses: ['draft barrier comparison', 'structural load estimate', 'material toolbox prefill'],
  requiredEvidence: ['supplier/spec sheet', 'density test or datasheet', 'energy-specific TVL/HVL source', 'batch/composition if custom mix'],
  alternativesToCompare: ['concreto baritado', 'concreto magnetita', 'TM NIPOLL', 'CONTUPLEX', 'Nelco/VeriShield', 'plomo', 'acero'],
};

const sourceTerms = [
  {
    sourceId: 'f341-cyclotron-source',
    equipment: 'Cyclotron',
    modalityProfile: 'CY',
    roomId: 'centro-neuro-cyclotron',
    sourceKind: 'charged-particle accelerator plus secondary neutrons/gammas',
    status: 'operator-input-required',
    requiredFields: ['manufacturer/model', 'proton energy MeV', 'beam current uA', 'targets', 'weekly workload', 'self-shielding', 'vendor source-term report'],
    calculationNotes: ['neutron shielding', 'prompt gamma', 'activation', 'maze/door', 'penetrations and ducts'],
  },
  {
    sourceId: 'f341-gamma-knife-source',
    equipment: 'Gamma Knife / LGK',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-lgk',
    sourceKind: 'Co-60 sealed source array',
    status: 'operator-input-required',
    requiredFields: ['LGK model', 'number of sources', 'activity at reference date', 'decay date', 'patients/week', 'treatment workload', 'isocenter'],
    calculationNotes: ['source decay', 'primary/leakage/scatter', 'door and maze review', 'structural weight 36502 kg from plan'],
  },
  {
    sourceId: 'f341-linac-source',
    equipment: 'LINAC',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-linac',
    sourceKind: 'medical linear accelerator photons/electrons',
    status: 'operator-input-required',
    requiredFields: ['manufacturer/model', 'nominal energy MV', 'workload Gy/week', 'use factors', 'occupancy factors', 'isocenter', 'maze/door schedule'],
    calculationNotes: ['NCRP 151 primary', 'secondary leakage/scatter', 'neutron review if energy >10 MV', 'structural weight 3341 kg from plan'],
  },
];

const penetrationSchedule = {
  status: 'pending-operator-markup',
  defaultPolicy: 'No penetration is assumed safe until each opening is tagged, shielded and cited.',
  requiredItems: [
    'HVAC ducts and offsets',
    'electrical trays and conduit banks',
    'medical gases and plumbing',
    'cable penetrations near control rooms',
    'maze/door frame joints',
    'floor/ceiling sleeves',
    'cyclotron target lines and exhaust paths',
  ],
  canvasAction: 'Mark each penetration as its own barrier object with material, equivalent thickness, route and citation.',
};

const occupancyMap = {
  status: 'pending-user-confirmation',
  defaultPolicy: 'Occupancy factors are not guessed for final design.',
  suggestedDraftZones: [
    { zone: 'control rooms / operator areas', factorDraft: 1, needsApproval: true },
    { zone: 'waiting areas and consulting rooms', factorDraft: 1, needsApproval: true },
    { zone: 'corridors / vestibules', factorDraft: 0.2, needsApproval: true },
    { zone: 'stairs / transient circulation', factorDraft: 0.125, needsApproval: true },
    { zone: 'exterior or controlled service spaces', factorDraft: 0.05, needsApproval: true },
  ],
  canvasAction: 'Trace each adjacent occupancy area and bind T/P design goals before calculation.',
};

const realTrialWorkflow = [
  {
    step: 'Importar fondo',
    status: 'ready',
    evidence: f340?.source?.renderedPage ?? 'outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png',
  },
  {
    step: 'Aplicar escala 1:100',
    status: 'draft-ready',
    evidence: `${provisionalScale.metersPerPixel} m/px provisional at ${renderDpi} dpi`,
  },
  {
    step: 'Trazar salas y barreras',
    status: 'ready-for-operator',
    evidence: 'F340 room/layer plan',
  },
  {
    step: 'Colocar fuentes',
    status: 'requires-source-metadata',
    evidence: sourceTerms.map((item) => item.sourceId).join(', '),
  },
  {
    step: 'Asignar concreto alta densidad',
    status: 'draft-ready',
    evidence: defaultMaterial.materialId,
  },
  {
    step: 'Marcar penetraciones',
    status: 'pending',
    evidence: 'operator markup required',
  },
  {
    step: 'Asignar ocupacion',
    status: 'pending',
    evidence: 'operator confirmation required',
  },
  {
    step: 'Correr calculo y reporte',
    status: 'blocked-until-pending-inputs',
    evidence: 'scale/source/material/penetration/occupancy gates',
  },
];

const gates = [
  { id: 'f340-ready', pass: f340?.status === 'centro-neuro-operator-trial-ready', evidence: 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json' },
  { id: 'scale-1-100-present', pass: drawingScale.ratioLabel === '1:100', evidence: 'user-provided scale' },
  { id: 'provisional-pixel-scale-derived', pass: provisionalScale.metersPerPixel > 0, evidence: `${provisionalScale.metersPerPixel} m/px` },
  { id: 'three-source-templates-ready', pass: sourceTerms.length === 3 && sourceTerms.every((item) => item.status === 'operator-input-required'), evidence: 'cyclotron,gamma-knife,linac' },
  { id: 'high-density-concrete-selected', pass: defaultMaterial.family === 'concrete-heavy', evidence: defaultMaterial.materialId },
  { id: 'penetration-schedule-explicit', pass: penetrationSchedule.requiredItems.length >= 6, evidence: 'penetrations pending and itemized' },
  { id: 'occupancy-map-explicit', pass: occupancyMap.suggestedDraftZones.length >= 5, evidence: 'occupancy pending and itemized' },
  { id: 'signed-calculation-blocked-until-inputs', pass: realTrialWorkflow.some((item) => item.status === 'blocked-until-pending-inputs'), evidence: 'draft-only safety gate' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const manifest = {
  schema: 'radshield-mx.f341.centro-neuro-calibrated-trial.v1',
  phase: 'F341',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'centro-neuro-calibrated-trial-ready' : 'centro-neuro-calibrated-trial-gated',
  source: {
    f340Manifest: 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json',
    sourcePdfSha256: f340?.source?.sourcePdfSha256 ?? null,
    renderedPage: f340?.source?.renderedPage ?? null,
    imageSize,
  },
  drawingScale,
  provisionalScale,
  defaultMaterial,
  sourceTerms,
  penetrationSchedule,
  occupancyMap,
  realTrialWorkflow,
  trialHash: sha256Text(JSON.stringify({ drawingScale, provisionalScale, defaultMaterial, sourceTerms, penetrationSchedule, occupancyMap })),
  clinicalUsePolicy: 'F341 accepts user scale/material/source families for a real dry run. It still blocks signed calculations until exact source terms, material TVL/density, penetrations, occupancy and qualified review are complete.',
  gates,
  blockers,
  nextRecommendedPhase: blockers.length === 0
    ? 'F342: capture browser smoke screenshots for Centro Neuro canvas, Update Center, Medical 3D and report surfaces; then start real operator data entry.'
    : 'Resolve F341 gates before browser smoke and real operator data entry.',
};

fs.writeFileSync(path.join(outDir, 'f341_centro_neuro_calibrated_trial.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f341_source_terms.json'), `${JSON.stringify(sourceTerms, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f341_penetrations_occupancy_todo.json'), `${JSON.stringify({ penetrationSchedule, occupancyMap }, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f341_operator_inputs.csv'),
  [
    'category,item,status,evidence',
    ...realTrialWorkflow.map((item) => [item.step, item.step, item.status, item.evidence].map((value) => JSON.stringify(String(value))).join(',')),
    ...sourceTerms.flatMap((source) => source.requiredFields.map((field) => [
      source.equipment,
      field,
      'required',
      source.sourceId,
    ].map((value) => JSON.stringify(String(value))).join(','))),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F341 Centro Neuro Calibrated Trial',
  '',
  `Status: ${manifest.status}`,
  `Scale: ${drawingScale.ratioLabel}`,
  `Provisional scale: ${provisionalScale.metersPerPixel} m/px at ${renderDpi} dpi`,
  `Material: ${defaultMaterial.label} (${defaultMaterial.tvlStatus})`,
  '',
  '## Sources',
  ...sourceTerms.map((item) => `- ${item.equipment}: ${item.sourceKind}. Required: ${item.requiredFields.join(', ')}.`),
  '',
  '## Penetrations',
  ...penetrationSchedule.requiredItems.map((item) => `- Pending: ${item}`),
  '',
  '## Occupancy',
  ...occupancyMap.suggestedDraftZones.map((item) => `- Draft ${item.zone}: T=${item.factorDraft}, requires approval.`),
  '',
  '## Safety Gate',
  manifest.clinicalUsePolicy,
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_341_centro_neuro_calibrated_trial.md'), md, 'utf8');
console.log(`F341 ${manifest.status}: ${gates.filter((gate) => gate.pass).length}/${gates.length} gates, scale ${provisionalScale.metersPerPixel} m/px.`);
if (blockers.length) process.exit(1);
