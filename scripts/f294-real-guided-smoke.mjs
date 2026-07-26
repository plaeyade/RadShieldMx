import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f294_real_guided_smoke');
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

function csvEscape(value) {
  return JSON.stringify(String(value ?? ''));
}

const f291 = readJson('outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json');
const f292 = readJson('outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json');
const f293 = readJson('outputs/f293_static_release_refresh_real_trial/f293_static_release_refresh_real_trial.json');
const selectedCaseId = process.env.F294_CASE_ID || 'TX-LINAC-6MV-001';
const selectedCase = f291?.cases?.find((item) => item.caseId === selectedCaseId) ?? null;
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const operatorEvidenceChecklist = [
  {
    order: 1,
    item: 'Case selection',
    expectedEvidence: 'Selected case ID, modality profile, operator name and review date.',
    requiredForPass: true,
  },
  {
    order: 2,
    item: 'Floorplan visibility',
    expectedEvidence: 'Screenshot proving canvas, sidebar and quick tools remain visible after opening the app.',
    requiredForPass: true,
  },
  {
    order: 3,
    item: 'Plan import',
    expectedEvidence: 'Imported PNG/PDF or converted DXF source hash, import mode and visible background/layers.',
    requiredForPass: true,
  },
  {
    order: 4,
    item: 'Scale calibration',
    expectedEvidence: 'Reference length, scale_m_per_pixel, unit snapshot and screenshot.',
    requiredForPass: true,
  },
  {
    order: 5,
    item: 'Layout tracing',
    expectedEvidence: 'Barrier schedule, controlled/adjacent zones, doors, critical points and layer state.',
    requiredForPass: true,
  },
  {
    order: 6,
    item: 'Equipment placement',
    expectedEvidence: 'Equipment symbol, footprint, source/isocenter metadata, workload and modality profile.',
    requiredForPass: true,
  },
  {
    order: 7,
    item: 'Material assignment',
    expectedEvidence: 'Material toolbox snapshot with TVL, density, mass, cost, time and structural load.',
    requiredForPass: true,
  },
  {
    order: 8,
    item: 'Calculation trace',
    expectedEvidence: 'Formula IDs, standards, inputs, outputs, assumptions, warnings, comparison and cache key.',
    requiredForPass: true,
  },
  {
    order: 9,
    item: 'Visual review',
    expectedEvidence: 'Heatmap/isocontour export with regulatory legend and scale annotation.',
    requiredForPass: true,
  },
  {
    order: 10,
    item: 'Report and closeout',
    expectedEvidence: 'Memoria IA/PDF/Evidence Pack/3D snapshots plus deviation log and qualified review decision.',
    requiredForPass: true,
  },
];

const deviationLogTemplate = [
  {
    deviationId: 'F294-DEV-001',
    caseId: selectedCaseId,
    severity: 'blocker|major|minor',
    area: 'canvas|calculation|rag|report|3d|workflow',
    observed: '',
    expected: '',
    evidencePath: '',
    owner: '',
    disposition: 'open|accepted-risk|fixed|retest-pass',
  },
];

const gates = [
  {
    id: 'f293-ready',
    pass: f293?.status === 'static-release-refresh-real-trial-ready',
    evidence: 'outputs/f293_static_release_refresh_real_trial/f293_static_release_refresh_real_trial.json',
  },
  {
    id: 'selected-case-exists',
    pass: Boolean(selectedCase),
    evidence: selectedCaseId,
  },
  {
    id: 'selected-case-ready',
    pass: selectedCase?.status === 'ready',
    evidence: selectedCase?.status ?? 'missing',
  },
  {
    id: 'f292-floorplan-qa-ready',
    pass: f292?.status === 'real-project-floorplan-qa-ready',
    evidence: 'outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json',
  },
  {
    id: 'operator-checklist-complete',
    pass: operatorEvidenceChecklist.length >= 10 && operatorEvidenceChecklist.every((item) => item.requiredForPass),
    evidence: 'outputs/f294_real_guided_smoke/f294_operator_evidence_checklist.csv',
  },
  {
    id: 'deviation-log-template',
    pass: deviationLogTemplate.length > 0,
    evidence: 'outputs/f294_real_guided_smoke/f294_deviation_log_template.csv',
  },
  {
    id: 'no-db-live-write',
    pass: f291?.liveDbWritePerformed === false,
    evidence: 'F291 liveDbWritePerformed=false',
  },
];

const artifacts = [
  fileEvidence('dist/index.html'),
  fileEvidence('outputs/f200_static_frontend_release_gate/radshield-mx-f200-static-dist.zip'),
  fileEvidence('outputs/f293_static_release_refresh_real_trial/f293_static_release_refresh_real_trial.json'),
  fileEvidence('outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json'),
  fileEvidence('outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json'),
];

const blockers = [
  ...gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`),
  ...artifacts.filter((artifact) => !artifact.present).map((artifact) => `missing:${artifact.path}`),
];

const payload = {
  schema: 'radshield-mx.f294.real-guided-smoke.v1',
  phase: 'F294',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'real-guided-smoke-ready' : 'real-guided-smoke-gated',
  commitSha,
  worktreeClean: gitStatus.length === 0,
  selectedCaseId,
  selectedCase,
  publicDeployUrl: f293?.publicDeployUrl ?? 'https://radshield-mx-static-dist.vercel.app/',
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  inputPhases: ['F291', 'F292', 'F293'],
  gates,
  artifacts,
  operatorEvidenceChecklist,
  deviationLogTemplate,
  clinicalUsePolicy: 'F294 is an operator-guided smoke protocol and evidence package. It is not clinical certification and requires qualified physicist/RSO review before signed regulatory use.',
  nextRecommendedPhase: blockers.length === 0
    ? 'F295 execute the guided smoke in browser/public URL with screenshots and closed deviation log.'
    : 'Resolve F294 gates, choose a ready F291 case, refresh F293, then rerun F294.',
  blockers,
};

const checklistHeader = ['order', 'item', 'expectedEvidence', 'requiredForPass'];
const checklistCsv = [
  checklistHeader.join(','),
  ...operatorEvidenceChecklist.map((row) => checklistHeader.map((key) => csvEscape(row[key])).join(',')),
].join('\n');

const deviationHeader = ['deviationId', 'caseId', 'severity', 'area', 'observed', 'expected', 'evidencePath', 'owner', 'disposition'];
const deviationCsv = [
  deviationHeader.join(','),
  ...deviationLogTemplate.map((row) => deviationHeader.map((key) => csvEscape(row[key])).join(',')),
].join('\n');

fs.writeFileSync(path.join(outDir, 'f294_real_guided_smoke.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f294_operator_evidence_checklist.csv'), `${checklistCsv}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f294_deviation_log_template.csv'), `${deviationCsv}\n`, 'utf8');

const md = [
  '# F294 Real Guided Smoke',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  `Selected case: ${payload.selectedCaseId}`,
  `Public URL: ${payload.publicDeployUrl}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Operator Evidence Checklist',
  ...operatorEvidenceChecklist.map((item) => `${item.order}. ${item.item}: ${item.expectedEvidence}`),
  '',
  '## Clinical Use Policy',
  payload.clinicalUsePolicy,
  '',
  '## Next',
  payload.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_294_real_guided_smoke.md'), md, 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  selectedCaseId,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'real-guided-smoke-ready') process.exit(1);
