import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const root = process.cwd();
const f499Dir = path.join(root, 'outputs', 'f499_regulatory_materials_seed_dry_run');
const f500Dir = path.join(root, 'outputs', 'f500_regulatory_materials_live_gate');
const outDir = path.join(root, 'outputs', 'f506_f507_regulatory_seed_readback');
fs.mkdirSync(outDir, { recursive: true });

const readbackRequested = process.env.F506_DB_READBACK === '1';
const seedLiveRequested = process.env.F507_SEED_LIVE === '1';
const seedApprovedOnlyConfirmed = process.env.F507_CONFIRM_APPROVED_ONLY === '1';
const seedRestoreProbeConfirmed = process.env.F507_CONFIRM_RESTORE_PROBE === '1';
const targetTables = ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links'];

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeJsonl(fileName, rows) {
  fs.writeFileSync(path.join(outDir, fileName), `${rows.map((row) => JSON.stringify(row)).join('\n')}${rows.length ? '\n' : ''}`, 'utf8');
}

function writeCsv(fileName, rows) {
  const headers = rows.length ? Object.keys(rows[0]) : ['id', 'title', 'reason'];
  const lines = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))];
  fs.writeFileSync(path.join(outDir, fileName), `${lines.join('\n')}\n`, 'utf8');
}

function hashContent(value) {
  return `sha256-${crypto.createHash('sha256').update(String(value ?? '')).digest('hex').slice(0, 24)}`;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sourceAliases(row) {
  const text = normalize(`${row.id} ${row.title}`);
  const aliases = new Set();
  if (text.includes('151')) aliases.add('ncrp 151').add('151').add('structural shielding design');
  if (text.includes('147')) aliases.add('ncrp 147').add('147').add('diagnostic');
  if (text.includes('iaea') || text.includes('srs-47') || text.includes('srs 47')) aliases.add('iaea').add('srs 47').add('safety reports series no. 47');
  if (text.includes('tg108') || text.includes('tg-108') || text.includes('pet')) aliases.add('tg 108').add('tg-108').add('aapm');
  if (text.includes('uaq') || text.includes('cnsns')) aliases.add('uaq').add('cnsns');
  if (text.includes('nipoll') || text.includes('contuplex')) aliases.add('nipoll').add('contuplex').add('tabique').add('tvl');
  if (text.includes('nelco')) aliases.add('nelco');
  if (text.includes('verishield')) aliases.add('verishield');
  if (text.includes('concrete') || text.includes('concreto')) aliases.add('concrete').add('concreto').add('tvl');
  if (text.includes('barite') || text.includes('barita')) aliases.add('barite').add('barita');
  if (text.includes('iron') || text.includes('hierro')) aliases.add('iron').add('hierro');
  if (text.includes('steel') || text.includes('acero')) aliases.add('steel').add('acero');
  if (text.includes('lead') || text.includes('plomo')) aliases.add('lead').add('plomo');
  if (text.includes('poly') || text.includes('polietileno')) aliases.add('polyethylene').add('polietileno').add('borated').add('boratado');
  if (text.includes('tungsten') || text.includes('tungsteno')) aliases.add('tungsten').add('tungsteno');
  if (text.includes('aluminum') || text.includes('aluminio')) aliases.add('aluminum').add('aluminio');
  if (text.includes('water') || text.includes('agua')) aliases.add('water').add('agua');
  return [...aliases].filter((alias) => alias.length >= 3).slice(0, 8);
}

function scoreChunk(row, chunk) {
  const haystack = normalize(`${chunk.source} ${chunk.section} ${chunk.modality} ${chunk.tags} ${chunk.content}`);
  return sourceAliases(row).reduce((score, alias) => score + (haystack.includes(normalize(alias)) ? 1 : 0), 0);
}

async function readDocumentChunks(databaseUrl) {
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL not configured.', chunks: [] };
  if (!readbackRequested) return { ok: false, reason: 'Set F506_DB_READBACK=1 to query document_chunks.', chunks: [] };
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [rows] = await connection.query(
      `SELECT id, source, section, modality, page_ref AS pageRef, tags, LEFT(content, 600) AS content
       FROM document_chunks
       WHERE content IS NOT NULL AND content <> ''
       ORDER BY id DESC
       LIMIT 5000`,
    );
    return { ok: true, reason: 'document_chunks readback completed.', chunks: rows };
  } finally {
    await connection.end();
  }
}

