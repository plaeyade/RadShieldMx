import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/lib/f149bFastradClinicalUtility.ts',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/PdfReportDialog.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'scripts/f149b-fastrad-export-smoke.mjs',
  'outputs/f149b_fastrad_export_smoke/f149b_fastrad_export_smoke.json',
  'outputs/fase_149b_fastrad_export_smoke.md',
];

const requiredTokens = [
  ['src/lib/f149bFastradClinicalUtility.ts', 'buildF149bFastradClinicalUtility'],
  ['src/lib/f149bFastradClinicalUtility.ts', 'sector-ray-tracing-critical-paths'],
  ['src/lib/f149bFastradClinicalUtility.ts', 'six-face-equivalent-thickness'],
  ['src/lib/f149bFastradClinicalUtility.ts', 'forward-reverse-monte-carlo-engine'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', 'f149b-fastrad-export-smoke-memoria'],
  ['src/sections/dialogs/PdfReportDialog.tsx', 'f149-f149b-pdf-export-smoke'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'f149b-fastrad-export-smoke-evidence'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f149b-fastrad-export-smoke-update'],
  ['package.json', 'prepare:f149b:fastrad-smoke'],
  ['package.json', 'test:f149b:fastrad-smoke'],
];

const missing = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) missing.push(`missing file: ${file}`);
}

for (const [file, token] of requiredTokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    missing.push(`missing token file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(token)) missing.push(`missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f149b_fastrad_export_smoke', 'f149b_fastrad_export_smoke.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F149b') missing.push('manifest phase is not F149b');
  if (!manifest.sourceUrl?.includes('fastrad.net/modules')) missing.push('manifest does not cite FASTRAD modules URL');
  if (!Array.isArray(manifest.requiredSurfaces) || manifest.requiredSurfaces.length < 4) missing.push('manifest missing export surfaces');
  if (!manifest.externalOnly?.some((item) => item.toLowerCase().includes('monte carlo'))) missing.push('manifest missing external Monte Carlo guardrail');
}

if (missing.length) {
  console.error('F149b FASTRAD export smoke contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F149b FASTRAD export smoke contract passed');
