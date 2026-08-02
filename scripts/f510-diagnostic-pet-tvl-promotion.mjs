import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f510_diagnostic_pet_tvl_promotion');
fs.mkdirSync(outDir, { recursive: true });

const readbackRequested = process.env.F510_DB_READBACK === '1';
const seedLive = process.env.F510_SEED_LIVE === '1';
const exactConfirmed = process.env.F510_CONFIRM_EXACT_VALUES === '1';
const restoreConfirmed = process.env.F510_CONFIRM_RESTORE_PROBE === '1';

const candidates = [
  {
    id: 'lead-cast-tvl-primary-511kev',
    materialId: 'lead-cast',
    valueKind: 'tvl-primary',
    energyKey: '511keV',
    value: 11.8,
    unit: 'mm',
    sourceId: 'src-norm-lead-cast',
    reviewState: 'approved-reference',
    allowedUse: 'calculation',
    standard: 'AAPM-TG108',
    rationale: 'PET/NM 511 keV lead TVL promoted from existing RadShield material constants into live DB readback.',
  },
  {
    id: 'lead-cast-tvl-diagnostic-120kvp',
    materialId: 'lead-cast',
    valueKind: 'tvl-diagnostic',
    energyKey: '120kVp',
    value: 0.27,
    unit: 'mm',
    sourceId: 'src-norm-lead-cast',
    reviewState: 'approved-reference',
    allowedUse: 'calculation',
    standard: 'NCRP147',
    rationale: 'Diagnostic lead TVL near 120-125 kVp promoted from NCRP147 validation constants into live DB readback.',
  },
];

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName, rows) {
  const headers = rows.length ? Object.keys(rows[0]) : ['id', 'status'];
  const lines = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))];
  fs.writeFileSync(path.join(outDir, fileName), `${lines.join('\n')}\n`, 'utf8');
}

function writeJsonl(fileName, rows) {
  fs.writeFileSync(path.join(outDir, fileName), `${rows.map((row) => JSON.stringify(row)).join('\n')}${rows.length ? '\n' : ''}`, 'utf8');
}

function summarizeCandidate(row, liveRow = null, source = null, material = null) {
  return {
    id: row.id,
    materialId: row.materialId,
    valueKind: row.valueKind,
    energyKey: row.energyKey,
    value: row.value,
    unit: row.unit,
    sourceId: row.sourceId,
    currentStatus: liveRow ? 'already-present' : 'missing',
    materialReady: Boolean(material),
    sourceReady: Boolean(source?.document_hash && source?.page_ref && source?.review_state === 'approved-reference'),
    pageRef: source?.page_ref ?? '',
    documentHash: source?.document_hash ?? '',
    conflict: liveRow && (
      liveRow.material_id !== row.materialId ||
      liveRow.value_kind !== row.valueKind ||
      liveRow.energy_key !== row.energyKey ||
      Number(liveRow.value) !== row.value ||
      liveRow.unit !== row.unit ||
      liveRow.source_id !== row.sourceId ||
      liveRow.review_state !== row.reviewState ||
      liveRow.allowed_use !== row.allowedUse
    ) ? 'yes' : 'no',
  };
}

async function inspectLiveDb(databaseUrl) {
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL not configured.', database: null, reports: [] };
  if (!readbackRequested) return { ok: false, reason: 'Set F510_DB_READBACK=1 to inspect live DB.', database: null, reports: [] };

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '');
    const [materials] = await connection.query(
      'SELECT id,name,review_state FROM material_constants WHERE id = ?',
      ['lead-cast'],
    );
    const [sources] = await connection.query(
      'SELECT id,title,document_hash,page_ref,review_state FROM regulatory_sources WHERE id = ?',
      ['src-norm-lead-cast'],
    );
    const [existingRows] = await connection.query(
      `SELECT id,material_id,value_kind,energy_key,value,unit,source_id,review_state,allowed_use
       FROM material_value_versions
       WHERE id IN (${candidates.map(() => '?').join(',')})`,
      candidates.map((row) => row.id),
    );
    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const material = materials[0] ?? null;
    const source = sources[0] ?? null;
    const reports = candidates.map((candidate) => summarizeCandidate(candidate, existingById.get(candidate.id), source, material));
    const blockers = [
      ...(!material ? ['Material lead-cast is missing from material_constants.'] : []),
      ...(!source ? ['Source src-norm-lead-cast is missing from regulatory_sources.'] : []),
      ...(source && source.review_state !== 'approved-reference' ? ['Source src-norm-lead-cast is not approved-reference.'] : []),
      ...(source && (!source.document_hash || !source.page_ref) ? ['Source src-norm-lead-cast is missing page_ref or document_hash.'] : []),
      ...reports.filter((row) => row.conflict === 'yes').map((row) => `${row.id} exists with different fields.`),
    ];
    return {
      ok: blockers.length === 0,
      reason: blockers.length ? 'readback found blockers.' : 'readback ready.',
      database: { host: url.hostname, port: url.port || '3306', database, userPresent: Boolean(url.username) },
      reports,
      blockers,
    };
  } finally {
    await connection.end();
  }
}

