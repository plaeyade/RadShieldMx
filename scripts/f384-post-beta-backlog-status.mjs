import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f384_post_beta_backlog');
fs.mkdirSync(outDir, { recursive: true });

const statusItems = [
  {
    id: 'babylon-runtime',
    label: 'Babylon runtime',
    status: 'gated',
    currentEvidence: ['safe adapter', 'runtime loader contract', 'install diagnostics'],
    blocker: 'Babylon packages are not active in package.json/runtime bundle; previous diagnostics recorded npm/network/EACCES gating.',
    nextGate: 'Install @babylonjs/core and @babylonjs/loaders in an isolated branch, activate runtime gate, run visual smoke with fallback to Three/R3F.',
    claim: 'Adapter-ready, not complete.',
  },
  {
    id: 'unity-webgl-external',
    label: 'Unity WebGL real external viewer',
    status: 'gated',
    currentEvidence: ['external handoff contract', 'launch packet', 'optional URL gate'],
    blocker: 'Requires a published Unity WebGL build URL and browser smoke. Unity is not bundled inside the React app.',
    nextGate: 'Publish Unity build externally, configure VITE_MEDICAL_3D_UNITY_WEBGL_URL, run visual smoke and handoff JSON round-trip.',
    claim: 'External bridge-ready, not complete.',
  },
  {
    id: 'dwg-provider',
    label: 'DWG provider',
    status: 'gated',
    currentEvidence: ['APS/ODA provider contract', 'fixture manifest', 'DWG->DXF/SVG/IFC boundary'],
    blocker: 'Requires non-sensitive DWG fixtures, provider credentials and layer/scale audit. Browser-native DWG remains out of scope.',
    nextGate: 'Run APS/ODA conversion smoke: DWG hash -> converted DXF/SVG -> layer map -> scale confirmation -> canvas import.',
    claim: 'Provider contract-ready, not complete.',
  },
  {
    id: 'mc-runners',
    label: 'GATE / EGSnrc / Geant4 runners',
    status: 'gated',
    currentEvidence: ['external runner contracts', 'preflight scripts', 'optional GATE health probe'],
    blocker: 'Requires installed engines or runner services, versioned datasets, source models, seeds, histories and known-case QA.',
    nextGate: 'Start with GATE/OpenGATE health + known PET/NM fixture; then EGSnrc photon/electron fixture; then Geant4 neutron/cyclotron fixture.',
    claim: 'Runner contract-ready, not clinical MC complete.',
  },
  {
    id: 'renderer-base-v2',
    label: 'Renderer base deeper rewrite',
    status: 'deferred-high-risk',
    currentEvidence: ['renderer/event-controller roadmap', 'F229/F231-F236 guardrails', 'CAD smokes'],
    blocker: 'A deeper renderer/event rewrite can regress canvas, sidebar and menus; it needs branch/flag, pixel diff and rollback.',
    nextGate: 'Create renderer-v2 branch/flag, run baseline pixel screenshots, implement event controller incrementally, repeat F197/F207/F229/F231-F236/F200.',
    claim: 'Planned, not implemented.',
  },
  {
    id: 'advanced-photorealism',
    label: 'Advanced photorealism',
    status: 'partially-ready',
    currentEvidence: ['Three/R3F PBR presets', 'photoreal walkthrough readiness', 'visual evidence pack'],
    blocker: 'Current path is Three/R3F procedural/PBR readiness; Babylon/Unity-grade realism still needs external/runtime gates.',
    nextGate: 'Improve Three/R3F assets and lighting safely; defer Babylon/Unity high-fidelity until their runtime gates pass.',
    claim: 'Three/R3F readiness implemented; full photorealism not complete.',
  },
];

const manifest = {
  phase: 'F384',
  generatedAt: new Date().toISOString(),
  status: 'post-beta-backlog-truth-table-ready',
  completedNow: [
    'F378 P0 spatial dialog backlog is closed by F379-F382.',
    'BarrierEditor, AirKermaOverlay and ControlPointsDialog are DialogShell-controlled.',
  ],
  notCompletedAsProductionFeatures: statusItems
    .filter((item) => item.status !== 'partially-ready')
    .map((item) => item.label),
  statusItems,
  releaseRule:
    'Do not market Babylon runtime, Unity WebGL real viewer, DWG live conversion or clinical Monte Carlo runners as complete until their live smoke gates pass.',
};

fs.writeFileSync(path.join(outDir, 'f384_post_beta_backlog_status.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(outDir, 'f384_post_beta_backlog_status.md'),
  [
    '# F384 Post-Beta Backlog Status',
    '',
    `Status: ${manifest.status}`,
    '',
    '## Completed now',
    ...manifest.completedNow.map((item) => `- ${item}`),
    '',
    '## Heavy backlog truth table',
    ...statusItems.map((item) => [
      `### ${item.label}`,
      `- Status: ${item.status}`,
      `- Claim: ${item.claim}`,
      `- Blocker: ${item.blocker}`,
      `- Next gate: ${item.nextGate}`,
    ].join('\n')),
    '',
    `Release rule: ${manifest.releaseRule}`,
    '',
  ].join('\n'),
);

console.log(`F384 post-beta backlog status written to ${outDir}`);
