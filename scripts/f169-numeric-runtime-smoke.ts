import {
  archerTransmission,
  exponentialThickness,
  inverseArcher,
  tvlThickness,
  tvlTransmission,
} from '../src/lib/shieldingMath';
import { buildF149NormativeNumericQa } from '../src/lib/f149NormativeNumericQa';
import type { ShieldingMaterial } from '../src/types/radshield';

const concrete235: ShieldingMaterial = {
  name: 'Concreto normal (2.35 g/cm3)',
  code: 'CONCRETE235',
  density: 2.35,
  archerAlpha: 0.0383,
  archerBeta: 0.0141,
  archerGamma: 1.099,
  TVL_mm: { '6MV': 370, '10MV': 370, '15MV': 410, '18MV': 450, Co60: 218, '511keV': 170 },
  cost_per_m3: 180,
  cost_per_kg: 0.08,
  color: '#9CA3AF',
  category: 'Convencional',
};

const lead: ShieldingMaterial = {
  name: 'Plomo laminado (Pb)',
  code: 'PB',
  density: 11.34,
  archerAlpha: 2.246,
  archerBeta: 6.31,
  archerGamma: 0.629,
  TVL_mm: { '6MV': 55, '10MV': 60, '15MV': 70, '18MV': 80, Co60: 11.3, '511keV': 11.8, '140keV': 0.3 },
  cost_per_m3: 8500,
  cost_per_kg: 0.75,
  color: '#374151',
  category: 'Convencional',
};

type RuntimeCheck = {
  id: string;
  ok: boolean;
  expected: string;
  actual: string;
};

const checks: RuntimeCheck[] = [];

function addCheck(id: string, ok: boolean, expected: string, actual: string) {
  checks.push({ id, ok, expected, actual });
}

function closeTo(actual: number, expected: number, tolerance: number) {
  return Math.abs(actual - expected) <= tolerance;
}

const f149 = buildF149NormativeNumericQa();
addCheck('F149-release-ready', f149.releaseReady, 'releaseReady=true', String(f149.releaseReady));
addCheck('F149-case-count', f149.totals.total >= 8, '>=8 cases', String(f149.totals.total));
addCheck('F149-no-release-blockers', f149.totals.releaseBlocking === 0, '0 blockers', String(f149.totals.releaseBlocking));

const oneTvlTransmission = tvlTransmission(370, concrete235, '6MV');
addCheck('NCRP151-one-TVL-6MV-concrete', closeTo(oneTvlTransmission, 0.1, 1e-6), '0.1', String(oneTvlTransmission));

const twoTvlTransmission = tvlTransmission(740, concrete235, '6MV');
addCheck('NCRP151-two-TVL-6MV-concrete', closeTo(twoTvlTransmission, 0.01, 1e-6), '0.01', String(twoTvlTransmission));

const tvlRequired = tvlThickness(1000, 0.02, concrete235, '6MV');
const expectedTvls = Math.log10(1000 / 0.02);
addCheck(
  'NCRP151-tvlThickness-log-ratio',
  closeTo(tvlRequired / 370, expectedTvls, 0.02),
  `${expectedTvls} TVLs`,
  `${tvlRequired / 370} TVLs`,
);

const inverse = inverseArcher(0.001, concrete235);
const inverseTransmission = archerTransmission(inverse, concrete235);
addCheck('NCRP147-inverseArcher-roundtrip', closeTo(inverseTransmission, 0.001, 0.0005), '0.001', String(inverseTransmission));

const concretePet = exponentialThickness(100, 0.02, concrete235, '511keV');
const leadPet = exponentialThickness(100, 0.02, lead, '511keV');
addCheck('PET511-lead-less-than-concrete', leadPet < concretePet / 5, `lead < ${concretePet / 5}`, String(leadPet));

const passed = checks.filter((check) => check.ok).length;
const failed = checks.filter((check) => !check.ok);
const result = {
  ok: failed.length === 0,
  checkCount: checks.length,
  passed,
  failed: failed.map((check) => check.id),
  checks,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
