import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const srcRoot = join(root, 'src');
const registerPath = join(root, 'TECH_DEBT_QUARANTINE.md');
const register = readFileSync(registerPath, 'utf8');

const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    const text = readFileSync(path, 'utf8');
    if (text.includes('@ts-nocheck')) {
      files.push(relative(root, path).split(sep).join('/'));
    }
  }
}

walk(srcRoot);

const missing = files.filter((file) => !register.includes(file));
if (missing.length > 0) {
  console.error('Unregistered ts-nocheck files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`Quarantine register OK (${files.length} files).`);
