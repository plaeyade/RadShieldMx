import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePdf = process.env.F339_REAL_PDF || 'C:/Users/carlo/Desktop/ZUMAYA/CENTRO NEURO PLANTA BAJA 040626.pdf';
const outDir = path.join(root, 'outputs', 'f339_real_case_centro_neuro');
const renderedPrefix = path.join(outDir, 'centro_neuro_page');
const renderedPage = path.join(outDir, 'centro_neuro_page-1.png');
const textPath = path.join(outDir, 'centro_neuro_text.txt');
fs.mkdirSync(outDir, { recursive: true });

const popplerCandidates = {
  pdfinfo: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdfinfo.exe',
    'C:/Program Files/Calibre2/app/bin/pdfinfo.exe',
    'pdfinfo',
  ],
  pdftoppm: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe',
    'C:/Program Files/Calibre2/app/bin/pdftoppm.exe',
    'pdftoppm',
  ],
  pdftotext: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftotext.exe',
    'C:/Program Files/Calibre2/app/bin/pdftotext.exe',
    'pdftotext',
  ],
};

function which(candidates) {
  for (const candidate of candidates) {
    try {
      if (candidate.includes('/') || candidate.includes('\\')) {
        if (fs.existsSync(candidate)) return candidate;
      } else {
        execFileSync(candidate, ['-v'], { stdio: 'ignore' });
        return candidate;
      }
    } catch {
      // Continue searching.
    }
  }
  return null;
}

function run(command, args) {
  if (!command) return { status: 127, stdout: '', stderr: 'missing-command' };
  try {
    const stdout = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout?.toString?.() ?? '',
      stderr: error.stderr?.toString?.() ?? String(error.message ?? error),
    };
  }
}

function sha256(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function parsePdfInfo(text) {
  const info = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) info[match[1].trim()] = match[2].trim();
  }
  return info;
}

const pdfExists = fs.existsSync(sourcePdf);
const pdfinfo = which(popplerCandidates.pdfinfo);
const pdftoppm = which(popplerCandidates.pdftoppm);
const pdftotext = which(popplerCandidates.pdftotext);
const pdfInfoRun = pdfExists ? run(pdfinfo, [sourcePdf]) : { status: 1, stdout: '', stderr: 'missing-pdf' };
if (pdfInfoRun.stdout) fs.writeFileSync(path.join(outDir, 'pdfinfo.txt'), pdfInfoRun.stdout, 'utf8');

let textLength = 0;
let textWarning = '';
if (pdfExists && pdftotext) {
  const extracted = run(pdftotext, ['-layout', '-enc', 'UTF-8', sourcePdf, textPath]);
  if (extracted.status !== 0) textWarning = extracted.stderr.slice(0, 240);
  if (fs.existsSync(textPath)) textLength = fs.readFileSync(textPath, 'utf8').trim().length;
}

let renderStatus = 'not-run';
if (pdfExists && pdftoppm) {
  const rendered = run(pdftoppm, ['-f', '1', '-l', '1', '-png', '-r', '150', sourcePdf, renderedPrefix]);
  renderStatus = rendered.status === 0 && fs.existsSync(renderedPage) ? 'rendered' : `render-failed:${rendered.stderr.slice(0, 180)}`;
}

const f331F338 = fs.existsSync(path.join(root, 'outputs/f331_f338_static_release_close/f331_f338_static_release_close.json'))
  ? JSON.parse(fs.readFileSync(path.join(root, 'outputs/f331_f338_static_release_close/f331_f338_static_release_close.json'), 'utf8'))
  : null;

