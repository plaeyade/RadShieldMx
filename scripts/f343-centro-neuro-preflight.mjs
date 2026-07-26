import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f343_centro_neuro_preflight');
const f341Path = path.join(root, 'outputs', 'f341_centro_neuro_calibrated_trial', 'f341_centro_neuro_calibrated_trial.json');

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

const f341 = readJson(f341Path);
const commonBlockers = [
  'source-term-report-required',
  'occupancy-map-not-approved',
  'penetrations-not-marked',
  'material-tvl-density-not-versioned',
  'scale-needs-field-or-cad-check',
  'qualified-rso-physicist-review-required',
];

const conservativeWorkloadPolicy = {
  status: 'maximum-workload-assumed-for-preflight-only',
  caution: 'Maximum workload is a conservative planning assumption until treatment schedules, vendor source terms and clinical program are approved.',
  signedCalculationUse: false,
};

const equipmentPreflight = [
  {
    equipmentId: 'centro-neuro-linac-versa-hd-15mev',
    label: 'Elekta Versa HD',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-linac',
    userProvided: {
      maximumEnergyMeV: 15,
      maximumWorkload: 'use maximum clinical workload until approved schedule is provided',
      materialDraft: 'Concreto alta densidad',
    },
    calculationScope: [
      'NCRP 151 primary barriers',
      'secondary leakage and patient scatter',
      'photoneutron review because energy exceeds 10 MV',
      'maze/door and penetrations',
      'structural load overlay from equipment plus shielding',
    ],
    requiredInputs: [
      'approved workload Gy/week at isocenter',
      'use factors by barrier',
      'occupancy factor and design goal per adjacent area',
      'isocenter coordinates on calibrated plan',
      'maze/door geometry',
      'manufacturer shielding/source-term guide',
      'energy-specific TVL/HVL for selected material',
    ],
    clinicalWarnings: [
      'energy >10 MV requires neutron/door review',
      'distance below 0.3 m must be rejected or explicitly justified',
      'draft maximum workload can overdesign cost/weight if not reconciled with clinical schedule',
    ],
    readiness: 'ready-for-operator-data-entry',
    blockers: commonBlockers,
  },
  {
    equipmentId: 'centro-neuro-gamma-knife-esprit',
    label: 'Elekta Gamma Knife Esprit',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-lgk',
    userProvided: {
      model: 'Gamma Knife Esprit',
      source: 'Co-60 sealed source array',
      maximumWorkload: 'use maximum clinical workload until source activity and patient schedule are approved',
      materialDraft: 'Concreto alta densidad',
    },
    calculationScope: [
      'Co-60 decay and source inventory',
      'primary/leakage/scatter shielding review',
      'door/maze and treatment room adjacency',
      'structural load overlay using plan clue: LGK 36502 kg',
    ],
    requiredInputs: [
      'number of sources',
      'activity per source and reference date',
      'decay date for design scenario',
      'patients/week and beam-on/treatment workload',
      'isocenter coordinates on calibrated plan',
      'occupancy factor and design goal per adjacent area',
      'manufacturer site planning/shielding guide',
      'energy-specific TVL/HVL for selected material',
    ],
    clinicalWarnings: [
      'Co-60 decay date must be explicit in every report',
      'equipment structural load requires structural engineer review',
      'draft maximum workload can overdesign cost/weight if not reconciled with clinical schedule',
    ],
    readiness: 'ready-for-operator-data-entry',
    blockers: commonBlockers,
  },
  {
    equipmentId: 'centro-neuro-cyclone-kiube-18mev',
    label: 'IBA Cyclone KIUBE',
    modalityProfile: 'CY',
    roomId: 'centro-neuro-cyclotron',
    userProvided: {
      protonEnergyMeV: 18,
      maximumWorkload: 'use maximum target production workload until approved production schedule is provided',
      materialDraft: 'Concreto alta densidad',
    },
    calculationScope: [
      '18 MeV proton source-term review',
      'secondary neutron and prompt gamma shielding',
      'target vault, hot cell/radiofarmacia adjacency and exhaust route',
      'activation and controlled-area workflow',
      'penetration and maze/door review',
    ],
    requiredInputs: [
      'beam current uA and duty cycle',
      'targets/isotopes and weekly irradiation schedule',
      'self-shielding package and vendor source-term report',
      'exhaust/duct route and delay/filtration assumptions',
      'controlled/supervised/public occupancy map',
      'hot lab/radiofarmacia source inventory',
      'energy-specific TVL/HVL/neutron data for selected material',
    ],
    clinicalWarnings: [
      '18 MeV cyclotron design needs neutron, activation and exhaust review',
      'penetrations are critical paths and cannot remain generic',
      'draft maximum workload can overdesign cost/weight if not reconciled with production schedule',
    ],
    readiness: 'ready-for-operator-data-entry',
    blockers: commonBlockers,
  },
];

