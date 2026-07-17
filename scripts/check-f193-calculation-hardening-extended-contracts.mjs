import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const unit = read('src/lib/unitNormalization.ts');
const cache = read('src/lib/calculationCacheKey.ts');
const cases = read('src/lib/numericValidationCases.ts');
const math = read('src/lib/shieldingMath.ts');
const hook = read('src/hooks/useShieldingEngine.ts');
const legacyEngine = read('src/lib/shieldingEngine.ts');
const worker = read('src/workers/shieldingWorker.ts');
const cacheHook = read('src/hooks/useCalculationCache.ts');
const types = read('src/types/radshield.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('unit module converts mm/cm', unit.includes('mmToCm') && unit.includes('cmToMm'));
expect('unit module converts dose rate', unit.includes('mSvWeekToUSvHour'));
expect('unit module computes mass and structural load', unit.includes('kgM2FromDensityThickness') && unit.includes('structuralLoadKPaFromKgM2'));
expect('unit module computes material cost', unit.includes('costPerM2FromMaterial'));
expect('cache key includes version and P/T/U/W', cache.includes("version: 'f193-cache-v1'") && cache.includes('P:') && cache.includes('T:') && cache.includes('U:') && cache.includes('workloadValue'));
expect('cache key includes geometry/material/source/norms', cache.includes('geometry:') && cache.includes('materialCode') && cache.includes('modalityId') && cache.includes('standard'));
expect('cache hook uses secure cache key', cacheHook.includes("import { buildCalculationCacheKey }") && cacheHook.includes('buildCalculationCacheKey(floorPlan)'));
expect('known cases include LINAC 6 MV', cases.includes('linac-6mv-primary-tvl'));
expect('known cases include LINAC 18 MV', cases.includes('linac-18mv-neutron-warning'));
expect('known cases include CT/RX', cases.includes('ct-rx-ncrp147-archer'));
expect('known cases include Gamma Knife', cases.includes('gamma-knife-co60-energy-key'));
expect('known cases include PET/NM', cases.includes('pet-nm-point-kernel'));
expect('math warns distance below 0.3m', math.includes('Distance less than') && math.includes('SAMPLING_DISTANCE_M'));
expect('math warns TVL not versioned', math.includes('TVL not versioned'));
expect('math warns material density', math.includes('has no validated positive density'));
expect('math warns clinical review', math.includes('RSO/qualified medical physicist review'));
expect('math exposes conservative comparator', math.includes('buildConservativeCalculationComparison'));
expect('hook attaches unit snapshot', hook.includes('calculationUnitSnapshot'));
expect('hook attaches comparison', hook.includes('calculationComparison'));
expect('hook attaches cache key', hook.includes('calculationCacheKey'));
expect('legacy engine uses audit warnings', legacyEngine.includes('getCalculationAuditWarnings') && legacyEngine.includes('calculationWarnings'));
expect('legacy engine uses unit snapshot and comparison', legacyEngine.includes('buildCalculationUnitSnapshot') && legacyEngine.includes('buildConservativeCalculationComparison'));
expect('worker validates inputs', worker.includes('validateWorkerCalculationInput') && worker.includes('clinicalReview'));
expect('types expose comparison and unit snapshot', types.includes('export interface CalculationComparison') && types.includes('export interface CalculationUnitSnapshot'));
expect('package exposes F193 contract', pkg.scripts?.['test:f193:calculation-hardening-extended'] === 'node scripts/check-f193-calculation-hardening-extended-contracts.mjs');
expect('changelog documents F193', changelog.includes('F193'));
expect('manual documents F193', manual.includes('F193'));
expect('Update Center documents F193', update.includes('F193 Calculation hardening extended'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F193 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F193 extended calculation hardening contracts passed.');
