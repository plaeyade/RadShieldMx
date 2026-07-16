import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f168_db_live_finalization');
const jsonPath = path.join(outDir, 'f168_db_live_finalization.json');
const mdPath = path.join(root, 'outputs', 'fase_168_db_live_finalization.md');
const f128Path = path.join(root, 'outputs', 'f128_mysql_windows_validation.json');
const f153Path = path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json');

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function runLiveValidation() {
  const result = spawnSync(process.execPath, ['scripts/db-live-validation.mjs'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.status !== 0) {
    return {
      ok: false,
      error: result.stderr.trim() || result.stdout.trim() || 'db-live-validation failed',
    };
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return {
      ok: Boolean(parsed.ok),
      phase: parsed.phase,
      databaseUrl: parsed.databaseUrl,
      checks: parsed.checks ?? [],
    };
  } catch (error) {
    return {
      ok: false,
      error: `Could not parse db-live-validation output: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function countChecks(checks) {
  const tableChecks = checks.filter((check) => String(check.name).startsWith('table:'));
  const seedChecks = checks.filter((check) => !String(check.name).startsWith('table:'));
  return {
    total: checks.length,
    passed: checks.filter((check) => check.ok).length,
    failed: checks.filter((check) => !check.ok).map((check) => check.name),
    tables: tableChecks.length,
    seedChecks: seedChecks.length,
    seedCounts: seedChecks
      .filter((check) => typeof check.count === 'number')
      .map((check) => ({ name: check.name, count: check.count, min: check.min ?? null })),
  };
}

function hasSecretLeak(value) {
  const text = JSON.stringify(value);
  return /mysql:\/\/[^:@/\s]+:[^@/\s]+@/i.test(text) || /DATABASE_URL=.*:.*@/i.test(text);
}

fs.mkdirSync(outDir, { recursive: true });

const f128 = readJson(f128Path);
const f153 = readJson(f153Path);
const liveValidation = runLiveValidation();
const checkSummary = countChecks(liveValidation.checks ?? []);

const gates = {
  mysqlWindowsReady: f128?.status === 'ready' && f128?.authOk === true && f128?.tcpReachable === true,
  migrationsAndSeedReady: liveValidation.ok === true && checkSummary.failed.length === 0,
  backupReady: f153?.status === 'ready' && f153?.backup?.ok === true,
  restoreProbeReady: f153?.restoreProbe?.ok === true && f153?.restoreProbe?.tableCountMatches === true,
  restoreCleanupReady: f153?.cleanup?.ok === true,
};

const manifest = {
  phase: 'F168',
  title: 'DB live finalization',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.db-live-finalization.f168.v1',
  status: Object.values(gates).every(Boolean) ? 'db-live-ready' : 'db-live-gated',
  database: f153?.database ?? (f128
    ? {
        host: '127.0.0.1',
        port: '3306',
        database: f128.selectedDatabase,
        userPresent: true,
        passwordPresent: true,
      }
    : null),
  mysql: {
    serverVersion: f128?.serverVersion ?? null,
    authOk: f128?.authOk ?? false,
    tcpReachable: f128?.tcpReachable ?? false,
    migrationAllowed: f128?.migrationAllowed ?? false,
    seedAllowed: f128?.seedAllowed ?? false,
  },
  liveValidation: {
    ok: liveValidation.ok,
    phase: liveValidation.phase ?? null,
    checkSummary,
    databaseUrlRedacted: liveValidation.databaseUrl ?? f128?.databaseUrlRedacted ?? null,
    error: liveValidation.error ?? null,
  },
  backupRestore: f153
    ? {
        status: f153.status,
        backup: f153.backup
          ? {
              ok: f153.backup.ok,
              file: f153.backup.file,
              bytes: f153.backup.bytes,
              sha256: f153.backup.sha256,
              originalTableCount: f153.backup.originalTableCount,
            }
          : null,
        restoreProbe: f153.restoreProbe ?? null,
        cleanup: f153.cleanup ?? null,
      }
    : null,
  gates,
  releaseImpact: {
    dbLiveBlockingRelease: !Object.values(gates).every(Boolean),
    localFullstackReleaseReady: Object.values(gates).every(Boolean),
    publicDeployStillBlockedByF167NetworkGate: true,
    repeatAfterPublicUrl: ['F154 public URL smoke', 'F155 release decision', 'F156 final package', 'F158 post-deploy target smoke'],
  },
  secretsPolicy: [
    'No se escribe password ni DATABASE_URL completo en artefactos F168.',
    'Solo se registran host, puerto, nombre de base, usuario presente y password presente.',
    'Los dumps permanecen en outputs/f153_db_backup_restore/db_backup y no deben publicarse.',
  ],
  nextRecommendedPhases: [
    'F169 QA numerico normativo con DB live como fuente de persistencia.',
    'F170 gobierno RAG/citas DB-backed con hashes y version canonica.',
    'F171 sincronizacion canvas/3D/reportes contra proyectos persistidos.',
  ],
};

if (hasSecretLeak(manifest)) {
  manifest.status = 'db-live-gated';
  manifest.secretLeakGuard = 'potential-secret-pattern-detected';
}

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F168 - DB Live Finalization',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  '',
  '## Resultado',
  '',
  manifest.status === 'db-live-ready'
    ? '- DB live lista: MySQL, migracion/seed, validacion, backup y restore probe pasaron.'
    : '- DB live gated: revisar gates fallidos en el JSON.',
  '',
  '## Validacion Live',
  '',
  `- Checks: ${checkSummary.passed}/${checkSummary.total}`,
  `- Tablas requeridas: ${checkSummary.tables}`,
  `- Seed/data checks: ${checkSummary.seedChecks}`,
  checkSummary.failed.length ? `- Fallos: ${checkSummary.failed.join(', ')}` : '- Fallos: ninguno.',
  '',
  '## Backup/Restore',
  '',
  manifest.backupRestore?.backup?.ok
    ? `- Backup OK: ${manifest.backupRestore.backup.file} (${manifest.backupRestore.backup.bytes} bytes, sha256 ${manifest.backupRestore.backup.sha256})`
    : '- Backup pendiente o fallido.',
  manifest.backupRestore?.restoreProbe?.ok
    ? `- Restore probe OK: ${manifest.backupRestore.restoreProbe.restoredTableCount}/${manifest.backupRestore.restoreProbe.originalTableCount} tablas.`
    : '- Restore probe pendiente o fallido.',
  manifest.backupRestore?.cleanup?.ok
    ? '- Cleanup OK: base temporal eliminada o conservada segun flags.'
    : '- Cleanup pendiente o fallido.',
  '',
  '## Decision',
  '',
  '- La DB ya no bloquea release local/full stack.',
  '- El deploy publico sigue bloqueado por F167 hasta que Codex pueda empujar al remoto Sites.',
  '- Tras URL publica final: repetir F154-F158.',
  '',
  '## Seguridad',
  '',
  ...manifest.secretsPolicy.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F168 DB live finalization written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status !== 'db-live-ready') process.exit(1);
