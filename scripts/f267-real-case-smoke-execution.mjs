import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'lib', 'f267RealCaseSmokeExecution.ts');
const f266Path = path.join(root, 'outputs', 'f266_real_case_evidence_kit', 'f266_real_case_evidence_kit.json');
const f264Path = path.join(root, 'outputs', 'f264_real_clinical_trial_gate', 'f264_real_clinical_trial_gate.json');
const outDir = path.join(root, 'outputs', 'f267_real_case_smoke_execution');
const jsonPath = path.join(outDir, 'f267_real_case_smoke_execution.json');
const mdPath = path.join(root, 'outputs', 'fase_267_real_case_smoke_execution.md');
const csvPath = path.join(outDir, 'real_case_smoke_deviation_log.csv');

const source = fs.readFileSync(sourcePath, 'utf8');
const f266 = fs.existsSync(f266Path) ? JSON.parse(fs.readFileSync(f266Path, 'utf8')) : null;
const f264 = fs.existsSync(f264Path) ? JSON.parse(fs.readFileSync(f264Path, 'utf8')) : null;
const selectedIds = ['ct-body-public-control', 'linac-6mv-primary-public', 'pet-f18-uptake-room'];
const sourceText = fs.readFileSync(path.join(root, 'src', 'lib', 'realClinicalTrialCases.ts'), 'utf8');

const caseRows = selectedIds.map((id) => {
  const result = f264?.results?.find?.((item) => item.id === id);
  const profile = id.startsWith('ct') ? 'DX' : id.startsWith('pet') ? 'NM' : 'TX';
  const thickness = Number(result?.selectedThickness_mm);
  const hasNumericResult = Number.isFinite(thickness) && thickness >= 0;
  return {
    caseId: id,
    modalityProfile: profile,
    sourceDocument: 'synthetic-F264-baseline-replace-with-signed-memory',
    expectedFromSignedMemory: hasNumericResult ? `${thickness.toFixed(2)} mm` : 'replace-with-signed-memory-value',
    radshieldOutput: hasNumericResult ? `${thickness.toFixed(2)} mm` : 'pending-run-in-app-or-TS-harness',
    difference: hasNumericResult ? '0.000%' : 'pending',
    classification: 'calculation',
    severity: 'observation',
    disposition: 'accepted-limitation',
    owner: 'operator',
    evidencePath: `outputs/f267_real_case_smoke_execution/${id}.json`,
    notes: hasNumericResult
      ? 'Synthetic smoke row. Replace expectedFromSignedMemory and sourceDocument with real signed memory before clinical release.'
      : 'F264 manifest has no numeric result payload. Run the app/TS harness and replace expected/output with signed-memory and RadShield values before clinical release.',
  };
});

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

const csv = [
  csvHeader.join(','),
  ...caseRows.map((row) => csvHeader.map((field) => JSON.stringify(String(row[field] ?? ''))).join(',')),
].join('\n') + '\n';

const manifest = {
  phase: 'F267',
  schema: 'radshield-mx.real-case-smoke-execution.f267.v1',
  generatedAt: new Date().toISOString(),
  status: f266?.status === 'ready-for-real-case-capture' ? 'ready-for-real-case-replacement' : 'blocked',
  prerequisite: {
    phase: 'F266',
    status: f266?.status ?? 'missing',
    manifest: path.relative(root, f266Path).replaceAll(path.sep, '/'),
  },
  smokeCaseIds: selectedIds,
  profiles: ['DX', 'TX', 'NM'],
  sourceTokensPresent: [
    'buildF267RealCaseSmokeExecution',
    'synthetic-F264-baseline-replace-with-signed-memory',
    'operator-input-required',
    'Replace synthetic baseline values',
  ].filter((token) => source.includes(token)),
  f264TokensPresent: selectedIds.filter((id) => sourceText.includes(id)),
  f264ResultsAvailable: caseRows.every((row) => !String(row.radshieldOutput).includes('pending')),
  deviationCsv: path.relative(root, csvPath).replaceAll(path.sep, '/'),
  openBlockerMajorCount: 0,
  releaseDecision:
    'Frontend/app smoke can continue. Clinical signed release still requires replacing synthetic baselines with DX/TX/NM signed memories and resolving blocker/major deviations.',
  nextPhase: 'F268 operator-assisted real DX/TX/NM case capture or real app browser smoke against hosted URL.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(csvPath, csv, 'utf8');
for (const row of caseRows) {
  fs.writeFileSync(path.join(outDir, `${row.caseId}.json`), `${JSON.stringify(row, null, 2)}\n`, 'utf8');
}
fs.writeFileSync(mdPath, [
  '# F267 - Real Case Smoke Execution',
  '',
  `Estado: **${manifest.status}**`,
  `Prerequisito F266: **${manifest.prerequisite.status}**`,
  '',
  '## Casos smoke DX/TX/NM',
  '',
  ...caseRows.map((row) => `- ${row.modalityProfile}: ${row.caseId} -> ${row.radshieldOutput} (${row.disposition})`),
  '',
  '## CSV de desviaciones smoke',
  '',
  `- ${manifest.deviationCsv}`,
  '',
  '## Decision',
  '',
  manifest.releaseDecision,
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F267 real case smoke execution ${manifest.status}`);
