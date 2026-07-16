import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f172_release_candidate_final');
const jsonPath = path.join(outDir, 'f172_release_candidate_final.json');
const mdPath = path.join(root, 'outputs', 'fase_172_release_candidate_final.md');
mkdirSync(outDir, { recursive: true });

function readJson(relativePath) {
  const full = path.join(root, relativePath);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf8'));
}

function fileInfo(relativePath) {
  const full = path.join(root, relativePath);
  if (!existsSync(full)) return { path: relativePath, present: false, bytes: 0, sha256: null };
  const stat = statSync(full);
  const isFile = stat.isFile();
  return {
    path: relativePath,
    present: isFile,
    bytes: isFile ? stat.size : 0,
    sha256: isFile ? createHash('sha256').update(readFileSync(full)).digest('hex') : null,
  };
}

function git(args) {
  const result = spawnSync('C:\\Program Files\\Git\\cmd\\git.exe', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 5,
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

const manifests = {
  f168: readJson('outputs/f168_db_live_finalization/f168_db_live_finalization.json'),
  f169: readJson('outputs/f169_predeploy_numeric_db_qa/f169_predeploy_numeric_db_qa.json'),
  f170: readJson('outputs/f170_rag_citation_governance/f170_rag_citation_governance.json'),
  f170b: readJson('outputs/f170b_canonical_reindex/f170b_canonical_reindex.json'),
  f171: readJson('outputs/f171_canvas_polish_predeploy/f171_canvas_polish_predeploy.json'),
  f172a: readJson('outputs/f172a_arxiv_research/f172a_arxiv_research.json'),
  f153: readJson('outputs/f153_db_backup_restore/f153_db_backup_restore.json'),
  f154: readJson('outputs/f154_public_url_smoke/f154_public_url_smoke.json'),
  f155: readJson('outputs/f155_controlled_release_decision/f155_controlled_release_decision.json'),
  f156: readJson('outputs/f156_final_package/f156_final_package.json'),
  f159: readJson('outputs/f159_sites_hosting_prep/f159_sites_hosting_prep.json'),
  f167: readJson('outputs/f167_deploy_target_recovery/f167_deploy_target_recovery.json'),
};

const gitStatus = git(['status', '--short']);
const gitHead = git(['rev-parse', 'HEAD']);
const distIndex = fileInfo('dist/index.html');
const backendBoot = fileInfo('dist-backend/server/boot.js');

const gates = [
  {
    id: 'db-live',
    label: 'F168 DB live final',
    ok: manifests.f168?.status === 'db-live-ready',
    evidence: manifests.f168?.status || 'missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'numeric-db-qa',
    label: 'F169 numeric DB QA',
    ok: manifests.f169?.status === 'predeploy-numeric-ready',
    evidence: manifests.f169?.status || 'missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'rag-citations',
    label: 'F170 RAG citation governance',
    ok: manifests.f170?.status === 'rag-citation-governance-ready' && (manifests.f170?.releaseWarnings || []).length === 0,
    evidence: `${manifests.f170?.status || 'missing'} / warnings=${(manifests.f170?.releaseWarnings || []).length}`,
    blockingPublicDeploy: false,
  },
  {
    id: 'canonical-reindex',
    label: 'F170B canonical NCRP147/TG108 reindex',
    ok: manifests.f170b?.status === 'canonical-reindex-ready',
    evidence: `${manifests.f170b?.status || 'missing'} / chunks=${manifests.f170b?.chunkCount ?? 0}`,
    blockingPublicDeploy: false,
  },
  {
    id: 'canvas-polish',
    label: 'F171 canvas polish',
    ok: manifests.f171?.status === 'canvas-polish-predeploy-ready',
    evidence: manifests.f171?.status || 'missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'arxiv-research',
    label: 'F172A arXiv research methodology',
    ok: manifests.f172a?.status === 'arxiv-research-integrated',
    evidence: `${manifests.f172a?.status || 'missing'} / chunks=${manifests.f172a?.chunkCount ?? 0}`,
    blockingPublicDeploy: false,
  },
  {
    id: 'frontend-build',
    label: 'Production frontend build artifact',
    ok: distIndex.present,
    evidence: distIndex.present ? `${distIndex.bytes} bytes / ${distIndex.sha256}` : 'dist/index.html missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'backend-build',
    label: 'Production backend build artifact',
    ok: backendBoot.present,
    evidence: backendBoot.present ? `${backendBoot.bytes} bytes / ${backendBoot.sha256}` : 'dist-backend/server/boot.js missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'db-restore-probe',
    label: 'F153 DB restore probe',
    ok: ['ready', 'db-backup-restore-ready', 'restore-probe-ready'].includes(manifests.f153?.status),
    evidence: manifests.f153?.status || 'missing',
    blockingPublicDeploy: false,
  },
  {
    id: 'deploy-target',
    label: 'Deploy target and public URL smoke',
    ok: manifests.f154?.status === 'public-url-smoke-ready' && manifests.f155?.status === 'public-release-ready' && manifests.f167?.status === 'deploy-target-ready',
    evidence: `F154=${manifests.f154?.status || 'missing'}; F155=${manifests.f155?.status || 'missing'}; F167=${manifests.f167?.status || 'missing'}`,
    blockingPublicDeploy: true,
  },
];

const localBlockers = gates.filter((gate) => !gate.ok && !gate.blockingPublicDeploy);
const publicBlockers = gates.filter((gate) => !gate.ok && gate.blockingPublicDeploy);
const status = localBlockers.length === 0
  ? publicBlockers.length === 0
    ? 'public-deploy-ready'
    : 'controlled-offline-ready'
  : 'release-gated';

const manifest = {
  phase: 'F172',
  title: 'Release candidate final',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.release-candidate-final.f172.v1',
  status,
  git: {
    head: gitHead.ok ? gitHead.stdout : null,
    cleanAtGeneration: gitStatus.ok && gitStatus.stdout.length === 0,
    statusShort: gitStatus.stdout,
  },
  gates,
  artifacts: {
    frontend: distIndex,
    backend: backendBoot,
    f156PackageStatus: manifests.f156?.status || 'missing',
    f159SitesStatus: manifests.f159?.status || 'missing',
  },
  decisions: {
    localControlled: localBlockers.length === 0 ? 'GO' : 'NO-GO',
    publicDeploy: publicBlockers.length === 0 && localBlockers.length === 0 ? 'GO' : 'NO-GO',
    reason:
      localBlockers.length > 0
        ? `Local blockers: ${localBlockers.map((gate) => gate.label).join(', ')}`
        : publicBlockers.length > 0
          ? `Public deploy blockers: ${publicBlockers.map((gate) => gate.label).join(', ')}`
          : 'All release gates ready.',
  },
  releasePolicy: [
    'No new large feature work after F172 unless a smoke test fails.',
    'F172A research sources remain methodology/RAG support and do not override controlled constants.',
    'Public deploy requires reachable deploy target plus F154-F158 rerun against the final URL.',
    'Controlled local/offline RC is acceptable when all local gates pass and public deploy target is the only blocker.',
  ],
  nextPhases: [
    'F173 post-F172 visual smoke on local preview URL.',
    'F174 deploy target retry and F154-F158 rerun when Git/hosting access is available.',
    'F175 final handoff package with URL, DB restore notes and operator checklist.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F172 - Release Candidate Final',
  '',
  `Generado: ${manifest.generatedAt}`,
  `Estado: **${manifest.status}**`,
  `Decision local/controlada: **${manifest.decisions.localControlled}**`,
  `Decision deploy publico: **${manifest.decisions.publicDeploy}**`,
  `Motivo: ${manifest.decisions.reason}`,
  '',
  '## Gates',
  '',
  ...manifest.gates.map((gate) => `- ${gate.ok ? 'OK' : 'FAIL'} ${gate.label}: ${gate.evidence}`),
  '',
  '## Politica',
  '',
  ...manifest.releasePolicy.map((item) => `- ${item}`),
  '',
  '## Siguientes fases',
  '',
  ...manifest.nextPhases.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F172 release candidate final ${manifest.status}.`);
if (status === 'release-gated') process.exit(1);