const floorPlanSeedCandidate = {
  schema: 'radshield-mx.f339.centro-neuro.floorplan-seed.v1',
  sourcePdf,
  sourcePdfSha256: sha256(sourcePdf),
  renderedPage: path.relative(root, renderedPage).replaceAll(path.sep, '/'),
  backgroundMode: 'pdf-rendered-png-for-canvas',
  scalePolicy: 'Operator must calibrate scale from a known dimension before calculation; no signed thickness is produced from image-only scale.',
  detectedRooms: [
    {
      id: 'centro-neuro-cyclotron',
      label: 'CYCLOTRON',
      modalityProfile: 'CY',
      imageBboxApprox: { x: 380, y: 30, width: 430, height: 255 },
      equipmentSymbol: 'cyclotron-vault',
      primaryUse: 'Cyclotron vault and production/radiofarmacia adjacency review.',
    },
    {
      id: 'centro-neuro-radiofarmacia',
      label: 'RADIOFARMACIA',
      modalityProfile: 'NM',
      imageBboxApprox: { x: 380, y: 260, width: 430, height: 485 },
      equipmentSymbol: 'hot-lab',
      primaryUse: 'Hot lab, uptake/support and controlled area workflow context.',
    },
    {
      id: 'centro-neuro-lgk',
      label: 'LGK (GAMAKNIFE)',
      modalityProfile: 'TX',
      imageBboxApprox: { x: 385, y: 925, width: 210, height: 190 },
      equipmentSymbol: 'gamma-knife',
      visibleEquipmentWeightKg: 36502,
      primaryUse: 'Gamma Knife shielding room and structural load evidence.',
    },
    {
      id: 'centro-neuro-linac',
      label: 'LINAC',
      modalityProfile: 'TX',
      imageBboxApprox: { x: 670, y: 1300, width: 190, height: 180 },
      equipmentSymbol: 'linac',
      visibleEquipmentWeightKg: 3341,
      primaryUse: 'LINAC bunker shielding and barrier validation workflow.',
    },
  ],
};

const trialScenarios = [
  {
    caseId: 'F339-CY-CENTRO-NEURO-CYCLOTRON-001',
    equipment: 'Cyclotron',
    modalityProfile: 'CY',
    roomId: 'centro-neuro-cyclotron',
    calculationRoute: ['neutron/gamma shielding', 'activation', 'maze/penetrations', 'controlled zone', 'radiofarmacia adjacency'],
    requiredOperatorInputs: ['cyclotron model', 'proton energy MeV', 'beam current uA', 'weekly workload', 'targets', 'self-shielding', 'maze/door details', 'vendor source term'],
    status: 'ready-for-setup',
  },
  {
    caseId: 'F339-TX-CENTRO-NEURO-LGK-001',
    equipment: 'Gamma Knife / LGK',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-lgk',
    calculationRoute: ['Co-60 source inventory', 'primary/leakage/scatter', 'controlled areas', 'structural equipment load', 'report appendix'],
    requiredOperatorInputs: ['LGK model', 'activity/source date', 'workload/patients', 'occupancy map', 'door/window schedule', 'existing wall material/density'],
    status: 'ready-for-setup',
  },
  {
    caseId: 'F339-TX-CENTRO-NEURO-LINAC-001',
    equipment: 'LINAC',
    modalityProfile: 'TX',
    roomId: 'centro-neuro-linac',
    calculationRoute: ['NCRP 151 primary barrier', 'secondary/leakage/scatter', 'neutrons if energy >10 MV', 'maze/door', 'heatmap/Medical 3D evidence'],
    requiredOperatorInputs: ['LINAC model', 'energy MV', 'workload Gy/wk', 'use factors', 'occupancy factors', 'barrier material/density', 'maze and door details'],
    status: 'ready-for-setup',
  },
];

const operatorChecklist = [
  'Import rendered PDF page as canvas background or convert source CAD to DXF if available.',
  'Calibrate scale from a known architectural dimension before drawing barriers.',
  'Trace Cyclotron, Radiofarmacia, Gamma Knife and LINAC rooms as layers/zones.',
  'Place equipment symbols and record footprint, weight and source/isocenter metadata.',
  'Assign materials, TVL/density/cost/time/structural load evidence per barrier.',
  'Run modality-specific calculations only after source terms and occupancy are confirmed.',
  'Open Medical 3D, capture sceneHash/PNG/JSON for each scenario.',
  'Generate Memoria IA, PDF and Evidence Pack with citations, warnings and deviation log.',
];

