import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const cache = read('src/lib/calculationCacheKey.ts');
const hook = read('src/hooks/useCalculationCache.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('cache version is F196', cache.includes("CALCULATION_CACHE_VERSION = 'f196-cache-v1'"));
expect('legacy F193 contract marker retained', cache.includes("version: 'f193-cache-v1'"));
expect('cache key prefix is F196', cache.includes('calc:f196:'));
expect('cache payload includes scale', cache.includes('scale_m_per_pixel'));
expect('cache payload includes geometry/material', cache.includes('geometry:') && cache.includes('materialCode'));
expect('cache payload includes source and norms', cache.includes('modalityId') && cache.includes('standard') && cache.includes('category'));
expect('cache payload includes P/T/U/W', cache.includes('P:') && cache.includes('T:') && cache.includes('U:') && cache.includes('workloadValue'));
expect('cache payload includes regions and critical points', cache.includes('regions:') && cache.includes('criticalPoints:'));
expect('cache exposes invalidation explainer', cache.includes('explainCalculationCacheInvalidation'));
expect('cache classifies invalidation categories', cache.includes('classifyCalculationCacheDiff') && cache.includes('criticalPoints') && cache.includes('P/T/U/W'));
expect('hook imports cache payload and explainer', hook.includes('buildCalculationCachePayload') && hook.includes('explainCalculationCacheInvalidation'));
expect('hook stores payload and version', hook.includes('cacheVersion: CALCULATION_CACHE_VERSION') && hook.includes('payload,'));
expect('hook rejects missing/invalid payload', hook.includes('if (!audit.valid') && hook.includes('entry.cacheVersion !== CALCULATION_CACHE_VERSION'));
expect('hook exposes last audit', hook.includes('lastAuditRef') && hook.includes('lastAudit: () => lastAuditRef.current'));
expect('package exposes F196 contract', pkg.scripts?.['test:f196:cache'] === 'node scripts/check-f196-calculation-cache-contracts.mjs');
expect('changelog documents F196', changelog.includes('F196'));
expect('manual documents F196', manual.includes('F196'));
expect('Update Center documents F196', update.includes('F196 Safe calculation cache'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F196 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F196 calculation cache contracts passed.');
