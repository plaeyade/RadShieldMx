import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f279_local_free_ocr_gate');
fs.mkdirSync(outputDir, { recursive: true });

const commonWindowsTools = {
  pdftoppm: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe',
    'C:/Program Files/Calibre2/app/bin/pdftoppm.exe',
  ],
  pdftotext: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftotext.exe',
    'C:/Program Files/Calibre2/app/bin/pdftotext.exe',
  ],
  tesseract: [
    'C:/Program Files/Tesseract-OCR/tesseract.exe',
    'C:/Program Files (x86)/Tesseract-OCR/tesseract.exe',
    `${process.env.LOCALAPPDATA ?? ''}/Programs/Tesseract-OCR/tesseract.exe`,
  ],
};

const which = (name) => {
  for (const candidate of commonWindowsTools[name] ?? []) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  const probe = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [name], { encoding: 'utf8' });
  if (probe.status === 0) return probe.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
  return undefined;
};
const versionOf = (command, args = ['--version']) => {
  const found = which(command);
  if (!found) return undefined;
  const probe = spawnSync(found, args, { encoding: 'utf8' });
  return (probe.stdout || probe.stderr || '').split(/\r?\n/)[0]?.trim();
};
const hashFile = (filePath) => {
  if (!fs.existsSync(filePath)) return undefined;
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const pendingDocuments = [
  'C:/Users/carlo/Downloads/RadShield Mx/2309 MA LAB PROD IMPSA...pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
].map((sourcePath) => ({
  sourcePath,
  exists: fs.existsSync(sourcePath),
  sizeBytes: fs.existsSync(sourcePath) ? fs.statSync(sourcePath).size : 0,
  sha256: hashFile(sourcePath),
}));

const tools = [
  {
    id: 'pdfjs',
    status: fs.existsSync(path.join(root, 'node_modules', 'pdfjs-dist')) ? 'bundled-js' : 'missing',
    commandPath: undefined,
    version: undefined,
    role: 'Extract embedded/searchable PDF text before OCR.',
  },
  {
    id: 'pdftotext',
    status: which('pdftotext') ? 'available' : 'missing',
    commandPath: which('pdftotext'),
    version: versionOf('pdftotext', ['-v']),
    role: 'Free Poppler text extraction fallback.',
  },
  {
    id: 'pdftoppm',
    status: which('pdftoppm') ? 'available' : 'missing',
    commandPath: which('pdftoppm'),
    version: versionOf('pdftoppm', ['-v']),
    role: 'Render scanned pages before Tesseract OCR.',
  },
  {
    id: 'tesseract',
    status: which('tesseract') ? 'available' : 'missing',
    commandPath: which('tesseract'),
    version: versionOf('tesseract', ['--version']),
    role: 'Local OCR engine.',
  },
  {
    id: 'ocrmypdf',
    status: which('ocrmypdf') ? 'available' : 'missing',
    commandPath: which('ocrmypdf'),
    version: versionOf('ocrmypdf', ['--version']),
    role: 'Optional local searchable PDF wrapper.',
  },
];

const hasRenderAndOcr = tools.some((tool) => tool.id === 'pdftoppm' && tool.status === 'available')
  && tools.some((tool) => tool.id === 'tesseract' && tool.status === 'available');
const hasOcrMyPdf = tools.some((tool) => tool.id === 'ocrmypdf' && tool.status === 'available');

const manifest = {
  phase: 'F279',
  schema: 'radshield-mx.local-free-ocr-gate.f279.v1',
  generatedAt: new Date().toISOString(),
  status: 'local-free-ocr-gate',
  paidCloudOcrRolledBack: true,
  liveOcrExecuted: false,
  localPipelineStatus: hasRenderAndOcr || hasOcrMyPdf ? 'ready-for-local-fixture' : 'install-local-ocr-tools',
  tools,
  pendingDocuments,
  recommendedPipeline: [
    'Try embedded/searchable text with pdfjs or pdftotext.',
    'If text yield is low, render pages with pdftoppm or use OCRmyPDF.',
    'Run Tesseract locally with spa+eng language data.',
    'Write page-level OCR JSONL with source hash, page number, engine version and review state.',
    'Only reviewed OCR chunks can be seeded into document_chunks.',
  ],
  installOptions: [
    'Tesseract OCR for Windows + language data spa/eng.',
    'Poppler for Windows for pdftotext/pdftoppm.',
    'Optional OCRmyPDF through Python/pip when a searchable PDF output is desired.',
  ],
  releaseDecision:
    'F279 makes local/free OCR the first-pass path. No paid Google/Amazon OCR will run unless local OCR fails quality checks and operator approves cost.',
};

fs.writeFileSync(path.join(outputDir, 'f279_local_free_ocr_gate.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_279_local_free_ocr_gate.md'),
  [
    '# F279 Local Free OCR Gate',
    '',
    `Status: ${manifest.status}`,
    `Local pipeline: ${manifest.localPipelineStatus}`,
    `Paid cloud OCR rolled back: ${manifest.paidCloudOcrRolledBack ? 'yes' : 'no'}`,
    '',
    '## Tools',
    ...tools.map((tool) => `- ${tool.id}: ${tool.status}${tool.version ? ` (${tool.version})` : ''}`),
    '',
    '## Pending Documents',
    ...pendingDocuments.map((doc) => `- ${path.basename(doc.sourcePath)}: ${doc.exists ? 'available' : 'missing'}; ${doc.sizeBytes} bytes`),
    '',
    '## Install Options',
    ...manifest.installOptions.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  localPipelineStatus: manifest.localPipelineStatus,
  tools: tools.map((tool) => `${tool.id}:${tool.status}`),
}, null, 2));
