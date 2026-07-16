import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f169_predeploy_numeric_db_qa');
const jsonPath = path.join(outDir, 'f169_predeploy_numeric_db_qa.json');
const mdPath = path.join(root, 'outputs', 'fase_169_predeploy_numeric_db_qa.md');

const nodeBinDir = process.env.RADSHIELD_NODE_BIN_DIR || 'C:\\Program Files\\nodejs';
const commandEnv = {
  ...process.env,
  PATH: `${nodeBinDir};${process.env.PATH || ''}`,
};

function runStep(label, command, args) {
  const startedAt = new Date().toISOString();
  const isWindowsCmd = process.platform === 'win32' && command.toLowerCase().endsWith('.cmd');
  const commandForSpawn = isWindowsCmd ? 'cmd.exe' : command;
  const argsForSpawn = isWindowsCmd ? ['/d', '/c', 'call', command, ...args] : args;
  const result = spawnSync(commandForSpawn, argsForSpawn, {
    cwd: root,
    env: commandEnv,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 30,
    shell: false,
  });
  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    status: result.status,
    error: result.error ? result.error.message : null,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdoutTail: (result.stdout || '').slice(-5000),
    stderrTail: (result.stderr || '').slice(-5000),
  };
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function extractRuntimeSmoke(output) {
  const start = output.indexOf('{');
  if (start === -1) return null;
  try {
    return JSON.parse(output.slice(start));
  } catch {
    return null;
  }
}

function extractCheckCounts(output) {
  const smoke = extractRuntimeSmoke(output);
  if (smoke) {
    return {
      testsPassed: smoke.passed ?? null,
      filesPassed: 1,
      checkCount: smoke.checkCount ?? null,
      failed: smoke.failed ?? [],
    };
  }
  const tests = output.match(/Tests\s+(\d+)\s+passed/i);
  const files = output.match(/Test Files\s+(\d+)\s+passed/i);
  return {
    testsPassed: tests ? Number(tests[1]) : null,
    filesPassed: files ? Number(files[1]) : null,
    checkCount: null,
    failed: [],
  };
}

fs.mkdirSync(outDir, { recursive: true });

const vitestCmd = process.platform === 'win32'
  ? path.join(root, 'node_modules', '.bin', 'tsx.CMD')
  : path.join(root, 'node_modules', '.bin', 'tsx');

const steps = [
  runStep('Regenerate F149 normative numeric QA manifest', process.execPath, ['scripts/f149-normative-numeric-qa.mjs']),
  runStep('Check F149 normative numeric contracts', process.execPath, ['scripts/check-f149-normative-numeric-qa-contracts.mjs']),
  runStep('Regenerate F168 DB live finalization', process.execPath, ['scripts/f168-db-live-finalization.mjs']),
  runStep('Check F168 DB live finalization contracts', process.execPath, ['scripts/check-f168-db-live-finalization-contracts.mjs']),
  runStep('Run F169 numeric runtime smoke', vitestCmd, ['scripts/f169-numeric-runtime-smoke.ts']),
];

const f149 = readJson(path.join(root, 'outputs', 'f149_normative_numeric_qa', 'f149_normative_numeric_qa.json'));
const f168 = readJson(path.join(root, 'outputs', 'f168_db_live_finalization', 'f168_db_live_finalization.json'));
const numericSmokeStep = steps.find((step) => step.label.startsWith('Run F169 numeric runtime smoke'));
const numericSmokeCounts = extractCheckCounts(`${numericSmokeStep?.stdoutTail || ''}\n${numericSmokeStep?.stderrTail || ''}`);

const gates = {
  f149ManifestReady: f149?.phase === 'F149' && f149?.caseCount >= 8,
  f149ContractsPass: steps.find((step) => step.label.includes('Check F149'))?.ok === true,
  f168DbLiveReady: f168?.status === 'db-live-ready' && f168?.releaseImpact?.dbLiveBlockingRelease === false,
  f168ContractsPass: steps.find((step) => step.label.includes('Check F168'))?.ok === true,
  numericRuntimeSmokePass: numericSmokeStep?.ok === true,
};

const allGatesPass = Object.values(gates).every(Boolean);
const failedSteps = steps.filter((step) => !step.ok).map((step) => step.label);

const manifest = {
  phase: 'F169',
  title: 'Predeploy numeric QA + DB live gate',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.predeploy-numeric-db-qa.f169.v1',
  status: allGatesPass ? 'predeploy-numeric-ready' : 'predeploy-numeric-gated',
  gates,
  failedSteps,
  f149: f149
    ? {
        caseCount: f149.caseCount,
        families: f149.families,
        evidenceStrengths: f149.evidenceStrengths,
        releasePolicy: f149.releasePolicy,
      }
    : null,
  f168: f168
    ? {
        status: f168.status,
        dbLiveBlockingRelease: f168.releaseImpact?.dbLiveBlockingRelease ?? null,
        checkSummary: f168.liveValidation?.checkSummary ?? null,
        backupSha256: f168.backupRestore?.backup?.sha256 ?? null,
      }
    : null,
  numericRuntimeSmoke: {
    ok: numericSmokeStep?.ok === true,
    checksPassed: numericSmokeCounts.testsPassed,
    checkCount: numericSmokeCounts.checkCount,
    filesPassed: numericSmokeCounts.filesPassed,
    failed: numericSmokeCounts.failed,
    scope: 'scripts/f169-numeric-runtime-smoke.ts',
  },
  releaseDecision: allGatesPass
    ? 'F169 listo: QA numerico normativo minimo y DB live no bloquean deploy funcional. Continuar F170/F171 o reintentar deploy target.'
    : 'F169 bloqueado: resolver pasos fallidos antes de deploy funcional.',
  nextRecommendedPhases: [
    'F170 RAG/citas DB-backed con hashes canonicos.',
    'F171 canvas polish predeploy: seleccion, snapping visible, cotas legibles, panel propiedades y export visual.',
    'F172 deploy target + F154-F158 contra URL publica final.',
  ],
  steps,
};

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F169 - Predeploy Numeric QA + DB Live Gate',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'FAIL'}`),
  '',
  '## QA numerico',
  '',
  `- F149 casos normativos: ${manifest.f149?.caseCount ?? 'N/D'}`,
  `- runtime smoke: ${manifest.numericRuntimeSmoke.ok ? 'OK' : 'FAIL'} (${manifest.numericRuntimeSmoke.checksPassed ?? 'N/D'}/${manifest.numericRuntimeSmoke.checkCount ?? 'N/D'} checks)`,
  '',
  '## DB live',
  '',
  `- F168 status: ${manifest.f168?.status ?? 'N/D'}`,
  `- Checks DB: ${manifest.f168?.checkSummary?.passed ?? 'N/D'}/${manifest.f168?.checkSummary?.total ?? 'N/D'}`,
  `- Backup SHA-256: ${manifest.f168?.backupSha256 ?? 'N/D'}`,
  '',
  '## Decision',
  '',
  manifest.releaseDecision,
  '',
  '## Siguientes fases',
  '',
  ...manifest.nextRecommendedPhases.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F169 predeploy numeric QA written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status !== 'predeploy-numeric-ready') process.exit(1);
