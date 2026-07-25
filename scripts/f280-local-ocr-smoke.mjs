import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f280_local_ocr_smoke');
const pageDir = path.join(outputDir, 'pages');
fs.mkdirSync(pageDir, { recursive: true });

const commonWindowsTools = {
  pdftoppm: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe',
    'C:/Program Files/Calibre2/app/bin/pdftoppm.exe',
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

const run = (command, args, options = {}) => spawnSync(command, args, {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
  ...options,
});

const sha256 = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const repairMojibake = (text) => {
  if (!/[ÃÂâ]/.test(text)) return { text, repaired: false };
  const repaired = Buffer.from(text, 'latin1').toString('utf8');
  const originalBadness = (text.match(/[ÃÂâ]/g) ?? []).length;
  const repairedBadness = (repaired.match(/[ÃÂâ]/g) ?? []).length;
  return repairedBadness < originalBadness ? { text: repaired, repaired: true } : { text, repaired: false };
};

const pdftoppm = which('pdftoppm');
const tesseract = which('tesseract');
const tesseractVersion = tesseract ? (run(tesseract, ['--version']).stdout || '').split(/\r?\n/)[0]?.trim() : undefined;
const languageProbe = tesseract ? run(tesseract, ['--list-langs']) : undefined;
const languages = languageProbe?.status === 0
  ? languageProbe.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.toLowerCase().includes('list of'))
  : [];
const language = languages.includes('spa') && languages.includes('eng') ? 'spa+eng'
  : languages.includes('spa') ? 'spa'
  : languages.includes('eng') ? 'eng'
  : undefined;

const documents = [
  {
    documentId: 'memoria-lab-prod-impsa-2309',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA LAB PROD IMPSA...pdf',
  },
  {
    documentId: 'memoria-ciclotron-kiube-impsa-2309',
    sourcePath: 'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
  },
];

const pageRecords = [];
const documentResults = [];

for (const doc of documents) {
  const warnings = [];
  if (!fs.existsSync(doc.sourcePath)) {
    documentResults.push({ ...doc, status: 'ocr-smoke-failed', exists: false, pagesAttempted: 0, textChars: 0, warnings: ['source-missing'] });
    continue;
  }
  if (!pdftoppm) warnings.push('pdftoppm-missing');
  if (!tesseract) warnings.push('tesseract-missing');
  if (!language) warnings.push('tesseract-language-missing');

  const docOutDir = path.join(pageDir, doc.documentId);
  fs.mkdirSync(docOutDir, { recursive: true });
  const prefix = path.join(docOutDir, 'page');
  let renderOk = false;
  if (pdftoppm) {
    const render = run(pdftoppm, ['-f', '1', '-l', '2', '-png', '-r', '180', doc.sourcePath, prefix]);
    renderOk = render.status === 0;
    if (!renderOk) warnings.push(`pdftoppm-failed:${render.stderr || render.stdout}`.slice(0, 240));
  }

  const images = fs.existsSync(docOutDir)
    ? fs.readdirSync(docOutDir).filter((name) => name.toLowerCase().endsWith('.png')).sort().map((name) => path.join(docOutDir, name))
    : [];
  let textChars = 0;
  let pagesAttempted = 0;

  for (const [index, image] of images.entries()) {
    if (!tesseract || !language) continue;
    pagesAttempted += 1;
    const ocrArgs = [image, 'stdout', '-l', language, '--psm', '6'];
    const ocr = run(tesseract, ocrArgs);
    const rawText = ocr.status === 0 ? ocr.stdout : '';
    const repaired = repairMojibake(rawText);
    const text = repaired.text;
    if (ocr.status !== 0) warnings.push(`tesseract-page-${index + 1}-failed:${ocr.stderr || ocr.stdout}`.slice(0, 240));
    textChars += text.trim().length;
    pageRecords.push({
      documentId: doc.documentId,
      sourcePath: doc.sourcePath,
      sourceHash: sha256(doc.sourcePath),
      page: index + 1,
      imagePath: image,
      imageHash: sha256(image),
      ocrEngine: 'tesseract',
      ocrEngineVersion: tesseractVersion,
      language,
      textChars: text.trim().length,
      text,
      textEncodingRepair: repaired.repaired ? 'latin1-to-utf8-mojibake-repair' : 'none',
      reviewStatus: 'draft-needs-review',
    });
  }

  documentResults.push({
    documentId: doc.documentId,
    sourcePath: doc.sourcePath,
    exists: true,
    sourceHash: sha256(doc.sourcePath),
    status: textChars > 80 ? 'ocr-smoke-ready' : warnings.length ? 'ocr-smoke-warning' : 'ocr-smoke-warning',
    pagesRendered: images.length,
    pagesAttempted,
    textChars,
    warnings,
  });
}

const manifest = {
  phase: 'F280',
  schema: 'radshield-mx.local-ocr-smoke.f280.v1',
  generatedAt: new Date().toISOString(),
  status: 'local-ocr-smoke',
  paidCloudOcrUsed: false,
  tools: {
    pdftoppm: { available: Boolean(pdftoppm), path: pdftoppm },
    tesseract: { available: Boolean(tesseract), path: tesseract, version: tesseractVersion, languages },
  },
  documents: documentResults,
  outputArtifacts: [
    'outputs/f280_local_ocr_smoke/f280_local_ocr_smoke.json',
    'outputs/f280_local_ocr_smoke/f280_local_ocr_pages.jsonl',
  ],
  releaseDecision:
    'F280 smoke creates draft local OCR evidence for the first two pages of each pending memory. Full OCR and DB seed require review of text quality.',
};

fs.writeFileSync(path.join(outputDir, 'f280_local_ocr_smoke.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f280_local_ocr_pages.jsonl'), `${pageRecords.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_280_local_ocr_smoke.md'),
  [
    '# F280 Local OCR Smoke',
    '',
    `Status: ${manifest.status}`,
    `Paid cloud OCR used: ${manifest.paidCloudOcrUsed ? 'yes' : 'no'}`,
    `Tesseract: ${manifest.tools.tesseract.available ? manifest.tools.tesseract.version : 'missing'}`,
    `Languages: ${manifest.tools.tesseract.languages.join(', ') || 'none'}`,
    '',
    '## Documents',
    ...documentResults.map((doc) => `- ${doc.documentId}: ${doc.status}; pages=${doc.pagesAttempted}; chars=${doc.textChars}; warnings=${doc.warnings.join(' | ') || 'none'}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  documents: documentResults.map((doc) => `${doc.documentId}:${doc.status}:${doc.textChars}`),
  tesseract: manifest.tools.tesseract.available ? manifest.tools.tesseract.version : 'missing',
  languages,
}, null, 2));
