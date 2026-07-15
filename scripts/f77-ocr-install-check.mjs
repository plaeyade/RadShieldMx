import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = join(root, 'outputs', 'f77_ocr_db');
mkdirSync(outputDir, { recursive: true });

const zumayaDir = 'C:\\Users\\carlo\\Desktop\\ZUMAYA';
const requiredPdfs = [
  'Structural Shielding Design for - National Research Council.pdf',
  'Radiation Protection in the Des - International Atomic Energy Age.pdf',
  'NCRP 49_ Structural Shielding D - National Council On Radiation P.pdf',
  'Entregable Memoria AL Zumaya.pdf',
];

function commandPath(name) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-Command ${name} -ErrorAction SilentlyContinue).Source`,
  ], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

const tools = Object.fromEntries(
  ['tesseract', 'ocrmypdf', 'pdftoppm', 'pdfinfo', 'winget', 'choco', 'scoop']
    .map((name) => [name, commandPath(name) || null]),
);

const pdfs = requiredPdfs.map((name) => {
  const path = join(zumayaDir, name);
  return {
    name,
    path,
    exists: existsSync(path),
  };
});

const canRunAutomaticOcr = Boolean(tools.ocrmypdf && tools.tesseract);
const canInstallFromThisShell = Boolean(tools.winget || tools.choco || tools.scoop);
const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
const liveSeedArmed = process.env.F76_SEED_LIVE === '1';

const report = {
  phase: 'F77',
  generatedAt: new Date().toISOString(),
  ok: pdfs.every((pdf) => pdf.exists),
  pdfs,
  tools,
  canRunAutomaticOcr,
  canInstallFromThisShell,
  databaseUrlConfigured,
  liveSeedArmed,
  blockers: [
    ...(!canRunAutomaticOcr ? ['OCR engine missing: install OCRmyPDF + Tesseract + Poppler.'] : []),
    ...(!databaseUrlConfigured ? ['DATABASE_URL is not configured; live DB seed is disabled.'] : []),
    ...(!liveSeedArmed ? ['F76_SEED_LIVE=1 is not set; live DB seed is intentionally disarmed.'] : []),
  ],
  windowsInstallOptions: {
    winget: [
      'winget install UB-Mannheim.TesseractOCR',
      'winget install OSGeo.OSGeo4W',
      'py -m pip install ocrmypdf',
    ],
    chocolatey: [
      'choco install tesseract poppler -y',
      'py -m pip install ocrmypdf',
    ],
    manual: [
      'Install Tesseract OCR for Windows from UB Mannheim.',
      'Install Poppler for Windows and add its bin folder to PATH.',
      'Install OCRmyPDF in the Python environment used by RadShield.',
    ],
  },
  nextCommandsAfterInstall: [
    'node scripts/f76-ocr-pending-pdfs.mjs',
    'node scripts/f75-prepare-pdf-rag.mjs',
    'node scripts/f76-seed-document-chunks.mjs',
    'DATABASE_URL="mysql://..." F76_SEED_LIVE=1 node scripts/f76-seed-document-chunks.mjs',
  ],
};

writeFileSync(join(outputDir, 'f77_ocr_install_db_readiness.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const md = [
  '# F77 OCR/install/DB readiness',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## PDFs',
  '',
  ...pdfs.map((pdf) => `- ${pdf.exists ? 'OK' : 'MISSING'}: ${pdf.path}`),
  '',
  '## Tools',
  '',
  ...Object.entries(tools).map(([name, path]) => `- ${name}: ${path || 'NOT_FOUND'}`),
  '',
  '## Blockers',
  '',
  ...(report.blockers.length ? report.blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Install options',
  '',
  'PowerShell with winget:',
  '',
  '```powershell',
  ...report.windowsInstallOptions.winget,
  '```',
  '',
  'PowerShell with Chocolatey:',
  '',
  '```powershell',
  ...report.windowsInstallOptions.chocolatey,
  '```',
  '',
  'Manual:',
  '',
  ...report.windowsInstallOptions.manual.map((item) => `- ${item}`),
  '',
  '## Next commands',
  '',
  '```powershell',
  ...report.nextCommandsAfterInstall,
  '```',
  '',
];

writeFileSync(join(outputDir, 'f77_ocr_install_db_readiness.md'), `${md.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  ok: report.ok,
  canRunAutomaticOcr,
  canInstallFromThisShell,
  databaseUrlConfigured,
  liveSeedArmed,
  blockers: report.blockers,
}, null, 2));
