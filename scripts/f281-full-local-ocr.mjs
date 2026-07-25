import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f281_full_local_ocr');
const pageDir = path.join(outputDir, 'pages');
const textDir = path.join(outputDir, 'text');
fs.mkdirSync(pageDir, { recursive: true });
fs.mkdirSync(textDir, { recursive: true });

const toolCandidates = {
  pdfinfo: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdfinfo.exe',
    'C:/Program Files/Calibre2/app/bin/pdfinfo.exe',
  ],
  pdftotext: [
    'C:/Users/carlo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftotext.exe',
    'C:/Program Files/Calibre2/app/bin/pdftotext.exe',
  ],
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

const explicitDocuments = [
  'C:/Users/carlo/Downloads/RadShield Mx/2309 MA LAB PROD IMPSA...pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/2309 MA CICLOTRON KIUBE IMPSA.. (1).pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Memoria de Cálculo Ciclotrón.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Memoria Analítica Ciclotrón.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/2505 MA Gamma Knife HAHS Pedregal V2.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo Braqui con Co-60.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo 1 Versa HD 15 MV.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo 2- Versa HD 15 MV-.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo 3 -Versa HD 15 MV.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo 4 Versa HD 15 MV.pdf',
  'C:/Users/carlo/Downloads/RadShield Mx/Ejemplo 5 Versa HD 15 MV.pdf',
];

const run = (command, args, options = {}) => spawnSync(command, args, {
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
  ...options,
});

const which = (name) => {
  for (const candidate of toolCandidates[name] ?? []) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  const probe = run(process.platform === 'win32' ? 'where.exe' : 'which', [name]);
  if (probe.status === 0) return probe.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
  return undefined;
};

const normalizeMaybeDir = (candidate) => {
  if (!candidate) return undefined;
  const normalized = candidate.replace(/\\/g, '/');
  if (normalized.toLowerCase().endsWith('/tessdata')) return normalized;
  if (fs.existsSync(path.join(candidate, 'tessdata'))) return path.join(candidate, 'tessdata').replace(/\\/g, '/');
  return normalized;
};

const tessdataCandidates = [
  process.env.F281_TESSDATA_DIR,
  process.env.TESSDATA_PREFIX,
  'C:/Program Files/Tesseract-OCR/tessdata',
  'C:/Program Files (x86)/Tesseract-OCR/tessdata',
  `${process.env.LOCALAPPDATA ?? ''}/Programs/Tesseract-OCR/tessdata`,
  '//wsl.localhost/Ubuntu/usr/share/tesseract-ocr/5/tessdata',
  '//wsl.localhost/Ubuntu-22.04/usr/share/tesseract-ocr/5/tessdata',
  '//wsl.localhost/Ubuntu-24.04/usr/share/tesseract-ocr/5/tessdata',
  '//wsl$/Ubuntu/usr/share/tesseract-ocr/5/tessdata',
  '//wsl$/Ubuntu-22.04/usr/share/tesseract-ocr/5/tessdata',
  '//wsl$/Ubuntu-24.04/usr/share/tesseract-ocr/5/tessdata',
].map(normalizeMaybeDir).filter(Boolean);

const listTesseractLanguages = (tesseractPath, tessdataDir) => {
  if (!tesseractPath) return { languages: [], probeStatus: undefined, stderr: undefined };
  const args = tessdataDir ? ['--tessdata-dir', tessdataDir, '--list-langs'] : ['--list-langs'];
  const probe = run(tesseractPath, args);
  const languages = probe.status === 0
    ? probe.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.toLowerCase().includes('list of'))
    : [];
  return { languages, probeStatus: probe.status, stderr: probe.stderr };
};

const resolveTessdataDir = (tesseractPath) => {
  const defaultProbe = listTesseractLanguages(tesseractPath);
  if (defaultProbe.languages.includes('spa')) {
    return { tessdataDir: undefined, languages: defaultProbe.languages, source: 'default-tesseract' };
  }

  for (const candidate of tessdataCandidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    const probe = listTesseractLanguages(tesseractPath, candidate);
    if (probe.languages.includes('spa')) {
      return { tessdataDir: candidate, languages: probe.languages, source: candidate };
    }
  }

  for (const candidate of tessdataCandidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    const probe = listTesseractLanguages(tesseractPath, candidate);
    if (probe.languages.length > 0) {
      return { tessdataDir: candidate, languages: probe.languages, source: candidate };
    }
  }

  return { tessdataDir: undefined, languages: defaultProbe.languages, source: 'default-tesseract' };
};

