import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function assertIncludes(file, content, tokens) {
  const missing = tokens.filter((token) => !content.includes(token));
  if (missing.length > 0) {
    throw new Error(`${file} is missing required F73 tokens: ${missing.join(', ')}`);
  }
  return { file, tokens, status: 'ok' };
}

const checks = [
  assertIncludes('README.md', read('README.md'), [
    'RadShield-MX',
    'db:validate:live',
    'F73',
    'Medical 3D',
  ]),
  assertIncludes('CHANGELOG.md', read('CHANGELOG.md'), [
    'F73',
    'F72',
    'F71',
    'Update App',
  ]),
  assertIncludes('MANUAL_USUARIO_v99.md', read('MANUAL_USUARIO_v99.md'), [
    'Addendum F73',
    'RAG',
    'DWG',
    'memorias analiticas',
  ]),
  assertIncludes('src/sections/dialogs/UpdateAppDialog.tsx', read('src/sections/dialogs/UpdateAppDialog.tsx'), [
    'PLATFORM_UPDATES',
    'DBAI_UPDATES',
    'MENU_UPDATES',
    'Citation ledger',
    '20-30 memories',
  ]),
  assertIncludes('package.json', read('package.json'), [
    'test:f73:docs-update-app',
  ]),
];

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(
  join(root, 'outputs', 'f73_docs_update_app_contracts.json'),
  JSON.stringify({ phase: 'F73', status: 'passed', checks, generatedAt: new Date().toISOString() }, null, 2),
);

console.log('F73 docs/update-app contracts passed');
