import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f293_static_release_refresh_real_trial');
fs.mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function sha256(fullPath) {
  return fs.existsSync(fullPath)
    ? crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex')
    : null;
}

function fileEvidence(relativePath) {
  const fullPath = path.join(root, relativePath);
  const present = fs.existsSync(fullPath);
  return {
    path: relativePath,
    present,
    bytes: present ? fs.statSync(fullPath).size : 0,
    sha256: present && fs.statSync(fullPath).isFile() ? sha256(fullPath) : null,
  };
}

function git(args) {
  const gitExe = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
  return execFileSync(gitExe, args, { cwd: root, encoding: 'utf8' }).trim();
}

const f291 = readJson('outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json');
const f292 = readJson('outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json');
const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const realTrialProtocol = [
  {
    order: 1,
    step: 'Select real case',
    operatorAction: 'Choose TX-LINAC, TX-Gamma Knife, TX-Braqui, CY-KIUBE, DX-CT or NM-PET from the F290/F291 matrix.',
    passEvidence: 'Case ID, modality profile and operator name recorded.',
  },
  {
    order: 2,
    step: 'Load floorplan',
    operatorAction: 'Import PNG/PDF background or converted DXF, then verify canvas/sidebar remain visible.',
    passEvidence: 'Canvas screenshot and import source hash/snapshot.',
  },
  {
    order: 3,
    step: 'Calibrate scale',
    operatorAction: 'Use a known dimension and confirm scale_m_per_pixel before drawing barriers.',
    passEvidence: 'Scale value, reference length and screenshot.',
  },
  {
    order: 4,
    step: 'Trace layout',
    operatorAction: 'Trace controlled/adjacent zones, barriers, doors and critical points.',
    passEvidence: 'Barrier/zone schedule plus visual export.',
  },
  {
    order: 5,
    step: 'Place equipment',
    operatorAction: 'Place equipment/source symbol and validate footprint, isocenter/source metadata, workload and modality.',
    passEvidence: 'Equipment schedule and selected profile.',
  },
  {
    order: 6,
    step: 'Assign material and goals',
    operatorAction: 'Assign material, thickness/layers, P/T/U/W, occupancy and structural/cost notes.',
    passEvidence: 'Material toolbox snapshot with TVL/density/mass/cost/load.',
  },
  {
    order: 7,
    step: 'Run calculation',
    operatorAction: 'Run calculations and inspect warnings, numeric trace, unit snapshot, cache key and base/conservative comparison.',
    passEvidence: 'F291/F237-style calculation evidence and warning list.',
  },
  {
    order: 8,
    step: 'Review visuals',
    operatorAction: 'Enable heatmap/isocontours and review regulatory legend before export.',
    passEvidence: 'Heatmap/isocontour snapshot with scale and legend.',
  },
  {
    order: 9,
    step: 'Export package',
    operatorAction: 'Export Memoria IA, PDF/report, Evidence Pack and 3D inspection snapshot.',
    passEvidence: 'Report files, citation IDs, source/page/chunk hashes and visual snapshots.',
  },
  {
    order: 10,
    step: 'Close deviations',
    operatorAction: 'Log differences against signed memory, classify blocker/major/minor and close with qualified review.',
    passEvidence: 'Deviation log and RSO/physicist decision.',
  },
];

const csvHeader = ['order', 'step', 'operatorAction', 'passEvidence'];
const csv = [
  csvHeader.join(','),
  ...realTrialProtocol.map((row) => csvHeader.map((key) => JSON.stringify(String(row[key] ?? ''))).join(',')),
].join('\n');

const artifacts = [
  fileEvidence('dist/index.html'),
  fileEvidence('outputs/f200_static_frontend_release_gate/radshield-mx-f200-static-dist.zip'),
  fileEvidence('outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json'),
  fileEvidence('outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json'),
  fileEvidence('outputs/fase_291_calculation_real_case_hardening.md'),
  fileEvidence('outputs/fase_292_real_project_floorplan_qa.md'),
];

const gates = [
  { id: 'f291-ready', pass: f291?.status === 'calculation-real-case-hardening-ready', evidence: 'outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json' },
  { id: 'f292-ready', pass: f292?.status === 'real-project-floorplan-qa-ready', evidence: 'outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json' },
  { id: 'f200-static-ready', pass: f200?.status === 'static-frontend-release-ready', evidence: 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json' },
  { id: 'dist-present', pass: artifacts[0].present && artifacts[0].bytes > 0, evidence: 'dist/index.html' },
  { id: 'static-archive-present', pass: artifacts[1].present && artifacts[1].bytes > 0, evidence: artifacts[1].path },
  { id: 'no-db-live-write', pass: f291?.liveDbWritePerformed === false, evidence: 'F291 liveDbWritePerformed=false' },
];

const blockers = [
  ...gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`),
  ...artifacts.filter((artifact) => !artifact.present).map((artifact) => `missing:${artifact.path}`),
];

const payload = {
  schema: 'radshield-mx.f293.static-release-refresh-real-trial.v1',
  phase: 'F293',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'static-release-refresh-real-trial-ready' : 'static-release-refresh-real-trial-gated',
  commitSha,
  worktreeClean: gitStatus.length === 0,
  publicDeployUrl: f200?.publicDeployUrl ?? 'https://radshield-mx-static-dist.vercel.app/',
  inputPhases: ['F200', 'F291', 'F292'],
  gates,
  artifacts,
  realTrialProtocol,
  publishInstruction: 'Upload/deploy the current dist or F200 static zip, then repeat public smoke against the final URL before clinical/regulatory use.',
  nextRecommendedPhase: blockers.length === 0
    ? 'F294 real guided smoke with one selected case and operator evidence.'
    : 'Resolve F293 blockers, rebuild, rerun F200/F291/F292, then repeat F293.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f293_static_release_refresh_real_trial.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f293_real_trial_operator_protocol.csv'), `${csv}\n`, 'utf8');

const md = [
  '# F293 Static Release Refresh + Real Trial Protocol',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  `Public URL: ${payload.publicDeployUrl}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Real Trial Protocol',
  ...realTrialProtocol.map((step) => `${step.order}. ${step.step}: ${step.operatorAction} Evidence: ${step.passEvidence}`),
  '',
  '## Publish Instruction',
  payload.publishInstruction,
  '',
  '## Next',
  payload.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_293_static_release_refresh_real_trial.md'), md, 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  commitSha: payload.commitSha,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'static-release-refresh-real-trial-ready') process.exit(1);
