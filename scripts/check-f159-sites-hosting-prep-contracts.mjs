import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  '.openai/hosting.json',
  'src/lib/f159SitesHostingPrep.ts',
  'scripts/f159-sites-hosting-prep.mjs',
  'scripts/check-f159-sites-hosting-prep-contracts.mjs',
  'outputs/f159_sites_hosting_prep/f159_sites_hosting_prep.json',
  'outputs/f159_sites_hosting_prep/radshield-mx-sites-package.tar.gz',
  'outputs/fase_159_sites_hosting_prep.md',
  'dist/server/index.js',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f159SitesHostingPrep.ts', 'buildF159SitesHostingPrep'],
  ['src/lib/f159SitesHostingPrep.ts', 'sites-local-package-ready'],
  ['scripts/f159-sites-hosting-prep.mjs', 'dist/server/index.js'],
  ['scripts/f159-sites-hosting-prep.mjs', 'dist/.openai/hosting.json'],
  ['scripts/f159-sites-hosting-prep.mjs', 'Git executable unavailable'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f159-sites-hosting-prep'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF159SitesHostingPrep'],
  ['package.json', 'prepare:f159:sites-hosting'],
  ['package.json', 'test:f159:sites-hosting'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f159_sites_hosting_prep', 'f159_sites_hosting_prep.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F159') failures.push('F159 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.sites-hosting-prep.f159.v1') failures.push('F159 schema mismatch');
  if (!['sites-local-package-ready', 'sites-deploy-ready', 'sites-deploy-gated'].includes(manifest.status)) {
    failures.push(`F159 invalid status: ${manifest.status}`);
  }
  if (!manifest.projectIdPresent) failures.push('F159 missing project_id metadata');
  if (!manifest.artifacts?.hosting?.present) failures.push('F159 missing hosting artifact');
  if (!manifest.artifacts?.worker?.present) failures.push('F159 missing worker adapter artifact');
  if (!manifest.artifacts?.archive?.present) failures.push('F159 missing Sites archive artifact');
  if (manifest.status === 'sites-local-package-ready') {
    if (!manifest.blockers?.some((item) => item.includes('Git executable'))) failures.push('F159 local package must retain Git executable blocker');
    if (!manifest.blockers?.some((item) => item.includes('Local .git'))) failures.push('F159 local package must retain .git source blocker');
  }
}

if (failures.length) {
  console.error('F159 Sites hosting prep contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F159 Sites hosting prep contracts OK.');
