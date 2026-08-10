import fs from 'node:fs';

const source = fs.readFileSync('src/lib/f581F585ExpandedNormativeNumericQa.ts', 'utf8');
const caseBlocks = [...source.matchAll(/id: '([^']+)'[\s\S]*?inputs: \{ transmission: ([^,}]+)(?:, penalty_mm: ([^,}]+))?[\s\S]*?expected: \{ thickness_mm: ([^ }]+) \}[\s\S]*?tolerancePct: ([^,]+),/g)];

if (caseBlocks.length < 9) {
  console.error(`Expected at least 9 F581-F585 QA cases, found ${caseBlocks.length}.`);
  process.exit(1);
}

const failures = [];

for (const match of caseBlocks) {
  const [, id, transmissionText, penaltyText, expectedText, toleranceText] = match;
  const blockStart = source.indexOf(`id: '${id}'`);
  const blockEnd = source.indexOf('\n  },', blockStart);
  const block = source.slice(blockStart, blockEnd);
  const tvlMatch = block.match(/tvl_mm: ([0-9.]+)/);
  if (!tvlMatch) {
    failures.push(`${id}: missing tvl_mm`);
    continue;
  }

  const transmission = Number(transmissionText);
  const tvl = Number(tvlMatch[1]);
  const penalty = penaltyText ? Number(penaltyText) : 0;
  const expected = Number(expectedText);
  const tolerancePct = Number(toleranceText);
  const calculated = -Math.log10(transmission) * tvl + penalty;
  const deltaPct = Math.abs(calculated - expected) / expected * 100;

  if (!Number.isFinite(calculated) || deltaPct > tolerancePct) {
    failures.push(`${id}: expected ${expected} mm, got ${calculated.toFixed(3)} mm (${deltaPct.toFixed(3)}%)`);
  }
}

if (failures.length) {
  console.error(`F581-F585 numeric values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F581-F585] Numeric QA values OK (${caseBlocks.length} cases).`);
