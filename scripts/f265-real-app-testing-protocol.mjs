import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'lib', 'f265RealAppTestingProtocol.ts');
const f264Path = path.join(root, 'outputs', 'f264_real_clinical_trial_gate', 'f264_real_clinical_trial_gate.json');
const outDir = path.join(root, 'outputs', 'f265_real_app_testing_protocol');
const jsonPath = path.join(outDir, 'f265_real_app_testing_protocol.json');
const mdPath = path.join(root, 'outputs', 'fase_265_real_app_testing_protocol.md');

const source = fs.readFileSync(sourcePath, 'utf8');
const f264 = fs.existsSync(f264Path) ? JSON.parse(fs.readFileSync(f264Path, 'utf8')) : null;
const profiles = ['DX', 'TX', 'NM', 'CY'];
const stepIds = [...source.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);

const manifest = {
  phase: 'F265',
  schema: 'radshield-mx.real-app-testing-protocol.f265.v1',
  generatedAt: new Date().toISOString(),
  status: f264?.status === 'ready-for-real-app-testing' ? 'ready-for-operator-real-testing' : 'waiting-for-f264',
  prerequisite: {
    phase: 'F264',
    status: f264?.status ?? 'missing',
    manifest: path.relative(root, f264Path).replaceAll(path.sep, '/'),
  },
  profiles,
  stepIds,
  minimumRealCasesBeforeClinicalRelease: ['DX', 'TX', 'NM'],
  cyPolicy: 'CY/ciclotron can remain gated until a real cyclotron project is available.',
  evidenceToCapture: [
    'canvas screenshot with scale and zones',
    'equipment/source input snapshot',
    'material TVL/HVL density weight cost structural load snapshot',
    'calculation trace with formula/standard/inputs/outputs/citations',
    'base-vs-conservative comparison',
    'Memoria IA export',
    'PDF report export',
    'Evidence Pack export',
    'deviation log row for each mismatch',
  ],
  releaseRule:
    'No clinical signed release until DX/TX/NM real cases have no unresolved blocker/major deviations, and all limitations are visible in Memoria IA/PDF/Evidence.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F265 - Protocolo de pruebas reales de la app',
  '',
  `Estado: **${manifest.status}**`,
  `Prerequisito F264: **${manifest.prerequisite.status}**`,
  '',
  '## Perfiles a probar',
  '',
  ...profiles.map((profile) => `- ${profile}`),
  '',
  '## Pasos de prueba',
  '',
  ...stepIds.map((id) => `- ${id}`),
  '',
  '## Evidencia requerida',
  '',
  ...manifest.evidenceToCapture.map((item) => `- ${item}`),
  '',
  '## Regla de release',
  '',
  manifest.releaseRule,
  '',
].join('\n'), 'utf8');

console.log(`F265 real app testing protocol ${manifest.status}`);