const sha256 = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const stableId = (filePath, hash) => {
  const slug = path.basename(filePath, path.extname(filePath))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 58);
  return `${slug}-${hash.slice(0, 8)}`;
};

const repairMojibake = (text) => {
  if (!/[ÃƒÃ‚Ã¢]/.test(text)) return { text, repaired: false };
  const repaired = Buffer.from(text, 'latin1').toString('utf8');
  const originalBadness = (text.match(/[ÃƒÃ‚Ã¢]/g) ?? []).length;
  const repairedBadness = (repaired.match(/[ÃƒÃ‚Ã¢]/g) ?? []).length;
  return repairedBadness < originalBadness ? { text: repaired, repaired: true } : { text, repaired: false };
};

const pdfinfo = which('pdfinfo');
const pdftotext = which('pdftotext');
const pdftoppm = which('pdftoppm');
const tesseract = which('tesseract');
const tesseractVersion = tesseract ? (run(tesseract, ['--version']).stdout || '').split(/\r?\n/)[0]?.trim() : undefined;
const tessdataResolution = resolveTessdataDir(tesseract);
const languages = tessdataResolution.languages;
const language = languages.includes('spa') && languages.includes('eng') ? 'spa+eng'
  : languages.includes('spa') ? 'spa'
  : languages.includes('eng') ? 'eng'
  : undefined;

const pageCountFor = (sourcePath) => {
  if (!pdfinfo) return undefined;
  const info = run(pdfinfo, [sourcePath]);
  if (info.status !== 0) return undefined;
  const match = info.stdout.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : undefined;
};

const extractNativePageText = (sourcePath, page) => {
  if (!pdftotext) return { text: '', warning: 'pdftotext-missing' };
  const extracted = run(pdftotext, ['-f', String(page), '-l', String(page), '-layout', '-enc', 'UTF-8', sourcePath, '-']);
  if (extracted.status !== 0) return { text: '', warning: `pdftotext-page-${page}-failed:${extracted.stderr || extracted.stdout}`.slice(0, 220) };
  return repairMojibake(extracted.stdout);
};

const renderPage = (sourcePath, documentId, page) => {
  if (!pdftoppm) return { imagePath: undefined, warning: 'pdftoppm-missing' };
  const docOutDir = path.join(pageDir, documentId);
  fs.mkdirSync(docOutDir, { recursive: true });
  const prefix = path.join(docOutDir, `page-${String(page).padStart(4, '0')}`);
  const render = run(pdftoppm, ['-f', String(page), '-l', String(page), '-png', '-r', '180', sourcePath, prefix]);
  if (render.status !== 0) return { imagePath: undefined, warning: `pdftoppm-page-${page}-failed:${render.stderr || render.stdout}`.slice(0, 220) };
  const images = fs.readdirSync(docOutDir)
    .filter((name) => name.startsWith(`page-${String(page).padStart(4, '0')}`) && name.toLowerCase().endsWith('.png'))
    .sort()
    .map((name) => path.join(docOutDir, name));
  return { imagePath: images.at(-1), warning: images.length ? undefined : `pdftoppm-page-${page}-no-image` };
};

const ocrImage = (imagePath, page) => {
  if (!tesseract) return { text: '', warning: 'tesseract-missing' };
  if (!language) return { text: '', warning: 'tesseract-language-missing' };
  const tessdataArgs = tessdataResolution.tessdataDir ? ['--tessdata-dir', tessdataResolution.tessdataDir] : [];
  const ocr = run(tesseract, [imagePath, 'stdout', ...tessdataArgs, '-l', language, '--psm', '6']);
  if (ocr.status !== 0) return { text: '', warning: `tesseract-page-${page}-failed:${ocr.stderr || ocr.stdout}`.slice(0, 220) };
  return repairMojibake(ocr.stdout);
};

const uniqueDocuments = [];
const seenHashes = new Map();
for (const sourcePath of explicitDocuments) {
  if (!fs.existsSync(sourcePath)) {
    uniqueDocuments.push({ sourcePath, exists: false, duplicateOf: undefined });
    continue;
  }
  const sourceHash = sha256(sourcePath);
  const duplicateOf = seenHashes.get(sourceHash);
  if (duplicateOf) {
    uniqueDocuments.push({ sourcePath, exists: true, sourceHash, duplicateOf });
    continue;
  }
  seenHashes.set(sourceHash, sourcePath);
  uniqueDocuments.push({ sourcePath, exists: true, sourceHash, duplicateOf: undefined });
}