const gates = [
  { id: 'source-pdf-present', pass: pdfExists, evidence: sourcePdf },
  { id: 'source-hash-ready', pass: Boolean(sha256(sourcePdf)), evidence: sha256(sourcePdf) ?? 'missing' },
  { id: 'pdfinfo-readable', pass: pdfInfoRun.status === 0 && parsePdfInfo(pdfInfoRun.stdout).Pages === '1', evidence: 'outputs/f339_real_case_centro_neuro/pdfinfo.txt' },
  { id: 'first-page-rendered', pass: renderStatus === 'rendered', evidence: 'outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png' },
  { id: 'three-scenarios-ready', pass: trialScenarios.length === 3 && trialScenarios.every((item) => item.status === 'ready-for-setup'), evidence: 'cyclotron,gamma-knife,linac' },
  { id: 'f331-f338-ready', pass: f331F338?.status === 'f331-f338-static-release-close-ready', evidence: 'outputs/f331_f338_static_release_close/f331_f338_static_release_close.json' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const manifest = {
  schema: 'radshield-mx.f339.real-case-centro-neuro.v1',
  phase: 'F339',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'real-case-centro-neuro-ready-for-operator-trial' : 'real-case-centro-neuro-gated',
  clinicalUsePolicy: 'F339 prepares a real project trial from the supplied architectural PDF. It does not certify shielding until scale, source terms, material evidence, occupancy and qualified review are completed.',
  pdfSource: {
    path: sourcePdf,
    exists: pdfExists,
    bytes: pdfExists ? fs.statSync(sourcePdf).size : 0,
    sha256: sha256(sourcePdf),
    info: parsePdfInfo(pdfInfoRun.stdout),
    textLength,
    textWarning,
    renderStatus,
  },
  floorPlanSeedCandidate,
  trialScenarios,
  operatorChecklist,
  gates,
  blockers,
  nextRecommendedPhase: blockers.length === 0
    ? 'F340: execute browser trial for Centro Neuro with canvas import, scale calibration, room tracing, equipment placement, Medical 3D snapshots and report exports.'
    : 'Resolve F339 gates, re-render source PDF and repeat F339 before browser execution.',
};

fs.writeFileSync(path.join(outDir, 'f339_real_case_centro_neuro.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f339_floorplan_seed_candidate.json'), `${JSON.stringify(floorPlanSeedCandidate, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f339_trial_scenarios.csv'),
  [
    'caseId,equipment,modalityProfile,roomId,status,requiredOperatorInputs',
    ...trialScenarios.map((item) => [
      item.caseId,
      item.equipment,
      item.modalityProfile,
      item.roomId,
      item.status,
      item.requiredOperatorInputs.join('; '),
    ].map((value) => JSON.stringify(String(value))).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F339 Real Case - Centro Neuro Planta Baja',
  '',
  `Status: ${manifest.status}`,
  `Source SHA256: ${manifest.pdfSource.sha256}`,
  `Rendered page: ${floorPlanSeedCandidate.renderedPage}`,
  '',
  '## Rooms Detected',
  ...floorPlanSeedCandidate.detectedRooms.map((room) => `- ${room.label}: ${room.modalityProfile}, ${room.primaryUse}`),
  '',
  '## Trial Scenarios',
  ...trialScenarios.map((item) => `- ${item.caseId}: ${item.equipment}. Route: ${item.calculationRoute.join(' -> ')}.`),
  '',
  '## Operator Checklist',
  ...operatorChecklist.map((item) => `- ${item}`),
  '',
  '## Clinical Use Policy',
  manifest.clinicalUsePolicy,
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_339_real_case_centro_neuro.md'), md, 'utf8');
console.log(`F339 ${manifest.status}: ${trialScenarios.length} scenarios, ${gates.filter((gate) => gate.pass).length}/${gates.length} gates.`);
if (blockers.length) process.exit(1);
