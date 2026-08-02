import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f508_f509_post_seed_qa');
fs.mkdirSync(outDir, { recursive: true });

const readbackRequested = process.env.F508_DB_READBACK === '1';
const requiredTables = ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'];
const expectedCounts = {
  regulatory_sources: 12,
  material_constants: 8,
  material_value_versions: 106,
  material_source_links: 24,
};

const qaCases = [
  {
    id: 'f509-db-linac-6mv-primary-concrete-normal',
    label: 'LINAC 6 MV primaria con concreto normal DB',
    standard: 'NCRP151',
    materialId: 'concrete-normal-235',
    valueKind: 'tvl-primary',
    energyKey: '6MV',
    transmission: 1e-5,
    expectedThickness_mm: 1850,
    tolerancePct: 0.5,
    required: true,
  },
  {
    id: 'f509-db-linac-15mv-secondary-concrete-normal',
    label: 'LINAC 15 MV secundaria con concreto normal DB',
    standard: 'NCRP151',
    materialId: 'concrete-normal-235',
    valueKind: 'tvl-secondary',
    energyKey: '15MV',
    transmission: 1e-4,
    extraShielding_mm: 120,
    expectedThickness_mm: 1520,
    tolerancePct: 0.5,
    required: true,
  },
  {
    id: 'f509-db-gamma-knife-co60-concrete-normal',
    label: 'Gamma Knife / Co-60 con concreto normal DB',
    standard: 'IAEA-SRS47',
    materialId: 'concrete-normal-235',
    valueKind: 'tvl-primary',
    energyKey: 'Co60',
    transmission: 1e-4,
    expectedThickness_mm: 872,
    tolerancePct: 0.5,
    required: true,
  },
  {
    id: 'f509-db-pet-511kev-lead-specific',
    label: 'PET/NM 511 keV con plomo especifico DB',
    standard: 'AAPM-TG108',
    materialId: 'lead-cast',
    valueKind: 'tvl-primary',
    energyKey: '511keV',
    transmission: 1e-3,
    expectedThickness_mm: null,
    tolerancePct: 0.5,
    required: false,
  },
  {
    id: 'f509-db-diagnostic-ct-lead-equivalent',
    label: 'CT/RX diagnostico con TVL plomo kVp DB',
    standard: 'NCRP147',
    materialId: 'lead-cast',
    valueKind: 'tvl-diagnostic',
    energyKey: '120kVp',
    transmission: 1e-2,
    expectedThickness_mm: null,
    tolerancePct: 0.5,
    required: false,
  },
  {
    id: 'f509-db-cyclotron-18mev-barite-neutron',
    label: 'Ciclotron 18 MeV alta densidad + neutron DB',
    standard: 'UAQ',
    materialId: 'concrete-barite-335',
    valueKind: 'tvl-primary',
    energyKey: '18MV',
    transmission: 1e-6,
    extraShielding_mm: 250,
    expectedThickness_mm: 2410,
    tolerancePct: 0.5,
    required: false,
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

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function readLiveDb(databaseUrl) {
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL not configured.', tableCounts: {}, values: [] };
  if (!readbackRequested) return { ok: false, reason: 'Set F508_DB_READBACK=1 to query live DB.', tableCounts: {}, values: [] };

  const connection = await mysql.createConnection(databaseUrl);
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
    const [values] = await connection.query(
      `SELECT
         v.id,
         v.material_id AS materialId,
         m.name AS materialName,
         m.density_g_cm3 AS densityGcm3,
         v.value_kind AS valueKind,
         v.energy_key AS energyKey,
         v.value,
         v.unit,
         v.review_state AS reviewState,
         v.allowed_use AS allowedUse,
         s.id AS sourceId,
         s.title AS sourceTitle,
         s.authority,
         s.document_hash AS documentHash,
         s.page_ref AS pageRef,
         s.review_state AS sourceReviewState
       FROM material_value_versions v
       JOIN material_constants m ON m.id = v.material_id
       JOIN regulatory_sources s ON s.id = v.source_id
       ORDER BY v.material_id, v.value_kind, v.energy_key`,
    );
    return {
      ok: requiredTables.every((table) => existingTables.has(table)),
      reason: 'post-seed readback completed.',
      database: { host: url.hostname, port: url.port || '3306', database, userPresent: Boolean(url.username) },
      tableCounts,
      values: values.map((row) => ({
        ...row,
        value: Number(row.value),
        densityGcm3: Number(row.densityGcm3),
      })),
    };
  } finally {
    await connection.end();
  }
}

function valueKey(row) {
  return `${row.materialId}|${row.valueKind}|${row.energyKey}`;
}

function evaluateQa(cases, values) {
  const byKey = new Map(values.map((row) => [valueKey(row), row]));
  return cases.map((testCase) => {
    const row = byKey.get(`${testCase.materialId}|${testCase.valueKind}|${testCase.energyKey}`);
    if (!row) {
      return {
        ...testCase,
        status: testCase.required ? 'fail' : 'review',
        reason: 'No seeded DB value for this material/value_kind/energy_key.',
        dbValue: null,
        calculatedThickness_mm: null,
        deltaPct: null,
        citation: null,
      };
    }
    const tvlMm = row.unit === 'cm' ? row.value * 10 : row.unit === 'mm' ? row.value : null;
    if (!Number.isFinite(tvlMm) || tvlMm <= 0 || !(testCase.transmission > 0 && testCase.transmission < 1)) {
      return {
        ...testCase,
        status: 'fail',
        reason: 'Invalid seeded TVL or transmission.',
        dbValue: row,
        calculatedThickness_mm: null,
        deltaPct: null,
        citation: `${row.sourceId} ${row.pageRef}`,
      };
    }
    const tvls = -Math.log10(testCase.transmission);
    const calculated = tvls * tvlMm + (testCase.extraShielding_mm ?? 0);
    const deltaPct = testCase.expectedThickness_mm
      ? Math.abs(calculated - testCase.expectedThickness_mm) / testCase.expectedThickness_mm * 100
      : null;
    const sourceReady = Boolean(row.documentHash && row.pageRef && !/pending|document_chunks/i.test(row.pageRef));
    const approved = row.reviewState === 'approved-reference' && row.allowedUse === 'calculation' && row.sourceReviewState === 'approved-reference';
    const status = approved && sourceReady && (deltaPct === null || deltaPct <= testCase.tolerancePct) ? 'pass' : 'review';
    return {
      ...testCase,
      status,
      reason: status === 'pass' ? 'DB-backed QA case passed.' : 'DB value exists but still requires review.',
      dbValue: row,
      calculatedTvls: round(tvls),
      calculatedThickness_mm: round(calculated),
      deltaPct: deltaPct === null ? null : round(deltaPct),
      citation: `${row.sourceId} ${row.pageRef} ${row.documentHash}`,
    };
  });
}

const db = await readLiveDb(process.env.DATABASE_URL);
const values = db.values ?? [];
const seededCalculationValues = values.filter((row) => row.reviewState === 'approved-reference' && row.allowedUse === 'calculation');
const sourceIssues = values.filter((row) => !row.documentHash || !row.pageRef || /pending|document_chunks/i.test(row.pageRef || ''));
const nonApproved = values.filter((row) => row.reviewState !== 'approved-reference' || row.allowedUse !== 'calculation');
const qaResults = evaluateQa(qaCases, values);
const requiredFailures = qaResults.filter((row) => row.required && row.status !== 'pass');
const reviewCases = qaResults.filter((row) => row.status === 'review');

const countBlockers = Object.entries(expectedCounts)
  .filter(([table, expected]) => (db.tableCounts?.[table] ?? 0) < expected)
  .map(([table, expected]) => `${table} has ${db.tableCounts?.[table] ?? 0}; expected at least ${expected}.`);

const blockers = [
  ...(!db.ok ? [`F508 DB readback failed: ${db.reason}`] : []),
  ...countBlockers,
  ...(seededCalculationValues.length < expectedCounts.material_value_versions ? [`Only ${seededCalculationValues.length} approved calculation values read back.`] : []),
  ...(sourceIssues.length ? [`${sourceIssues.length} seeded values have missing/pending source page/hash.`] : []),
  ...(nonApproved.length ? [`${nonApproved.length} seeded values are not approved calculation values.`] : []),
  ...(requiredFailures.length ? [`${requiredFailures.length} required DB-backed QA cases failed.`] : []),
];

const status = blockers.length
  ? 'post-seed-qa-blocked'
  : reviewCases.length
    ? 'post-seed-qa-ready-with-review'
    : 'post-seed-qa-pass';

const manifest = {
  schema: 'radshield-mx.db.regulatory-materials.post-seed-qa.f508-f509.v1',
  phases: ['F508', 'F509'],
  generatedAt: new Date().toISOString(),
  status,
  dbReadback: {
    requested: readbackRequested,
    ok: db.ok,
    reason: db.reason,
    database: db.database ?? null,
    tableCounts: db.tableCounts,
  },
  valueSummary: {
    totalSeededValues: values.length,
    approvedCalculationValues: seededCalculationValues.length,
    valuesWithSourceIssues: sourceIssues.length,
    nonApprovedValues: nonApproved.length,
    distinctMaterials: new Set(values.map((row) => row.materialId)).size,
    distinctSources: new Set(values.map((row) => row.sourceId)).size,
  },
  qaSummary: {
    totalCases: qaResults.length,
    passedCases: qaResults.filter((row) => row.status === 'pass').length,
    reviewCases: reviewCases.length,
    failedRequiredCases: requiredFailures.length,
  },
  blockers,
  nextPhase: status === 'post-seed-qa-blocked'
    ? 'Resolve F508 blockers before release QA.'
    : 'F511 expand source-specific PET/DX/cyclotron values from canonical PDF extraction when more energies/materials are approved.',
};

writeCsv('f508_seeded_value_readback.csv', values.map((row) => ({
  id: row.id,
  materialId: row.materialId,
  valueKind: row.valueKind,
  energyKey: row.energyKey,
  value: row.value,
  unit: row.unit,
  sourceId: row.sourceId,
  pageRef: row.pageRef,
  documentHash: row.documentHash,
  reviewState: row.reviewState,
  allowedUse: row.allowedUse,
})));
writeJsonl('f509_db_backed_qa_cases.jsonl', qaResults);
fs.writeFileSync(path.join(outDir, 'f508_f509_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f508_f509_summary.md'), [
  '# F508-F509 POST-SEED DB QA',
  '',
  `Estado: ${manifest.status}`,
  `DB readback: ${manifest.dbReadback.ok ? 'OK' : 'NO'} (${manifest.dbReadback.reason})`,
  '',
  '## Conteos',
  ...Object.entries(db.tableCounts ?? {}).map(([table, count]) => `- ${table}: ${count}`),
  '',
  '## Valores',
  `- Valores seeded: ${manifest.valueSummary.totalSeededValues}`,
  `- Valores approved/calculation: ${manifest.valueSummary.approvedCalculationValues}`,
  `- Valores con fuente/pagina/hash pendiente: ${manifest.valueSummary.valuesWithSourceIssues}`,
  '',
  '## QA DB-backed',
  ...qaResults.map((row) => `- ${row.id}: ${row.status}${row.calculatedThickness_mm ? `, ${row.calculatedThickness_mm} mm` : ''} (${row.reason})`),
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno.']),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F508-F509 generated. status=${status} pass=${manifest.qaSummary.passedCases}/${manifest.qaSummary.totalCases} blockers=${blockers.length}`);