const occupancyWorksheet = [
  ['zoneId', 'adjacency', 'draftOccupancyFactorT', 'designGoalP', 'classification', 'needsUserApproval', 'notes'],
  ['occ-control-room', 'control rooms / operator areas', '1.0', 'pending', 'controlled or occupational', 'yes', 'Confirm with final floorplan and workload.'],
  ['occ-waiting-consult', 'waiting areas / consulting rooms', '1.0', 'pending', 'public or supervised', 'yes', 'High occupancy until room program is confirmed.'],
  ['occ-corridors', 'corridors / vestibules', '0.2', 'pending', 'public or supervised', 'yes', 'Use only as draft; confirm traffic and access control.'],
  ['occ-stairs', 'stairs / transient circulation', '0.125', 'pending', 'public or supervised', 'yes', 'Transient occupancy only if access pattern supports it.'],
  ['occ-service-exterior', 'service / exterior areas', '0.05', 'pending', 'controlled/service', 'yes', 'Confirm access, roof/floor exposure and maintenance occupancy.'],
];

const penetrationWorksheet = [
  ['penetrationId', 'type', 'roomOrBarrier', 'status', 'requiredData', 'notes'],
  ['pen-hvac', 'HVAC duct/offset', 'all shielded barriers', 'pending-markup', 'route, dimensions, lining, offset, material', 'Must be shielded as an explicit object.'],
  ['pen-electrical', 'cable tray/conduit', 'control/equipment barriers', 'pending-markup', 'route, conduit bank size, fill, sleeve detail', 'Likely near control rooms and equipment.'],
  ['pen-medgas-plumbing', 'medical gases/plumbing', 'treatment/service barriers', 'pending-markup', 'route, diameter, sleeve, equivalent shielding', 'No safe default assumption.'],
  ['pen-door-maze', 'door/maze joints', 'maze/door', 'pending-markup', 'door schedule, frame, overlap, neutron/poly/lead if needed', 'Critical for LINAC >10 MV and cyclotron.'],
  ['pen-cyclotron-exhaust', 'target/exhaust path', 'cyclotron/radiofarmacia', 'pending-markup', 'route, delay, filtration, activation assumptions', 'Critical for CY workflow.'],
];

const materialPreflight = {
  selectedMaterial: f341?.defaultMaterial?.label ?? 'Concreto alta densidad',
  materialId: f341?.defaultMaterial?.materialId ?? 'high-density-concrete-draft',
  densityKgM3Draft: f341?.defaultMaterial?.densityKgM3Draft ?? 3200,
  status: 'draft-only-until-versioned-evidence',
  requiredEvidence: [
    'density/datasheet with supplier or lab source',
    'energy-specific TVL/HVL for 15 MeV LINAC photon/leakage/scatter use',
    'neutron attenuation/removal evidence for LINAC >10 MV and cyclotron',
    'Co-60 TVL/HVL evidence for Gamma Knife Esprit',
    'cost, installation time and structural load assumptions',
    'document hash and page/citation link',
  ],
};

const clinicalWarnings = [
  'No signed shielding thickness is produced in F343.',
  'Distances below 0.3 m are blocked until geometry is verified.',
  'TVL values without source/version/page/hash must not be used for final design.',
  'Materials without validated density must remain draft-only.',
  'Versa HD 15 MeV requires neutron review.',
  'Cyclone KIUBE 18 MeV requires neutron, activation and exhaust review.',
  'Gamma Knife Esprit requires Co-60 activity and decay date.',
  'Final report requires RSO/qualified medical physicist review.',
];