const pageRecords = [];
const documentResults = [];
const minNativeChars = Number(process.env.F281_NATIVE_TEXT_MIN_CHARS ?? 80);
const maxPages = process.env.F281_MAX_PAGES ? Number(process.env.F281_MAX_PAGES) : undefined;

for (const doc of uniqueDocuments) {
  const warnings = [];
  if (!doc.exists) {
    documentResults.push({
      documentId: stableId(doc.sourcePath, 'missing000000000000000000000000000000000000000000000000000000000000'),
      sourcePath: doc.sourcePath,
      exists: false,
      status: 'missing-source',
      pagesTotal: 0,
      pagesProcessed: 0,
      nativePages: 0,
      ocrPages: 0,
      textChars: 0,
      warnings: ['source-missing'],
    });
    continue;
  }
  if (doc.duplicateOf) {
    documentResults.push({
      documentId: stableId(doc.sourcePath, doc.sourceHash),
      sourcePath: doc.sourcePath,
      exists: true,
      sourceHash: doc.sourceHash,
      status: 'duplicate-suppressed',
      duplicateOf: doc.duplicateOf,
      pagesTotal: 0,
      pagesProcessed: 0,
      nativePages: 0,
      ocrPages: 0,
      textChars: 0,
      warnings: ['duplicate-hash-suppressed'],
    });
    continue;
  }

  const documentId = stableId(doc.sourcePath, doc.sourceHash);
  const pagesTotal = pageCountFor(doc.sourcePath);
  const pagesToProcess = Math.max(0, Math.min(pagesTotal ?? 0, maxPages ?? pagesTotal ?? 0));
  if (!pagesTotal) warnings.push('page-count-unavailable');
  if (!pdftotext) warnings.push('pdftotext-missing');
  if (!pdftoppm) warnings.push('pdftoppm-missing');
  if (!tesseract) warnings.push('tesseract-missing');
  if (!language) warnings.push('tesseract-language-missing');
  if (!languages.includes('spa')) warnings.push('spanish-traineddata-not-visible');

  let textChars = 0;
  let nativePages = 0;
  let ocrPages = 0;
  const pageTexts = [];

  for (let page = 1; page <= pagesToProcess; page += 1) {
    const native = extractNativePageText(doc.sourcePath, page);
    if (native.warning) warnings.push(native.warning);
    let text = native.text ?? '';
    let extractionMode = 'native-text';
    let imagePath;
    let imageHash;
    let encodingRepair = native.repaired ? 'latin1-to-utf8-mojibake-repair' : 'none';

    if (text.trim().length < minNativeChars) {
      const rendered = renderPage(doc.sourcePath, documentId, page);
      if (rendered.warning) warnings.push(rendered.warning);
      imagePath = rendered.imagePath;
      if (imagePath) {
        imageHash = sha256(imagePath);
        const ocr = ocrImage(imagePath, page);
        if (ocr.warning) warnings.push(ocr.warning);
        text = ocr.text ?? '';
        extractionMode = 'tesseract-ocr';
        encodingRepair = ocr.repaired ? 'latin1-to-utf8-mojibake-repair' : 'none';
      } else {
        extractionMode = 'ocr-render-failed';
      }
    }

    if (extractionMode === 'native-text') nativePages += 1;
    if (extractionMode === 'tesseract-ocr') ocrPages += 1;
    const trimmed = text.trim();
    textChars += trimmed.length;
    pageTexts.push(`\n\n--- PAGE ${page} [${extractionMode}] ---\n${trimmed}`);
    pageRecords.push({
      documentId,
      sourcePath: doc.sourcePath,
      sourceHash: doc.sourceHash,
      page,
      imagePath,
      imageHash,
      extractionMode,
      ocrEngine: extractionMode === 'tesseract-ocr' ? 'tesseract' : 'poppler-pdftotext',
      ocrEngineVersion: extractionMode === 'tesseract-ocr' ? tesseractVersion : 'poppler-pdftotext',
      language: extractionMode === 'tesseract-ocr' ? language : 'document-native',
      textChars: trimmed.length,
      text: trimmed,
      textEncodingRepair: encodingRepair,
      reviewStatus: extractionMode === 'tesseract-ocr' || !languages.includes('spa') ? 'draft-needs-review' : 'native-text-review',
    });
  }

  fs.writeFileSync(path.join(textDir, `${documentId}.txt`), pageTexts.join('\n'), 'utf8');
  const status = textChars > 500 && ocrPages > 0 ? 'full-local-ocr-draft-ready'
    : textChars > 500 ? 'native-text-ready'
    : warnings.length ? 'full-local-ocr-warning'
    : 'full-local-ocr-warning';
  documentResults.push({
    documentId,
    sourcePath: doc.sourcePath,
    exists: true,
    sourceHash: doc.sourceHash,
    status,
    pagesTotal: pagesTotal ?? 0,
    pagesProcessed: pagesToProcess,
    nativePages,
    ocrPages,
    textChars,
    textPath: `outputs/f281_full_local_ocr/text/${documentId}.txt`,
    warnings: Array.from(new Set(warnings)).slice(0, 20),
  });
}

