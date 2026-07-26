import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f313_nist_xcom_mixture_rag');
fs.mkdirSync(outDir, { recursive: true });

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

function git(args) {
  const gitExe = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
  return execFileSync(gitExe, args, { cwd: root, encoding: 'utf8' }).trim();
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const xcom = read('src/lib/xcomAttenuation.ts');
const dialog = read('src/sections/dialogs/NistXcomDialog.tsx');
const bibliography = read('src/lib/bibliography.ts');
const commitSha = git(['rev-parse', 'HEAD']);
const gitStatus = git(['status', '--short']);

const chunks = [
  {
    documentId: 'NIST-XCOM-SRD8',
    source: 'NIST XCOM Photon Cross Sections Database',
    url: 'https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html',
    modality: 'Materials',
    page: 'web',
    priority: 'reference',
    tags: ['F313', 'NIST', 'XCOM', 'mu/rho', 'attenuation', 'mixtures', 'materials'],
    content: 'NIST XCOM is used in RadShield-MX as a photon attenuation reference for elements, compounds and mixtures. It supports material comparison and mixture attenuation by weight fraction, while NCRP/IAEA/UAQ remain the design methodology sources for clinical shielding reports.',
  },
  {
    documentId: 'NIST-XCOM-MIXTURE-METHOD',
    source: 'RadShield-MX F313 XCOM mixture method',
    url: 'local:src/lib/xcomAttenuation.ts',
    modality: 'Materials',
    page: 'F313',
    priority: 'derived-method',
    tags: ['F313', 'mixture', 'weight-fraction', 'density', 'HVL', 'TVL'],
    content: 'For a mixture, RadShield-MX normalizes positive weight fractions, combines mass attenuation coefficients by weighted sum, multiplies by mixture density to get linear attenuation, then derives HVL=ln(2)/mu and TVL=ln(10)/mu. Results above diagnostic energies carry a warning to validate broad-beam TVL with NCRP/IAEA/UAQ.',
  },
];

const chunkJsonl = chunks.map((chunk) => JSON.stringify({
  ...chunk,
  sourceHash: sha256(`${chunk.documentId}|${chunk.url}`),
  chunkHash: sha256(chunk.content),
})).join('\n');

fs.writeFileSync(path.join(outDir, 'f313_xcom_rag_seed_candidate.jsonl'), `${chunkJsonl}\n`, 'utf8');

const gates = [
  {
    id: 'xcom-source-trace',
    pass: xcom.includes('XCOM_SOURCE_TRACE') && xcom.includes('https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html'),
    evidence: 'src/lib/xcomAttenuation.ts',
  },
  {
    id: 'mixture-attenuation-method',
    pass: xcom.includes('buildXcomMixtureAttenuation') && xcom.includes('normalizeWeightFractions') && xcom.includes('mu_cm2_per_g') && xcom.includes('tenthValueLayer_mm'),
    evidence: 'src/lib/xcomAttenuation.ts',
  },
  {
    id: 'dialog-mixture-ui',
    pass: dialog.includes('Mezcla XCOM por fraccion en peso') && dialog.includes('buildXcomMixtureAttenuation') && dialog.includes('TVL mezcla'),
    evidence: 'src/sections/dialogs/NistXcomDialog.tsx',
  },
  {
    id: 'bibliography-has-nist-xcom',
    pass: bibliography.includes('NIST XCOM') && bibliography.includes('https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html'),
    evidence: 'src/lib/bibliography.ts',
  },
  {
    id: 'rag-seed-candidate',
    pass: chunkJsonl.includes('NIST-XCOM-SRD8') && chunkJsonl.includes('chunkHash') && chunkJsonl.includes('sourceHash'),
    evidence: 'outputs/f313_nist_xcom_mixture_rag/f313_xcom_rag_seed_candidate.jsonl',
  },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const payload = {
  schema: 'radshield-mx.f313.nist-xcom-mixture-rag.v1',
  generatedAt: new Date().toISOString(),
  commitSha,
  worktreeClean: gitStatus.length === 0,
  status: blockers.length === 0 ? 'nist-xcom-mixture-rag-ready' : 'nist-xcom-mixture-rag-gated',
  sourcePolicy: {
    canUse: true,
    useFor: ['photon attenuation support', 'material mixture comparison', 'diagnostic energy HVL/TVL exploration', 'RAG citations with source hash'],
    doNotUseFor: ['standalone certified shielding design', 'neutron shielding', 'broad-beam MV TVL without NCRP/IAEA validation'],
    dbMode: 'seed-candidate-jsonl; DB live write remains a separate controlled seed.',
  },
  gates,
  nextRecommendedPhase: 'F314: Babylon runtime branch/flag installation after F313 build passes.',
  blockers,
};

fs.writeFileSync(path.join(outDir, 'f313_nist_xcom_mixture_rag.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_313_nist_xcom_mixture_rag.md'), [
  '# F313 NIST XCOM Mixture RAG',
  '',
  `Status: ${payload.status}`,
  `Commit: ${payload.commitSha}`,
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.pass ? 'PASS' : 'FAIL'} ${gate.id}: ${gate.evidence}`),
  '',
  '## Politica',
  `- Usar para: ${payload.sourcePolicy.useFor.join(', ')}`,
  `- No usar para: ${payload.sourcePolicy.doNotUseFor.join(', ')}`,
  `- DB: ${payload.sourcePolicy.dbMode}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: payload.status,
  gates: gates.map((gate) => `${gate.id}:${gate.pass ? 'pass' : 'fail'}`),
  blockers,
}, null, 2));

if (payload.status !== 'nist-xcom-mixture-rag-ready') process.exit(1);
