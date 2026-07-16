import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f170_rag_citation_governance');
const jsonPath = path.join(outDir, 'f170_rag_citation_governance.json');
const mdPath = path.join(root, 'outputs', 'fase_170_rag_citation_governance.md');
const nodeBinDir = process.env.RADSHIELD_NODE_BIN_DIR || 'C:\\Program Files\\nodejs';
const commandEnv = {
  ...process.env,
  PATH: `${nodeBinDir};${process.env.PATH || ''}`,
};

function runStep(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: commandEnv,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    status: result.status,
    stdoutTail: (result.stdout || '').slice(-3000),
    stderrTail: (result.stderr || '').slice(-3000),
  };
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function numberValue(value) {
  return Number(value ?? 0);
}

fs.mkdirSync(outDir, { recursive: true });

const steps = [
  runStep('Check F168 DB live finalization contracts', process.execPath, ['scripts/check-f168-db-live-finalization-contracts.mjs']),
  runStep('Check F169 predeploy numeric DB QA contracts', process.execPath, ['scripts/check-f169-predeploy-numeric-db-qa-contracts.mjs']),
  runStep('Regenerate F144 source governance manifest', process.execPath, ['scripts/f144-source-governance.mjs']),
  runStep('Check F144 source governance contracts', process.execPath, ['scripts/check-f144-source-governance-contracts.mjs']),
];

const f144 = readJson(path.join(root, 'outputs', 'f144_source_governance', 'f144_source_governance.json'));
const f168 = readJson(path.join(root, 'outputs', 'f168_db_live_finalization', 'f168_db_live_finalization.json'));
const f169 = readJson(path.join(root, 'outputs', 'f169_predeploy_numeric_db_qa', 'f169_predeploy_numeric_db_qa.json'));
const f139 = readJson(path.join(root, 'outputs', 'f139_material_audit', 'f139_material_citation_ocr_audit.json'));
const f143 = readJson(path.join(root, 'outputs', 'f143_zumaya_document_ingestion', 'f143_zumaya_document_ingestion.json'));

const db = {
  configured: Boolean(process.env.DATABASE_URL),
  ok: false,
  totals: null,
  quality: null,
  sourceRows: [],
  canonicalCoverage: [],
  materialCoverage: null,
  zumayaCoverage: null,
  reason: '',
};

try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [totalsRows] = await connection.query(
      'select count(*) as totalChunks, count(distinct source) as distinctSources, count(distinct modality) as distinctModalities from document_chunks',
    );
    const [qualityRows] = await connection.query(
      "select sum(case when content is null or content = '' then 1 else 0 end) as emptyContent, sum(case when source is null or source = '' then 1 else 0 end) as missingSource, sum(case when page_ref is null or page_ref = '' then 1 else 0 end) as missingPageRef, sum(case when tags is null or tags = '' then 1 else 0 end) as missingTags, sum(case when tags like '%hash:%' then 1 else 0 end) as hashTagged from document_chunks",
    );
    const [sourceRows] = await connection.query(
      'select source, modality, count(*) as count, min(page_ref) as minPageRef, max(page_ref) as maxPageRef from document_chunks group by source, modality order by count desc, source limit 80',
    );
    const canonicalQueries = [
      ['NCRP151', "(source like '%151%' or tags like '%NCRP 151%' or content like '%NCRP 151%')"],
      ['NCRP147', "(source like '%147%' or tags like '%NCRP 147%' or content like '%NCRP 147%')"],
      ['IAEA', "(source like '%iaea%' or tags like '%IAEA%' or content like '%IAEA%')"],
      ['TG108', "(source like '%tg108%' or tags like '%TG-108%' or tags like '%AAPM%' or content like '%TG 108%' or content like '%AAPM TG%')"],
      ['UAQ_CNSNS', "(source like '%uaq%' or source like '%cnsns%' or tags like '%CNSNS%' or content like '%CNSNS%' or content like '%UAQ%')"],
    ];
    const canonicalCoverage = [];
    for (const [id, predicate] of canonicalQueries) {
      const [rows] = await connection.query(`select count(*) as count, count(distinct source) as sources from document_chunks where ${predicate}`);
      canonicalCoverage.push({ id, count: numberValue(rows[0]?.count), sources: numberValue(rows[0]?.sources) });
    }
    const [materialRows] = await connection.query("select count(*) as count, count(distinct source) as sources, sum(case when tags like '%hash:%' then 1 else 0 end) as hashTagged from document_chunks where source like 'f138-%' or modality='Materials'");
    const [zumayaRows] = await connection.query("select count(*) as count, count(distinct source) as sources from document_chunks where source like 'f143-%'");

    db.totals = {
      totalChunks: numberValue(totalsRows[0]?.totalChunks),
      distinctSources: numberValue(totalsRows[0]?.distinctSources),
      distinctModalities: numberValue(totalsRows[0]?.distinctModalities),
    };
    db.quality = {
      emptyContent: numberValue(qualityRows[0]?.emptyContent),
      missingSource: numberValue(qualityRows[0]?.missingSource),
      missingPageRef: numberValue(qualityRows[0]?.missingPageRef),
      missingTags: numberValue(qualityRows[0]?.missingTags),
      hashTagged: numberValue(qualityRows[0]?.hashTagged),
    };
    db.sourceRows = sourceRows.map((row) => ({
      source: row.source,
      modality: row.modality,
      count: numberValue(row.count),
      minPageRef: row.minPageRef,
      maxPageRef: row.maxPageRef,
    }));
    db.canonicalCoverage = canonicalCoverage;
    db.materialCoverage = {
      count: numberValue(materialRows[0]?.count),
      sources: numberValue(materialRows[0]?.sources),
      hashTagged: numberValue(materialRows[0]?.hashTagged),
    };
    db.zumayaCoverage = {
      count: numberValue(zumayaRows[0]?.count),
      sources: numberValue(zumayaRows[0]?.sources),
    };
    db.ok = db.totals.totalChunks >= 2 && db.quality.emptyContent === 0 && db.quality.missingSource === 0;
    db.reason = 'document_chunks readback completed';
  } finally {
    await connection.end();
  }
} catch (error) {
  db.reason = error instanceof Error ? error.message : String(error);
}