const manifest = {
  phase: 'F281',
  schema: 'radshield-mx.full-local-ocr.f281.v1',
  generatedAt: new Date().toISOString(),
  status: 'full-local-ocr-draft',
  paidCloudOcrUsed: false,
  seedDbAutomatically: false,
  textQualityPolicy: [
    'Use native PDF text when page text is searchable and sufficient.',
    'Use Tesseract only for scanned/low-text pages.',
    'Keep OCR pages as draft-needs-review before RAG/DB seed.',
    'Do not claim Spanish OCR is active unless spa.traineddata is visible in --list-langs.',
  ],
  tools: {
    pdfinfo: { available: Boolean(pdfinfo), path: pdfinfo },
    pdftotext: { available: Boolean(pdftotext), path: pdftotext },
    pdftoppm: { available: Boolean(pdftoppm), path: pdftoppm },
    tesseract: {
      available: Boolean(tesseract),
      path: tesseract,
      version: tesseractVersion,
      languages,
      tessdataDir: tessdataResolution.tessdataDir,
      tessdataSource: tessdataResolution.source,
      tessdataCandidates,
    },
    spanishOcrOperational: languages.includes('spa'),
  },
  documents: documentResults,
  outputArtifacts: [
    'outputs/f281_full_local_ocr/f281_full_local_ocr.json',
    'outputs/f281_full_local_ocr/f281_full_local_ocr_pages.jsonl',
    'outputs/f281_full_local_ocr/text/*.txt',
    'outputs/fase_281_full_local_ocr.md',
  ],
  releaseDecision:
    'F281 completes local hybrid OCR/text extraction for real analytic memories. Results are draft evidence until Spanish traineddata is visible and page-level QA/dedup approves DB/RAG seed.',
};

fs.writeFileSync(path.join(outputDir, 'f281_full_local_ocr.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f281_full_local_ocr_pages.jsonl'), `${pageRecords.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_281_full_local_ocr.md'),
  [
    '# F281 Full Local OCR',
    '',
    `Status: ${manifest.status}`,
    `Paid cloud OCR used: ${manifest.paidCloudOcrUsed ? 'yes' : 'no'}`,
    `Seed DB automatically: ${manifest.seedDbAutomatically ? 'yes' : 'no'}`,
    `Tesseract: ${manifest.tools.tesseract.available ? manifest.tools.tesseract.version : 'missing'}`,
    `Languages: ${manifest.tools.tesseract.languages.join(', ') || 'none'}`,
    `Spanish OCR operational: ${manifest.tools.spanishOcrOperational ? 'yes' : 'no'}`,
    '',
    '## Documents',
    ...documentResults.map((doc) => `- ${doc.documentId}: ${doc.status}; pages=${doc.pagesProcessed}/${doc.pagesTotal}; native=${doc.nativePages}; ocr=${doc.ocrPages}; chars=${doc.textChars}; warnings=${doc.warnings.join(' | ') || 'none'}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  spanishOcrOperational: manifest.tools.spanishOcrOperational,
  languages,
  documents: documentResults.map((doc) => ({
    documentId: doc.documentId,
    status: doc.status,
    pages: `${doc.pagesProcessed}/${doc.pagesTotal}`,
    nativePages: doc.nativePages,
    ocrPages: doc.ocrPages,
    textChars: doc.textChars,
    warnings: doc.warnings.slice(0, 3),
  })),
}, null, 2));
