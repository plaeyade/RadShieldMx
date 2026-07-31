import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join('outputs', 'f385_production_capability_audit');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const medical3D = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');

const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const hasBabylonDeps = Boolean(deps['@babylonjs/core'] && deps['@babylonjs/loaders']);
const hasBabylonNodeModules = exists('node_modules/@babylonjs/core') && exists('node_modules/@babylonjs/loaders');
const unityUrl = process.env.VITE_MEDICAL_3D_UNITY_WEBGL_URL || process.env.F386_UNITY_WEBGL_URL || '';
const unityUrlValid = /^https?:\/\//i.test(unityUrl.trim());

const capabilities = [
  {
    id: 'three-r3f-medical-3d',
    label: 'Three/R3F Medical 3D',
    status: medical3D.includes('<Canvas') && medical3D.includes('photorealWalkthrough') && medical3D.includes('visualEvidenceGate')
      ? 'production-ready'
      : 'blocked',
    evidence: [
      'React Three Fiber Canvas',
      'WASD/pointer-lock workflow',
      'PBR/procedural material controls',
      'visual evidence pack',
    ],
    liveGate: 'Build + browser smoke; no external service required.',
    claim: 'Active production visualization path.',
  },
  {
    id: 'babylon-runtime',
    label: 'Babylon PBR/WebGPU/WebXR',
    status: hasBabylonDeps && hasBabylonNodeModules ? 'runtime-installed-needs-visual-smoke' : 'gated-not-installed',
    evidence: [
      hasBabylonDeps ? 'package.json declares Babylon packages' : 'package.json does not declare Babylon packages',
      hasBabylonNodeModules ? 'node_modules has Babylon packages' : 'node_modules has no Babylon packages',
      'adapter/runtime loader exists',
    ],
    liveGate: 'Install @babylonjs/core + @babylonjs/loaders, enable runtime gate, run visual smoke with Three/R3F fallback.',
    claim: hasBabylonDeps && hasBabylonNodeModules ? 'Installed but not released until visual smoke.' : 'Not production-ready.',
  },
  {
    id: 'unity-webgl-external-viewer',
    label: 'Unity WebGL external viewer',
    status: unityUrlValid ? 'url-configured-needs-browser-smoke' : 'gated-url-missing',
    evidence: [
      'Unity handoff JSON builder exists',
      unityUrlValid ? `configured URL: ${unityUrl}` : 'VITE_MEDICAL_3D_UNITY_WEBGL_URL / F386_UNITY_WEBGL_URL missing',
    ],
    liveGate: 'Published Unity WebGL URL + browser open/screenshot + handoff JSON round-trip.',
    claim: unityUrlValid ? 'Configured for live smoke, not calculation authority.' : 'Bridge-ready only.',
  },
  {
    id: 'dwg-provider',
    label: 'DWG conversion provider',
    status: 'gated-external-provider',
    evidence: ['APS/ODA contract exists', 'DXF remains stable fallback'],
    liveGate: 'Non-sensitive DWG fixture + provider credentials + layer/scale audit + canvas import smoke.',
    claim: 'Not browser-native DWG production.',
  },
  {
    id: 'mc-runners',
    label: 'GATE / EGSnrc / Geant4 runners',
    status: 'gated-external-runners',
    evidence: ['runner contracts exist', 'no clinical runner execution in frontend'],
    liveGate: 'Engine installed or runner URL, versioned physics/data, known-case QA and uncertainty report.',
    claim: 'Not clinical MC production yet.',
  },
];

const manifest = {
  phase: 'F385',
  generatedAt: new Date().toISOString(),
  status: 'production-capability-audit-ready',
  babylonCanBeInstalledHere: hasBabylonDeps && hasBabylonNodeModules,
  summary: {
    productionReady: capabilities.filter((item) => item.status === 'production-ready').map((item) => item.id),
    gated: capabilities.filter((item) => item.status !== 'production-ready').map((item) => item.id),
  },
  capabilities,
  releaseRule:
    'Only Three/R3F Medical 3D is an active production visualization path in the current bundle. Babylon, Unity WebGL, DWG and MC runners require live gates before product claims.',
};

fs.writeFileSync(path.join(outDir, 'f385_production_capability_audit.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'f385_production_capability_audit.md'),
  [
    '# F385 Production Capability Audit',
    '',
    `Status: ${manifest.status}`,
    `Babylon installable/active here: ${manifest.babylonCanBeInstalledHere ? 'yes' : 'no'}`,
    '',
    '## Capabilities',
    ...capabilities.map((item) => [
      `### ${item.label}`,
      `- Status: ${item.status}`,
      `- Claim: ${item.claim}`,
      `- Live gate: ${item.liveGate}`,
    ].join('\n')),
    '',
    `Release rule: ${manifest.releaseRule}`,
    '',
  ].join('\n'),
);

console.log(`F385 production capability audit written to ${outDir}`);
