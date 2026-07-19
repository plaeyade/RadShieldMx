import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function includes(path, tokens) {
  const content = read(path);
  for (const token of tokens) {
    expect(content.includes(token), `${path} missing token: ${token}`);
  }
}

const smokeScript = 'scripts/check-f202-public-vercel-smoke.mjs';
expect(existsSync(join(root, smokeScript)), 'F202 smoke script missing');

includes('package.json', [
  'test:f202:public-vercel-contracts',
  'test:f202:public-vercel-smoke',
]);

includes(smokeScript, [
  'https://radshield-mx-static-dist.vercel.app/',
  'f186-sidebar-stable-width',
  'f100-main-floorplan-canvas',
  'f191-pyrate-inspired-toolbar',
  'f188-workflow-dock-button',
  'f201-workflow-compact-button',
  'f96-migrated-design-dropdown',
  'f109-migrated-reports-dropdown',
  'f110-migrated-evidence-dropdown',
  'e2e-open-memoria-ai',
  'e2e-open-pdf-report',
  'e2e-open-evidence-pack',
  'e2e-open-cnsns-report',
]);

includes('CHANGELOG.md', ['F202', 'public Vercel smoke']);
includes('MANUAL_VERSIONES_v50.md', ['F202', 'public Vercel smoke']);
includes('MANUAL_USUARIO_v99.md', ['F202', 'radshield-mx-static-dist.vercel.app']);
includes('src/sections/dialogs/UpdateAppDialog.tsx', ['F202 Public Vercel smoke', 'public-vercel-smoke-ready']);

const outputPath = join(root, 'outputs', 'f202_public_vercel_smoke_result.json');
if (existsSync(outputPath)) {
  const output = JSON.parse(readFileSync(outputPath, 'utf8'));
  expect(output.phase === 'F202', 'F202 output phase mismatch');
  expect(output.url?.startsWith('https://'), 'F202 output URL must be HTTPS');
  expect(['public-vercel-smoke-ready', 'public-vercel-smoke-network-gated'].includes(output.status), `F202 output has unsupported status: ${output.status}`);
  if (output.status === 'public-vercel-smoke-ready') {
    expect(output.ok === true, 'F202 ready output ok must be true');
    expect(Array.isArray(output.checks) && output.checks.length >= 20, 'F202 ready output has too few checks');
  } else {
    expect(output.ok === false, 'F202 network-gated output ok must be false');
    expect(output.checks?.some((check) => /runtime exception/i.test(check.name) && /ERR_NETWORK_ACCESS_DENIED|ERR_INTERNET_DISCONNECTED|ERR_TUNNEL_CONNECTION_FAILED|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(check.detail)), 'F202 network-gated output must include network failure detail');
  }
  const failed = output.checks.filter((check) => !check.ok);
  if (output.status === 'public-vercel-smoke-ready') {
    expect(failed.length === 0, `F202 output has failed checks: ${failed.map((check) => check.name).join(', ')}`);
  }
}

if (failures.length) {
  console.error('F202 public Vercel smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F202 public Vercel smoke contracts OK');
