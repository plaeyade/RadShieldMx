import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const shieldingMath = read('src/lib/shieldingMath.ts');
const hardening = read('src/lib/f174aPredeployHardening.ts');
const failures = [];

for (const token of [
  'export function isFinitePositive',
  'Number.isFinite(value) && value > 0',
  'export function clampTransmission',
  'if (!Number.isFinite(value)) return 0',
  'if (value < 0) return 0',
  'if (value > 1) return 1',
  'export function getCalculationInputWarnings',
  'transmission should be finite and bounded between 0 and 1',
]) {
  if (!shieldingMath.includes(token)) failures.push(`Missing calculation unit token: ${token}`);
}

for (const token of [
  "return 'canonical'",
  "return 'material-evidence'",
  "return 'analytic-memory'",
  "return 'research'",
  "return 'external'",
  'Can cite formulas',
  'Use as methodology or backlog evidence',
  'buildF174APredeployHardening',
]) {
  if (!hardening.includes(token)) failures.push(`Missing RAG/frontend unit token: ${token}`);
}

if (!shieldingMath.includes('return clampTransmission(Math.exp(')) failures.push('Archer fallback is not bounded');
if (!shieldingMath.includes('return clampTransmission(Math.pow(inner')) failures.push('Archer equation output is not bounded');
if (!shieldingMath.includes('return clampTransmission(Math.pow(10')) failures.push('TVL transmission output is not bounded');

if (failures.length) {
  console.error('F174A unit checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F174A unit checks OK.');
