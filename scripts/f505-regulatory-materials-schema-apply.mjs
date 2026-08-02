import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f505_regulatory_materials_schema_apply');
const schemaPath = path.join(root, 'db', 'f501_f504_regulatory_materials_schema.sql');
const f153Path = path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json');
fs.mkdirSync(outDir, { recursive: true });

const requiredTables = ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'];
const applyRequested = process.env.F505_APPLY_SCHEMA === '1';
const confirmRestoreProbe = process.env.F505_CONFIRM_RESTORE_PROBE === '1';
const databaseUrl = process.env.DATABASE_URL;

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function stripComments(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .trim();
}

function splitStatements(sql) {
  return stripComments(sql)
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

function assertSafeStatements(statements) {
  const failures = [];
  const destructiveKeywordPattern = /\b(DROP|TRUNCATE|DELETE|INSERT|UPDATE|ALTER|REPLACE)\b/i;
  for (const statement of statements) {
    if (!/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+[a-z_]+/i.test(statement)) {
      failures.push(`Unsupported statement: ${statement.slice(0, 80)}`);
    }
    const firstKeyword = statement.match(/^\s*([A-Z]+)/i)?.[1]?.toUpperCase();
    if (firstKeyword && destructiveKeywordPattern.test(firstKeyword)) {
      failures.push(`Forbidden top-level keyword in statement: ${statement.slice(0, 80)}`);
    }
  }
  return failures;
}

async function readback(connection, database) {
  const [tableRows] = await connection.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name IN (${requiredTables.map(() => '?').join(',')})`,
    [database, ...requiredTables],
  );
  const existingTables = new Set(tableRows.map((row) => row.tableName));
  const counts = {};
  for (const table of requiredTables) {
    if (!existingTables.has(table)) {
      counts[table] = null;
      continue;
    }
    const [countRows] = await connection.query(`SELECT COUNT(*) AS rowCount FROM \`${table}\``);
    counts[table] = Number(countRows[0]?.rowCount ?? 0);
  }
  return {
    existingTables: [...existingTables].sort(),
    missingTables: requiredTables.filter((table) => !existingTables.has(table)),
    counts,
  };
}

const sql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';
const statements = splitStatements(sql);
const safetyFailures = assertSafeStatements(statements);
const restoreProbe = readJson(f153Path);
const restoreProbeReady = Boolean(restoreProbe?.restoreProbe?.ok && restoreProbe?.restoreProbe?.tableCountMatches);

const manifest = {
  schema: 'radshield-mx.db.regulatory-materials.schema-apply.f505.v1',
  phase: 'F505',
  generatedAt: new Date().toISOString(),
  mode: applyRequested ? 'live-apply-requested' : 'dry-run',
  liveApplyPerformed: false,
  schemaPath: path.relative(root, schemaPath).replace(/\\/g, '/'),
  statements: statements.map((statement) => statement.slice(0, 120).replace(/\s+/g, ' ')),
  safety: {
    safeStatementCount: statements.length,
    failures: safetyFailures,
    destructiveKeywordsBlocked: true,
  },
  restoreProbe: {
    ready: restoreProbeReady,
    generatedAt: restoreProbe?.generatedAt ?? null,
    database: restoreProbe?.restoreProbe?.database ?? null,
  },
  database: null,
  beforeReadback: null,
  afterReadback: null,
  blockers: [],
  nextPhase: 'F506 repeat F500_DB_READBACK=1 and prepare controlled seed transaction.',
};

manifest.blockers = [
  ...(!sql ? ['Schema SQL draft missing.'] : []),
  ...safetyFailures,
  ...(!databaseUrl ? ['DATABASE_URL missing.'] : []),
  ...(!restoreProbeReady ? ['F153 restore probe is not ready.'] : []),
  ...(applyRequested && !confirmRestoreProbe ? ['F505_CONFIRM_RESTORE_PROBE=1 is required for live schema apply.'] : []),
];

if (databaseUrl && safetyFailures.length === 0) {
  try {
    const mysql = await import('mysql2/promise');
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '');
    manifest.database = { host: url.hostname, port: url.port || '3306', database, userPresent: Boolean(url.username) };
    const connection = await mysql.default.createConnection(databaseUrl);
    try {
      manifest.beforeReadback = await readback(connection, database);
      if (applyRequested && confirmRestoreProbe && restoreProbeReady && manifest.blockers.length === 0) {
        for (const statement of statements) {
          await connection.query(statement);
        }
        manifest.liveApplyPerformed = true;
      }
      manifest.afterReadback = await readback(connection, database);
    } finally {
      await connection.end();
    }
  } catch (error) {
    manifest.blockers.push(error instanceof Error ? error.message : String(error));
  }
}

manifest.status = manifest.liveApplyPerformed
  ? 'schema-live-applied'
  : manifest.blockers.length
    ? 'blocked'
    : 'dry-run-ready';

const md = [
  '# F505 REGULATORY MATERIALS SCHEMA APPLY',
  '',
  `Estado: ${manifest.status}`,
  `Modo: ${manifest.mode}`,
  `Live apply performed: ${manifest.liveApplyPerformed ? 'yes' : 'no'}`,
  `Statements: ${statements.length}`,
  '',
  '## Restore probe',
  `Ready: ${restoreProbeReady ? 'yes' : 'no'}`,
  '',
  '## Readback',
  `Before missing: ${manifest.beforeReadback?.missingTables?.join(', ') || 'not queried/none'}`,
  `After missing: ${manifest.afterReadback?.missingTables?.join(', ') || 'not queried/none'}`,
  '',
  '## Bloqueos',
  ...(manifest.blockers.length ? manifest.blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
].join('\n');

fs.writeFileSync(path.join(outDir, 'f505_schema_apply_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f505_schema_apply.md'), md, 'utf8');

console.log(`F505 schema apply generated. status=${manifest.status} live=${manifest.liveApplyPerformed} blockers=${manifest.blockers.length}`);
