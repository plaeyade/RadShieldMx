const eventCases = [
  ['disabled stable fallback', false, 'pointerdown', 'drag', 10, 10, undefined, undefined, 'route-to-stable-useCanvas'],
  ['non finite pointer', true, 'pointermove', 'drag', Number.NaN, 1, undefined, undefined, 'ignore'],
  ['wheel zoom', true, 'wheel', 'zoom', 1, 1, undefined, undefined, 'zoom-view'],
  ['context fit view', true, 'pointerdown', 'fit', 1, 1, undefined, undefined, 'fit-view'],
  ['context tool command', true, 'pointerdown', 'tool', 1, 1, undefined, undefined, 'activate-tool'],
  ['snap preview', true, 'pointermove', 'snap', 1, 1, undefined, undefined, 'snap-preview'],
  ['delete key', true, 'keydown', 'delete', 0, 0, 'Delete', undefined, 'delete-selection'],
  ['undo key', true, 'keydown', 'undo', 0, 0, 'z', true, 'undo-last'],
];

function routeHarness([, enabled, type, mode, x, y, key, ctrlKey]) {
  if (!enabled) return 'route-to-stable-useCanvas';
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'ignore';
  if (type === 'keydown' && key === 'Delete') return 'delete-selection';
  if (type === 'keydown' && ctrlKey && key?.toLowerCase() === 'z') return 'undo-last';
  if (type === 'wheel') return 'zoom-view';
  if (mode === 'fit' && type === 'pointerdown') return 'fit-view';
  if (mode === 'tool' && type === 'pointerdown') return 'activate-tool';
  if (mode === 'snap' && type === 'pointermove') return 'snap-preview';
  return 'route-to-stable-useCanvas';
}

const qaCases = [
  ['f519-linac-primary-public-controlled', 1e-5, 370, 1, 1, 1, 0, 1, 1, 1.2, 0, 1879.291],
  ['f519-linac-secondary-penetration', 1e-4, 330, 1, 0.25, 1, 80, 1, 1, 1, 120, 1718.68],
  ['f519-ct-door-diagnostic', 1e-2, 0.35, 1, 1, 1, 0, 1, 1, 1, 0.15, 0.85],
  ['f519-gammaknife-secondary-public', 1e-4, 206, 1, 1, 1, 0, 1, 1, 1.1, 25, 857.525],
  ['f519-pet-controlled-zone', 1e-3, 16, 1, 1, 1, 0, 1, 1, 1.5, 4, 54.817],
  ['f519-cyclotron-maze-neutron', 1e-6, 320, 1, 1, 1, 250, 1, 1, 1, 180, 2350],
];

const failures = [];

for (const eventCase of eventCases) {
  const label = eventCase[0];
  const expected = eventCase[8];
  const actual = routeHarness(eventCase);
  if (actual !== expected) failures.push(`${label}: expected ${expected}, got ${actual}`);
}

for (const [id, transmission, tvlMm, baseOccupancy, baseUse, baseWorkload, extraMm, consOccupancy, consUse, consWorkload, penaltyMm, expectedMm] of qaCases) {
  const base = -Math.log10(transmission) * tvlMm + extraMm;
  const multiplier = Math.max(consOccupancy / baseOccupancy, consUse / baseUse, consWorkload / baseWorkload, 1);
  const conservative = base + Math.log10(multiplier) * tvlMm + penaltyMm;
  const deltaPct = Math.abs(conservative - expectedMm) / expectedMm * 100;
  if (!Number.isFinite(conservative) || deltaPct > 0.001) {
    failures.push(`${id}: expected ${expectedMm} mm, got ${conservative.toFixed(3)} mm (${deltaPct.toFixed(4)}%)`);
  }
}

if (failures.length) {
  console.error(`F515/F519 values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`F515/F519 values passed (${eventCases.length} event routes, ${qaCases.length} numeric cases).`);