function resolveSources(sources, chunks) {
  return sources.map((row) => {
    const scored = chunks.map((chunk) => ({ chunk, score: scoreChunk(row, chunk) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    const best = scored[0] ?? null;
    const hasHardPending = /pending|document_chunks/i.test(row.pageRef || '');
    const alreadyReference = !hasHardPending && row.reviewState === 'approved-reference';
    const matchThreshold = row.authority === 'normative' ? 1 : 2;
    const resolvedByChunk = best && best.score >= matchThreshold;
    const resolved = Boolean(resolvedByChunk || alreadyReference);
    const bestChunk = best?.chunk ?? null;
    const documentHash = resolvedByChunk ? hashContent(`${bestChunk.source}|${bestChunk.section}|${bestChunk.pageRef}|${bestChunk.content}`) : row.documentHash;
    const pageRef = resolvedByChunk ? String(bestChunk.pageRef || bestChunk.section || 'page-ref-detected') : row.pageRef;
    const confidence = resolvedByChunk ? Math.min(1, best.score / 4) : alreadyReference ? 0.65 : 0;
    return {
      ...row,
      documentHash,
      pageRef,
      resolutionStatus: resolved ? (resolvedByChunk ? 'resolved-from-document-chunks' : 'reference-page-ref-carried') : 'unresolved-review-required',
      resolutionConfidence: Number(confidence.toFixed(2)),
      matchedChunkId: bestChunk?.id ?? null,
      matchedSource: bestChunk?.source ?? null,
      matchedSection: bestChunk?.section ?? null,
      matchedPageRef: bestChunk?.pageRef ?? null,
      matchedScore: best?.score ?? 0,
      aliases: sourceAliases(row).join('|'),
      notes: `${row.notes || ''} F506: ${resolved ? 'source/page/hash readback available.' : 'requires manual page/hash review before live seed.'}`.trim(),
    };
  });
}

async function liveSeed(databaseUrl, seedPlan) {
  const result = {
    requested: seedLiveRequested,
    attempted: false,
    ok: false,
    inserted: {},
    reason: '',
  };
  if (!seedLiveRequested) {
    result.reason = 'Dry-run only. Set F507_SEED_LIVE=1 for transaction.';
    return result;
  }
  const blockers = [
    ...(!databaseUrl ? ['DATABASE_URL not configured.'] : []),
    ...(!seedApprovedOnlyConfirmed ? ['F507_CONFIRM_APPROVED_ONLY=1 is required.'] : []),
    ...(!seedRestoreProbeConfirmed ? ['F507_CONFIRM_RESTORE_PROBE=1 is required.'] : []),
  ];
  if (blockers.length) {
    result.reason = blockers.join(' ');
    return result;
  }

  const connection = await mysql.createConnection(databaseUrl);
  result.attempted = true;
  try {
    await connection.beginTransaction();
    for (const table of targetTables) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS rowCount FROM \`${table}\``);
      const rowCount = Number(rows[0]?.rowCount ?? 0);
      if (rowCount > 0) {
        throw new Error(`${table} already has ${rowCount} rows; aborting to avoid overwrite.`);
      }
    }

    for (const row of seedPlan.regulatorySources) {
      await connection.query(
        'INSERT INTO regulatory_sources (id,title,authority,canonical_rank,document_hash,page_ref,review_state,allowed_uses,notes) VALUES (?,?,?,?,?,?,?,?,?)',
        [row.id, row.title, row.authority, row.canonicalRank, row.documentHash, row.pageRef, row.reviewState, row.allowedUses, row.notes],
      );
    }
    result.inserted.regulatory_sources = seedPlan.regulatorySources.length;

    for (const row of seedPlan.materialConstants) {
      await connection.query(
        'INSERT INTO material_constants (id,name,category,manufacturer,density_g_cm3,density_state,review_state,allowed_uses,warnings) VALUES (?,?,?,?,?,?,?,?,?)',
        [row.id, row.name, row.category, row.manufacturer, row.density_g_cm3, row.densityState, row.reviewState, row.allowedUses, row.warnings],
      );
    }
    result.inserted.material_constants = seedPlan.materialConstants.length;

    for (const row of seedPlan.materialValueVersions) {
      await connection.query(
        'INSERT INTO material_value_versions (id,material_id,value_kind,energy_key,value,unit,source_id,review_state,allowed_use) VALUES (?,?,?,?,?,?,?,?,?)',
        [row.id, row.materialId, row.valueKind, row.energyKey, row.value, row.unit, row.sourceId, row.reviewState, row.allowedUse],
      );
    }
    result.inserted.material_value_versions = seedPlan.materialValueVersions.length;

    for (const row of seedPlan.materialSourceLinks) {
      await connection.query(
        'INSERT INTO material_source_links (material_id,source_id,allowed_use,review_state) VALUES (?,?,?,?)',
        [row.materialId, row.sourceId, row.allowedUse, row.reviewState],
      );
    }
    result.inserted.material_source_links = seedPlan.materialSourceLinks.length;

    await connection.commit();
    result.ok = true;
    result.reason = 'Approved-only controlled seed committed.';
  } catch (error) {
    await connection.rollback();
    result.reason = error instanceof Error ? error.message : String(error);
  } finally {
    await connection.end();
  }
  return result;
}

const f499Manifest = readJson(path.join(f499Dir, 'f499_seed_manifest.json'));
const f500Manifest = readJson(path.join(f500Dir, 'f500_live_gate_manifest.json'));
const regulatorySources = readJsonl(path.join(f499Dir, 'f499_regulatory_sources.jsonl'));
const materialConstants = readJsonl(path.join(f499Dir, 'f499_material_constants.jsonl'));
const materialValueVersions = readJsonl(path.join(f499Dir, 'f499_material_value_versions.jsonl'));
const materialSourceLinks = readJsonl(path.join(f499Dir, 'f499_material_source_links.jsonl'));

let dbReadback;
try {
  dbReadback = await readDocumentChunks(process.env.DATABASE_URL);
} catch (error) {
  dbReadback = { ok: false, reason: error instanceof Error ? error.message : String(error), chunks: [] };
}

const resolvedSources = resolveSources(regulatorySources, dbReadback.chunks ?? []);
const seedableSourceIds = new Set(resolvedSources
  .filter((row) => row.reviewState === 'approved-reference' && row.allowedUses.includes('calculation') && row.resolutionStatus !== 'unresolved-review-required')
  .map((row) => row.id));
const seedableMaterialIds = new Set(materialConstants
  .filter((row) => row.reviewState === 'approved-reference' && row.allowedUses.includes('calculation'))
  .map((row) => row.id));

const seedPlan = {
  regulatorySources: resolvedSources.filter((row) => seedableSourceIds.has(row.id)).map(({ resolutionStatus, resolutionConfidence, matchedChunkId, matchedSource, matchedSection, matchedPageRef, matchedScore, aliases, ...row }) => row),
  materialConstants: materialConstants.filter((row) => seedableMaterialIds.has(row.id)),
  materialValueVersions: materialValueVersions.filter((row) => row.reviewState === 'approved-reference' && row.allowedUse === 'calculation' && seedableSourceIds.has(row.sourceId) && seedableMaterialIds.has(row.materialId)),
  materialSourceLinks: materialSourceLinks.filter((row) => row.reviewState === 'approved-reference' && seedableSourceIds.has(row.sourceId) && seedableMaterialIds.has(row.materialId)),
};

const unresolved = resolvedSources.filter((row) => row.resolutionStatus === 'unresolved-review-required');
const reviewRequiredValues = materialValueVersions.filter((row) => row.reviewState !== 'approved-reference');
const seedLive = await liveSeed(process.env.DATABASE_URL, seedPlan);

const blockers = [
  ...(!f499Manifest ? ['F499 manifest missing.'] : []),
  ...(!f500Manifest?.restoreProbe?.ok ? ['F153/F500 restore probe is not ready.'] : []),
  ...(!dbReadback.ok ? [`F506 document_chunks readback not ready: ${dbReadback.reason}`] : []),
  ...(seedPlan.regulatorySources.length === 0 ? ['No approved resolved regulatory sources are seedable.'] : []),
  ...(seedPlan.materialValueVersions.length === 0 ? ['No approved calculation value versions are seedable.'] : []),
  ...(seedLiveRequested && !seedLive.ok ? [`F507 live seed failed or blocked: ${seedLive.reason}`] : []),
];

const manifest = {
  schema: 'radshield-mx.db.regulatory-materials.f506-f507.v1',
  phases: ['F506', 'F507'],
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? (seedLive.ok ? 'approved-seed-live-applied' : 'approved-seed-dry-run-ready') : 'blocked',
  input: {
    f499Present: Boolean(f499Manifest),
    f500Status: f500Manifest?.status ?? null,
    f500DbReadbackOk: Boolean(f500Manifest?.dbReadback?.ok),
  },
  dbReadback: {
    requested: readbackRequested,
    ok: dbReadback.ok,
    reason: dbReadback.reason,
    chunkSampleCount: dbReadback.chunks?.length ?? 0,
  },
  sourceResolution: {
    total: resolvedSources.length,
    resolved: resolvedSources.filter((row) => row.resolutionStatus !== 'unresolved-review-required').length,
    unresolved: unresolved.length,
    seedableApprovedSources: seedPlan.regulatorySources.length,
  },
  valueReview: {
    total: materialValueVersions.length,
    seedableApprovedCalculationValues: seedPlan.materialValueVersions.length,
    reviewRequiredValueVersions: reviewRequiredValues.length,
  },
  seedPlanCounts: {
    regulatorySources: seedPlan.regulatorySources.length,
    materialConstants: seedPlan.materialConstants.length,
    materialValueVersions: seedPlan.materialValueVersions.length,
    materialSourceLinks: seedPlan.materialSourceLinks.length,
  },
  liveSeed: seedLive,
  blockers,
  nextPhase: blockers.length === 0
    ? 'F508 repeat F500_DB_READBACK=1 and F484-F490 QA against live material tables.'
    : 'Resolve F506/F507 blockers; do not promote review-required material values.',
};

const reviewQueueRows = [
  ...unresolved.map((row) => ({
    type: 'source',
    id: row.id,
    title: row.title,
    reviewState: row.reviewState,
    reason: 'No clear document_chunks page/hash match.',
    aliases: row.aliases,
  })),
  ...reviewRequiredValues.map((row) => ({
    type: 'material-value-version',
    id: row.id,
    title: `${row.materialId} ${row.valueKind} ${row.energyKey ?? ''}`,
    reviewState: row.reviewState,
    reason: 'Value is not approved-reference; excluded from F507 seed.',
    aliases: row.sourceId,
  })),
];

writeJsonl('f506_resolved_regulatory_sources.jsonl', resolvedSources);
writeJsonl('f507_approved_seed_regulatory_sources.jsonl', seedPlan.regulatorySources);
writeJsonl('f507_approved_seed_material_constants.jsonl', seedPlan.materialConstants);
writeJsonl('f507_approved_seed_material_value_versions.jsonl', seedPlan.materialValueVersions);
writeJsonl('f507_approved_seed_material_source_links.jsonl', seedPlan.materialSourceLinks);
writeCsv('f506_unresolved_review_queue.csv', reviewQueueRows);
fs.writeFileSync(path.join(outDir, 'f506_f507_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f506_f507_summary.md'), [
  '# F506-F507 REGULATORY MATERIALS SEED READBACK',
  '',
  `Estado: ${manifest.status}`,
  `F506 readback DB: ${manifest.dbReadback.ok ? 'OK' : 'NO'} (${manifest.dbReadback.reason})`,
  `Fuentes resueltas: ${manifest.sourceResolution.resolved}/${manifest.sourceResolution.total}`,
  `Fuentes aprobadas seedables: ${manifest.sourceResolution.seedableApprovedSources}`,
  `Valores aprobados seedables: ${manifest.valueReview.seedableApprovedCalculationValues}`,
  `Valores en revision excluidos: ${manifest.valueReview.reviewRequiredValueVersions}`,
  `Live seed solicitado: ${seedLive.requested ? 'si' : 'no'}`,
  `Live seed OK: ${seedLive.ok ? 'si' : 'no'}`,
  '',
  '## Seed plan',
  `- regulatory_sources: ${manifest.seedPlanCounts.regulatorySources}`,
  `- material_constants: ${manifest.seedPlanCounts.materialConstants}`,
  `- material_value_versions: ${manifest.seedPlanCounts.materialValueVersions}`,
  `- material_source_links: ${manifest.seedPlanCounts.materialSourceLinks}`,
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno.']),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F506-F507 generated. status=${manifest.status} resolved=${manifest.sourceResolution.resolved}/${manifest.sourceResolution.total} seedValues=${manifest.seedPlanCounts.materialValueVersions} live=${seedLive.ok}`);