async function seedMissingRows(databaseUrl, reports) {
  if (!seedLive) return { attempted: false, reason: 'F510_SEED_LIVE=1 not set.', inserted: 0, skipped: 0, rows: reports };
  if (!exactConfirmed || !restoreConfirmed) {
    return { attempted: false, reason: 'Set F510_CONFIRM_EXACT_VALUES=1 and F510_CONFIRM_RESTORE_PROBE=1 before live seed.', inserted: 0, skipped: 0, rows: reports };
  }
  const missing = candidates.filter((candidate) => reports.find((row) => row.id === candidate.id)?.currentStatus === 'missing');
  if (!missing.length) return { attempted: true, reason: 'All supplemental rows already present.', inserted: 0, skipped: candidates.length, rows: reports };

  const connection = await mysql.createConnection(databaseUrl);
  try {
    await connection.beginTransaction();
    for (const row of missing) {
      await connection.execute(
        'INSERT INTO material_value_versions (id,material_id,value_kind,energy_key,value,unit,source_id,review_state,allowed_use) VALUES (?,?,?,?,?,?,?,?,?)',
        [row.id, row.materialId, row.valueKind, row.energyKey, row.value, row.unit, row.sourceId, row.reviewState, row.allowedUse],
      );
    }
    await connection.commit();
    return {
      attempted: true,
      reason: 'supplemental rows inserted.',
      inserted: missing.length,
      skipped: candidates.length - missing.length,
      rows: reports.map((row) => ({ ...row, liveAction: row.currentStatus === 'missing' ? 'inserted' : 'skipped-present' })),
    };
  } catch (error) {
    await connection.rollback();
    return {
      attempted: true,
      reason: `rolled back: ${error instanceof Error ? error.message : String(error)}`,
      inserted: 0,
      skipped: candidates.length - missing.length,
      rows: reports.map((row) => ({ ...row, liveAction: row.currentStatus === 'missing' ? 'rollback' : 'skipped-present' })),
      failed: true,
    };
  } finally {
    await connection.end();
  }
}

const db = await inspectLiveDb(process.env.DATABASE_URL);
const seed = db.ok ? await seedMissingRows(process.env.DATABASE_URL, db.reports) : { attempted: false, reason: 'readback not ready.', inserted: 0, skipped: 0, rows: db.reports ?? [] };
const blockers = [
  ...(!db.ok ? (db.blockers?.length ? db.blockers : [db.reason]) : []),
  ...(seed.failed ? [seed.reason] : []),
  ...(seedLive && (!exactConfirmed || !restoreConfirmed) ? ['Live seed requested without both confirmation flags.'] : []),
];
const status = blockers.length
  ? 'f510-blocked'
  : seed.attempted
    ? 'f510-live-seed-ready'
    : 'f510-readback-ready';

writeJsonl('f510_supplemental_value_candidates.jsonl', candidates);
writeCsv('f510_live_insert_report.csv', seed.rows ?? []);

const manifest = {
  schema: 'radshield-mx.db.regulatory-materials.supplemental-tvl.f510.v1',
  phase: 'F510',
  generatedAt: new Date().toISOString(),
  status,
  flags: {
    F510_DB_READBACK: readbackRequested,
    F510_SEED_LIVE: seedLive,
    F510_CONFIRM_EXACT_VALUES: exactConfirmed,
    F510_CONFIRM_RESTORE_PROBE: restoreConfirmed,
  },
  database: db.database,
  candidates: candidates.length,
  seed,
  blockers,
  nextPhase: status === 'f510-live-seed-ready'
    ? 'Rerun F508-F509 with F508_DB_READBACK=1 and confirm PET/DX cases pass.'
    : 'Set F510 readback/seed flags after reviewing f510_live_insert_report.csv.',
};

fs.writeFileSync(path.join(outDir, 'f510_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f510_summary.md'), [
  '# F510 DIAGNOSTIC/PET TVL PROMOTION',
  '',
  `Estado: ${manifest.status}`,
  `DB readback: ${db.ok ? 'OK' : 'NO'} (${db.reason})`,
  `Seed live: ${seed.attempted ? 'attempted' : 'not attempted'} (${seed.reason})`,
  '',
  '## Valores suplementarios',
  ...candidates.map((row) => `- ${row.id}: ${row.value} ${row.unit}, ${row.standard}, ${row.materialId}/${row.valueKind}/${row.energyKey}`),
  '',
  '## Acciones live',
  `- Insertados: ${seed.inserted}`,
  `- Omitidos por existir: ${seed.skipped}`,
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno.']),
  '',
  `Siguiente paso: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F510 generated. status=${status} inserted=${seed.inserted} blockers=${blockers.length}`);
