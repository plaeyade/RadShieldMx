import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const f499Dir = path.join(root, 'outputs', 'f499_regulatory_materials_seed_dry_run');
const outDir = path.join(root, 'outputs', 'f500_regulatory_materials_live_gate');
fs.mkdirSync(outDir, { recursive: true });

const requiredTables = ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'];
const generatedTableFiles = {
  regulatory_sources: 'f499_regulatory_sources.jsonl',
  material_constants: 'f499_material_constants.jsonl',
  material_value_versions: 'f499_material_value_versions.jsonl',
  material_source_links: 'f499_material_source_links.jsonl',
};

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function duplicateIds(rows, field = 'id') {
  const seen = new Set();
  const duplicates = new Set();
  rows.forEach((row) => {
    const value = row[field];
    if (!value) return;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates].sort();
}

function tableSeedRows() {
  return Object.fromEntries(
    Object.entries(generatedTableFiles).map(([table, fileName]) => [table, readJsonl(path.join(f499Dir, fileName))]),
  );
}

function latestRestoreProbe() {
  const f153 = readJson(path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json'));
  if (!f153) {
    return { status: 'missing', ok: false, reason: 'F153 restore probe manifest not found.' };
  }
  const ok = Boolean(f153.restoreProbe?.ok && f153.restoreProbe?.tableCountMatches);
  return {
    status: ok ? 'ready' : 'not-ready',
    ok,
    schema: f153.schema,
    generatedAt: f153.generatedAt,
    backupOk: Boolean(f153.backup?.ok),
    restoreProbe: f153.restoreProbe ?? null,
    reason: ok ? 'F153 restore probe ready.' : 'F153 restore probe is missing or not passing.',
  };
}

async function dbReadback(databaseUrl, requested) {
  if (!databaseUrl) {
    return { requested, attempted: false, ok: false, reason: 'DATABASE_URL not configured.' };
  }
  if (!requested) {
    return { requested, attempted: false, ok: false, reason: 'Set F500_DB_READBACK=1 to query the live database.' };
  }

  try {
    const mysql = await import('mysql2/promise');
    const connection = await mysql.default.createConnection(databaseUrl);
    try {
      const url = new URL(databaseUrl);
      const database = url.pathname.replace(/^\//, '');
      const [tableRows] = await connection.query(
        `SELECT table_name AS tableName
         FROM information_schema.tables
         WHERE table_schema = ? AND table_name IN (${requiredTables.map(() => '?').join(',')})`,
        [database, ...requiredTables],
      );
      const existingTables = new Set(tableRows.map((row) => row.tableName));
      const tableCounts = {};
      for (const table of requiredTables) {
        if (!existingTables.has(table)) {
          tableCounts[table] = null;
        } else {
          const [countRows] = await connection.query(`SELECT COUNT(*) AS rowCount FROM \`${table}\``);
          tableCounts[table] = Number(countRows[0]?.rowCount ?? 0);
        }
      }
      return {
        requested,
        attempted: true,
        ok: requiredTables.every((table) => existingTables.has(table)),
        database: { host: url.hostname, port: url.port || '3306', database, userPresent: Boolean(url.username) },
        existingTables: [...existingTables].sort(),
        missingTables: requiredTables.filter((table) => !existingTables.has(table)),
        tableCounts,
      };
    } finally {
      await connection.end();
    }
  } catch (error) {
    return {
      requested,
      attempted: true,
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

const f499Manifest = readJson(path.join(f499Dir, 'f499_seed_manifest.json'));
const rows = tableSeedRows();
const restoreProbe = latestRestoreProbe();
const readback = await dbReadback(process.env.DATABASE_URL, process.env.F500_DB_READBACK === '1');

const tableIntegrity = Object.fromEntries(Object.entries(rows).map(([table, tableRows]) => {
  const keyField = table === 'material_source_links' ? null : 'id';
  const duplicates = keyField ? duplicateIds(tableRows, keyField) : duplicateIds(
    tableRows.map((row) => ({ id: `${row.materialId}|${row.sourceId}|${row.allowedUse}` })),
  );
  return [table, {
    rowCount: tableRows.length,
    duplicates,
    duplicateFree: duplicates.length === 0,
  }];
}));

const pendingPageRefs = rows.regulatory_sources.filter((row) => /pending|document_chunks/i.test(row.pageRef || ''));
const reviewRequiredValues = rows.material_value_versions.filter((row) => row.reviewState !== 'approved-reference');
const approvedCalculationValues = rows.material_value_versions.filter((row) => row.reviewState === 'approved-reference' && row.allowedUse === 'calculation');

const blockers = [
  ...(!f499Manifest ? ['F499 manifest missing. Run npm run prepare:f499:regulatory-materials-seed.'] : []),
  ...Object.entries(tableIntegrity).flatMap(([table, integrity]) => integrity.duplicateFree ? [] : [`Duplicate keys in ${table}: ${integrity.duplicates.join(', ')}`]),
  ...(!restoreProbe.ok ? [restoreProbe.reason] : []),
  ...(!readback.ok ? [`DB readback not ready: ${readback.reason || `missing tables ${readback.missingTables?.join(', ')}`}`] : []),
  ...(pendingPageRefs.length > 0 ? [`${pendingPageRefs.length} regulatory sources still require page/hash readback against document_chunks.`] : []),
  ...(reviewRequiredValues.length > 0 ? [`${reviewRequiredValues.length} material value versions remain review-required.`] : []),
];

const manifest = {
  schema: 'radshield-mx.db.regulatory-materials.live-gate.f500.v1',
  phase: 'F500',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'ready-for-controlled-live-seed' : 'blocked',
  liveWritePerformed: false,
  liveWriteAllowed: false,
  requiredFlagsForFutureLiveSeed: ['F501_SEED_LIVE=1', 'F501_CONFIRM_RESTORE_PROBE=1', 'F501_CONFIRM_REVIEWED=1'],
  input: {
    f499ManifestPresent: Boolean(f499Manifest),
    f499Schema: f499Manifest?.schema ?? null,
    f499Counts: f499Manifest?.counts ?? null,
  },
  restoreProbe,
  dbReadback: readback,
  tableIntegrity,
  reviewSummary: {
    pendingPageRefs: pendingPageRefs.length,
    reviewRequiredValueVersions: reviewRequiredValues.length,
    approvedCalculationValueVersions: approvedCalculationValues.length,
  },
  blockers,
  nextPhase: blockers.length === 0
    ? 'F501 controlled live seed with transaction and post-seed readback.'
    : 'Resolve blockers, rerun F500, then proceed to F501.',
};

const markdown = [
  '# F500 LIVE GATE DB REGULATORIA/MATERIALES',
  '',
  `Estado: ${manifest.status}`,
  `Escritura live realizada: ${manifest.liveWritePerformed ? 'si' : 'no'}`,
  `Escritura live permitida en F500: ${manifest.liveWriteAllowed ? 'si' : 'no'}`,
  '',
  '## F499',
  `Manifest presente: ${manifest.input.f499ManifestPresent ? 'si' : 'no'}`,
  `Fuentes: ${manifest.input.f499Counts?.regulatorySources ?? 0}`,
  `Materiales: ${manifest.input.f499Counts?.materialConstants ?? 0}`,
  `Versiones de valores: ${manifest.input.f499Counts?.materialValueVersions ?? 0}`,
  '',
  '## Restore Probe',
  `Estado: ${restoreProbe.status}`,
  `OK: ${restoreProbe.ok ? 'si' : 'no'}`,
  '',
  '## DB Readback',
  `Solicitado: ${readback.requested ? 'si' : 'no'}`,
  `Intentado: ${readback.attempted ? 'si' : 'no'}`,
  `OK: ${readback.ok ? 'si' : 'no'}`,
  ...(readback.missingTables?.length ? [`Tablas faltantes: ${readback.missingTables.join(', ')}`] : []),
  '',
  '## Integridad',
  ...Object.entries(tableIntegrity).map(([table, integrity]) => `- ${table}: ${integrity.rowCount} filas; duplicados=${integrity.duplicates.length}`),
  '',
  '## Revision',
  `Fuentes con page/hash pendiente: ${manifest.reviewSummary.pendingPageRefs}`,
  `Versiones review-required: ${manifest.reviewSummary.reviewRequiredValueVersions}`,
  `Versiones aprobadas para calculo: ${manifest.reviewSummary.approvedCalculationValueVersions}`,
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno.']),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n');

fs.writeFileSync(path.join(outDir, 'f500_live_gate_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f500_live_gate.md'), markdown, 'utf8');

console.log(`F500 live gate generated. status=${manifest.status} blockers=${manifest.blockers.length} out=${path.relative(root, outDir)}`);