const gates = [
  { id: 'f341-ready', pass: f341?.status === 'centro-neuro-calibrated-trial-ready', evidence: f341Path },
  { id: 'user-equipment-names-present', pass: equipmentPreflight.every((item) => item.label.length > 0), evidence: 'Versa HD, Gamma Knife Esprit, Cyclone KIUBE' },
  { id: 'user-energies-present', pass: equipmentPreflight.some((item) => item.userProvided.maximumEnergyMeV === 15) && equipmentPreflight.some((item) => item.userProvided.protonEnergyMeV === 18), evidence: '15 MeV LINAC, 18 MeV cyclotron' },
  { id: 'maximum-workload-gated', pass: conservativeWorkloadPolicy.signedCalculationUse === false, evidence: conservativeWorkloadPolicy.status },
  { id: 'three-equipment-preflights', pass: equipmentPreflight.length === 3, evidence: String(equipmentPreflight.length) },
  { id: 'blockers-present-for-every-equipment', pass: equipmentPreflight.every((item) => item.blockers.length >= commonBlockers.length), evidence: commonBlockers.join('|') },
  { id: 'occupancy-worksheet-ready', pass: occupancyWorksheet.length >= 5, evidence: 'f343_occupancy_penetration_worksheet.csv' },
  { id: 'penetration-worksheet-ready', pass: penetrationWorksheet.length >= 5, evidence: 'f343_occupancy_penetration_worksheet.csv' },
  { id: 'no-signed-calculation', pass: true, evidence: 'signedCalculationProduced=false' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const manifest = {
  schema: 'radshield-mx.f343.centro-neuro-preflight.v1',
  phase: 'F343',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'centro-neuro-preflight-ready-draft-blocked' : 'centro-neuro-preflight-gated',
  source: {
    f341Manifest: 'outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json',
    sourcePdfSha256: f341?.source?.sourcePdfSha256 ?? null,
    drawingScale: f341?.drawingScale ?? null,
    provisionalScale: f341?.provisionalScale ?? null,
  },
  conservativeWorkloadPolicy,
  equipmentPreflight,
  occupancyWorksheet: occupancyWorksheet.slice(1).map(([zoneId, adjacency, draftOccupancyFactorT, designGoalP, classification, needsUserApproval, notes]) => ({
    zoneId,
    adjacency,
    draftOccupancyFactorT: Number(draftOccupancyFactorT),
    designGoalP,
    classification,
    needsUserApproval: needsUserApproval === 'yes',
    notes,
  })),
  penetrationWorksheet: penetrationWorksheet.slice(1).map(([penetrationId, type, roomOrBarrier, status, requiredData, notes]) => ({
    penetrationId,
    type,
    roomOrBarrier,
    status,
    requiredData,
    notes,
  })),
  materialPreflight,
  clinicalWarnings,
  signedCalculationProduced: false,
  preflightHash: sha256Text(JSON.stringify({ equipmentPreflight, occupancyWorksheet, penetrationWorksheet, materialPreflight, clinicalWarnings })),
  gates,
  blockers,
  nextRecommendedPhase: 'F344: operator markup in canvas for rooms, barriers, penetrations and occupancy; then run draft calculations with citation-linked TVL/density evidence.',
};

fs.writeFileSync(path.join(outDir, 'f343_centro_neuro_preflight.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f343_equipment_preflight.csv'),
  [
    ['equipmentId', 'label', 'modalityProfile', 'roomId', 'maximumEnergyOrSource', 'readiness', 'blockers', 'requiredInputs'].map(csvCell).join(','),
    ...equipmentPreflight.map((item) => [
      item.equipmentId,
      item.label,
      item.modalityProfile,
      item.roomId,
      item.userProvided.maximumEnergyMeV ? `${item.userProvided.maximumEnergyMeV} MeV` : item.userProvided.protonEnergyMeV ? `${item.userProvided.protonEnergyMeV} MeV protons` : item.userProvided.source,
      item.readiness,
      item.blockers.join('; '),
      item.requiredInputs.join('; '),
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'f343_occupancy_penetration_worksheet.csv'),
  [
    '# occupancy',
    ...occupancyWorksheet.map((row) => row.map(csvCell).join(',')),
    '',
    '# penetrations',
    ...penetrationWorksheet.map((row) => row.map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F343 Centro Neuro Preflight',
  '',
  `Status: ${manifest.status}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  `Source drawing hash: ${manifest.source.sourcePdfSha256 ?? 'pending'}`,
  '',
  '## Equipment',
  ...equipmentPreflight.map((item) => `- ${item.label} (${item.modalityProfile}): ${item.requiredInputs.length} required inputs, blockers: ${item.blockers.join(', ')}.`),
  '',
  '## Conservative Workload Policy',
  conservativeWorkloadPolicy.caution,
  '',
  '## Material',
  `- ${materialPreflight.selectedMaterial}: ${materialPreflight.status}. Draft density: ${materialPreflight.densityKgM3Draft} kg/m3.`,
  ...materialPreflight.requiredEvidence.map((item) => `- Required evidence: ${item}.`),
  '',
  '## Occupancy Worksheet',
  ...manifest.occupancyWorksheet.map((item) => `- ${item.zoneId}: T=${item.draftOccupancyFactorT}, P=${item.designGoalP}, approval=${item.needsUserApproval}.`),
  '',
  '## Penetration Worksheet',
  ...manifest.penetrationWorksheet.map((item) => `- ${item.penetrationId}: ${item.type}, ${item.status}.`),
  '',
  '## Clinical Warnings',
  ...clinicalWarnings.map((item) => `- ${item}`),
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_343_centro_neuro_preflight.md'), md, 'utf8');

console.log(`F343 ${manifest.status}: ${equipmentPreflight.length} equipment preflights, ${gates.filter((gate) => gate.pass).length}/${gates.length} gates.`);
if (blockers.length) process.exit(1);