const canonicalPresent = db.canonicalCoverage.filter((item) => item.count > 0).map((item) => item.id);
const canonicalMissing = db.canonicalCoverage.filter((item) => item.count === 0).map((item) => item.id);
const contentTier = db.totals?.totalChunks >= 500
  ? 'full-rag-corpus'
  : db.totals?.totalChunks >= 100
    ? 'material-or-project-corpus'
    : db.totals?.totalChunks >= 2
      ? 'minimum-seed-corpus'
      : 'insufficient-corpus';

const gates = {
  f168Ready: f168?.status === 'db-live-ready',
  f169Ready: f169?.status === 'predeploy-numeric-ready',
  f144Ready: f144?.status === 'ready' && (f144?.canonicalCount ?? 0) >= 3,
  dbReadable: db.ok,
  sourceQualityMinimum: db.quality?.emptyContent === 0 && db.quality?.missingSource === 0,
  citationMinimum: canonicalPresent.length >= 2,
};

const releaseWarnings = [];
if (contentTier === 'minimum-seed-corpus') releaseWarnings.push('DB RAG opera con corpus minimo semilla; reingestar f138/f143 antes de depender de citas amplias.');
if (canonicalMissing.length) releaseWarnings.push(`Cobertura canonica faltante o no detectable en DB: ${canonicalMissing.join(', ')}.`);
if ((db.quality?.missingPageRef ?? 0) > 0) releaseWarnings.push('Hay chunks sin page_ref; las citas deben mostrarse como fuente sin pagina hasta corregir.');
if ((db.materialCoverage?.count ?? 0) === 0) releaseWarnings.push('Material RAG f138 no esta presente en DB live actual; anexos de materiales deben usar outputs/manifiestos o re-seed.');
if ((db.zumayaCoverage?.count ?? 0) === 0) releaseWarnings.push('Memorias Zumaya/f143 no estan presentes en DB live actual; re-seed requerido para aprendizaje amplio.');

const ready = Object.values(gates).every(Boolean);
const status = ready ? 'rag-citation-governance-ready' : 'rag-citation-governance-gated';

const manifest = {
  phase: 'F170',
  title: 'RAG citation governance DB-backed',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.rag-citation-governance.f170.v1',
  status,
  contentTier,
  gates,
  db,
  upstream: {
    f139Status: f139?.status ?? null,
    f143Status: f143?.status ?? null,
    f144Status: f144?.status ?? null,
    f168Status: f168?.status ?? null,
    f169Status: f169?.status ?? null,
  },
  citationPolicy: [
    'Cada cita debe incluir source, page_ref si existe, modality/tags y estado de evidencia.',
    'Fuentes normativas tienen prioridad sobre memorias analiticas y vendor guides.',
    'Memorias previas se usan como ejemplo de estructura, no como fuente normativa canonica.',
    'Materiales vendor/lab requieren hash, pagina y revision profesional antes de promover a constante de calculo.',
    'Si el corpus DB esta en modo semilla, Memoria IA debe avisar que la busqueda RAG no cubre todo el expediente.',
  ],
  releaseWarnings,
  nextRecommendedPhases: [
    'F171 canvas polish predeploy con seleccion, snapping visible, cotas y panel propiedades.',
    'Re-seed f138/f143 si se requiere RAG amplio antes del deploy publico.',
    'Reintentar F167/F154-F158 cuando el remoto Sites este accesible.',
  ],
  steps,
};

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F170 - RAG Citation Governance DB-backed',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `Tier de contenido: **${manifest.contentTier}**`,
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'FAIL'}`),
  '',
  '## DB document_chunks',
  '',
  `- Chunks: ${db.totals?.totalChunks ?? 0}`,
  `- Fuentes: ${db.totals?.distinctSources ?? 0}`,
  `- Modalidades: ${db.totals?.distinctModalities ?? 0}`,
  `- Empty content: ${db.quality?.emptyContent ?? 'N/D'}`,
  `- Missing source: ${db.quality?.missingSource ?? 'N/D'}`,
  `- Missing page_ref: ${db.quality?.missingPageRef ?? 'N/D'}`,
  `- Hash tagged: ${db.quality?.hashTagged ?? 'N/D'}`,
  '',
  '## Cobertura canonica',
  '',
  ...db.canonicalCoverage.map((item) => `- ${item.id}: ${item.count} chunks / ${item.sources} fuentes`),
  '',
  '## Warnings',
  '',
  ...(releaseWarnings.length ? releaseWarnings.map((item) => `- ${item}`) : ['- Sin warnings.']),
  '',
  '## Politica de citas',
  '',
  ...manifest.citationPolicy.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F170 RAG citation governance written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${status}`);

if (!ready) process.exit(1);
