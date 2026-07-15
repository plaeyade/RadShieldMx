import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f141_material_ocr_recovery');
mkdirSync(outputDir, { recursive: true });

const python = process.env.PYTHON_EXE || 'C:\\Users\\carlo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const f138Path = path.join(root, 'outputs', 'f138_material_rag', 'f138_material_rag_manifest.json');
const f139Path = path.join(root, 'outputs', 'f139_material_audit', 'f139_material_citation_ocr_audit.json');

const recoveryDocs = [
  {
    id: 'bloques-hd-characterization',
    title: 'Caracterizacion de bloques HD',
    source: 'f138-bloques-hd-characterization',
    path: 'C:\\Users\\carlo\\Downloads\\CARACTERIZACION DE BLOQUES HD.pdf',
    previousSha256: '87734def2bdf6241d48d924b146ca680776794d1027b44397e8d73d9860700c8',
  },
  {
    id: 'scanpro-hd-materials',
    title: 'ScanPRO high-density material scan',
    source: 'f138-scanpro-hd-materials',
    path: 'C:\\Users\\carlo\\Downloads\\ScanPRO-2024-08-26-16-38-02.pdf',
    previousSha256: '038c0f532e4d085402b906a70f9484d81f2d8696b3fe31517ee1c663e5496c81',
  },
];

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function readJson(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

const pythonCode = String.raw`
import json, sys
from pathlib import Path
from pypdf import PdfReader

docs = json.loads(sys.argv[1])
out = []
for doc in docs:
    p = Path(doc["path"])
    item = {"id": doc["id"], "exists": p.exists(), "pages": 0, "pageTextLengths": [], "totalTextLength": 0, "zeroTextPages": [], "error": None}
    if p.exists():
        try:
            reader = PdfReader(str(p))
            item["pages"] = len(reader.pages)
            for index, page in enumerate(reader.pages):
                text = (page.extract_text() or "").strip()
                item["pageTextLengths"].append(len(text))
                if not text:
                    item["zeroTextPages"].append(index + 1)
                item["totalTextLength"] += len(text)
        except Exception as exc:
            item["error"] = str(exc)
    out.append(item)
print(json.dumps(out, ensure_ascii=False))
`;

const extraction = spawnSync(python, ['-c', pythonCode, JSON.stringify(recoveryDocs)], {
  encoding: 'utf8',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  maxBuffer: 10 * 1024 * 1024,
});

if (extraction.status !== 0) {
  throw new Error(`F141 PDF extraction failed: ${extraction.stderr || extraction.stdout}`);
}

const extracted = JSON.parse(extraction.stdout);
const f138 = readJson(f138Path);
const f139 = readJson(f139Path);
const manifest = f138?.manifest ?? [];
const dbRows = f139?.db?.sourceRows ?? [];
const sourceMap = new Map(dbRows.map((row) => [row.source, Number(row.count)]));

const recovered = recoveryDocs.map((doc) => {
  const item = extracted.find((entry) => entry.id === doc.id);
  const f138Doc = manifest.find((entry) => entry.id === doc.id);
  const currentSha256 = item?.exists ? sha256(doc.path) : null;
  const textLength = Number(item?.totalTextLength ?? 0);
  const status = textLength >= 400 && Number(item?.zeroTextPages?.length ?? 0) === 0
    ? 'recovered-searchable'
    : textLength >= 400
      ? 'partial-searchable'
      : 'still-needs-ocr';
  return {
    ...doc,
    exists: Boolean(item?.exists),
    pages: Number(item?.pages ?? 0),
    textLength,
    zeroTextPages: item?.zeroTextPages ?? [],
    currentSha256,
    changedFromF139Blocker: currentSha256 !== doc.previousSha256,
    f138Status: f138Doc?.status ?? 'missing-from-f138-manifest',
    f138ChunkCount: Number(f138Doc?.chunkCount ?? 0),
    dbChunkCount: sourceMap.get(doc.source) ?? 0,
    status,
  };
});

const allRecovered = recovered.every((doc) => doc.status === 'recovered-searchable' || doc.status === 'partial-searchable');
const dbAligned = recovered.every((doc) => doc.f138Status === 'rag-ready' && doc.f138ChunkCount > 0 && doc.dbChunkCount === doc.f138ChunkCount);
const f139Ready = f139?.status === 'ready' && Number(f139?.ocr?.pendingCount ?? -1) === 0;

const output = {
  phase: 'F141',
  status: allRecovered && dbAligned && f139Ready ? 'ready' : 'blocked',
  generatedAt: new Date().toISOString(),
  recovered,
  db: {
    f138ManifestAvailable: Boolean(f138),
    f139AuditAvailable: Boolean(f139),
    dbAligned,
    f139Status: f139?.status ?? 'missing',
    f139OcrPendingCount: f139?.ocr?.pendingCount ?? null,
    sourceRows: dbRows.filter((row) => recoveryDocs.some((doc) => doc.source === row.source)),
  },
  canvasUxActions: [
    'Add material evidence confidence and OCR/searchable badges in material/canvas panels.',
    'Show partial-searchable warning for ScanPRO until pages 2 and 10 are OCR-reviewed.',
    'Connect recovered material evidence to structural load, cost/time and Memoria IA citations.',
  ],
  evidence: [
    'outputs/f141_material_ocr_recovery/f141_material_ocr_recovery.json',
    'outputs/fase_141_material_ocr_recovery.md',
    'outputs/f138_material_rag/f138_material_rag_manifest.json',
    'outputs/f139_material_audit/f139_material_citation_ocr_audit.json',
  ],
  nextPhase: 'F140 documentation suite, then F142 Memoria IA material-evidence workflow.',
  decision: allRecovered
    ? 'The reuploaded PDFs are searchable enough for RAG/DB use. ScanPRO keeps a partial OCR warning because two pages still have no extracted text.'
    : 'At least one reuploaded PDF still needs OCR before DB/RAG use.',
};

writeFileSync(path.join(outputDir, 'f141_material_ocr_recovery.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_141_material_ocr_recovery.md'),
  [
    '# F141 Material OCR Recovery',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Recovered PDFs',
    ...recovered.map((doc) => `- ${doc.status} ${doc.id}: ${doc.pages} pages, ${doc.textLength} chars, chunks ${doc.dbChunkCount}, zero-text pages ${doc.zeroTextPages.join(', ') || 'none'}`),
    '',
    '## DB / Audit',
    `- F138 manifest available: ${output.db.f138ManifestAvailable}`,
    `- F139 audit available: ${output.db.f139AuditAvailable}`,
    `- DB aligned: ${output.db.dbAligned}`,
    `- F139 status: ${output.db.f139Status}`,
    `- F139 OCR pending: ${output.db.f139OcrPendingCount}`,
    '',
    '## Canvas / Memoria IA Follow-up',
    ...output.canvasUxActions.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F141 material OCR recovery ${output.status}: ${recovered.map((doc) => `${doc.id}=${doc.status}/${doc.dbChunkCount}`).join(', ')}`);
if (output.status === 'blocked') process.exit(1);
