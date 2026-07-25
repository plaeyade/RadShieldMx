import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'lib', 'f266RealCaseEvidenceKit.ts');
const f265Path = path.join(root, 'outputs', 'f265_real_app_testing_protocol', 'f265_real_app_testing_protocol.json');
const outDir = path.join(root, 'outputs', 'f266_real_case_evidence_kit');
const jsonPath = path.join(outDir, 'f266_real_case_evidence_kit.json');
const mdPath = path.join(root, 'outputs', 'fase_266_real_case_evidence_kit.md');
const csvPath = path.join(outDir, 'real_case_deviation_log_template.csv');

const source = fs.readFileSync(sourcePath, 'utf8');
const f265 = fs.existsSync(f265Path) ? JSON.parse(fs.readFileSync(f265Path, 'utf8')) : null;
const profiles = ['DX', 'TX', 'NM', 'CY'];
const evidenceNames = [...source.matchAll(/'([^']+\.(?:png|json|txt|pdf|csv|md))'/g)].map((match) => match[1]);
const csvHeader = [
  'caseId',
  'modalityProfile',
  'sourceDocument',
  'expectedFromSignedMemory',
  'radshieldOutput',
  'difference',
  'classification',
  'severity',
  'disposition',
  'owner',
  'evidencePath',
  'notes',
];

const manifest = {
  phase: 'F266',
  schema: 'radshield-mx.real-case-evidence-kit.f266.v1',
  generatedAt: new Date().toISOString(),
  status: f265?.status === 'ready-for-operator-real-testing' ? 'ready-for-real-case-capture' : 'blocked',
  prerequisite: {
    phase: 'F265',
    status: f265?.status ?? 'missing',
    manifest: path.relative(root, f265Path).replaceAll(path.sep, '/'),
  },
  profiles,
  evidenceNames,
  deviationCsv: path.relative(root, csvPath).replaceAll(path.sep, '/'),
  releaseStopRules: [
    'blocker deviation remains open',
    'major deviation remains open without accepted limitation',
    'missing canvas scale/zone evidence',
    'missing calculation formula/standard/citation trace',
    'missing material TVL/HVL/density structural-load evidence',
    'missing Memoria IA/PDF/Evidence Pack exports',
  ],
  nextPhase: 'F267 real-case smoke execution with one operator-selected DX/TX/NM project.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(csvPath, `${csvHeader.join(',')}\n${csvHeader.map(() => '""').join(',')}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F266 - Real Case Evidence Kit',
  '',
  `Estado: **${manifest.status}**`,
  `Prerequisito F265: **${manifest.prerequisite.status}**`,
  '',
  '## Perfiles cubiertos',
  '',
  ...profiles.map((profile) => `- ${profile}`),
  '',
  '## Evidencia minima',
  '',
  ...evidenceNames.map((name) => `- ${name}`),
  '',
  '## CSV de desviaciones',
  '',
  `- ${manifest.deviationCsv}`,
  '',
  '## Stop rules',
  '',
  ...manifest.releaseStopRules.map((rule) => `- ${rule}`),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F266 real case evidence kit ${manifest.status}`);
