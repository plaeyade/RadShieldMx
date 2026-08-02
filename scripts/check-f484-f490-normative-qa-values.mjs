const cases = [
  ['F484 LINAC 6MV primary', 1e-5, 370, 0, 1850],
  ['F485 LINAC 15MV neutron', 1e-4, 330, 120, 1440],
  ['F486 CT NCRP147', 1e-2, 0.35, 0, 0.7],
  ['F487 Gamma Knife Co60', 1e-4, 206, 0, 824],
  ['F488 PET/NM TG108', 1e-3, 16, 0, 48],
  ['F489 Cyclotron 18MeV', 1e-6, 320, 250, 2170],
];

const tolerancePct = 0.5;
const failures = [];

for (const [label, transmission, tvlMm, extraMm, expectedMm] of cases) {
  const tvls = -Math.log10(transmission);
  const calculatedMm = tvls * tvlMm + extraMm;
  const deltaPct = Math.abs(calculatedMm - expectedMm) / expectedMm * 100;
  if (!Number.isFinite(calculatedMm) || deltaPct > tolerancePct) {
    failures.push(`${label}: expected ${expectedMm} mm, got ${calculatedMm.toFixed(3)} mm (${deltaPct.toFixed(3)}%)`);
  }
}

if (failures.length) {
  console.error(`F484-F490 numeric values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`F484-F490 numeric values passed (${cases.length} cases).`);
