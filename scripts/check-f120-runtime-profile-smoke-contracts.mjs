import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f120RuntimeProfileSmoke.ts',
    tokens: [
      'buildF120RuntimeProfileSmokeSummary',
      'implemented-runtime-smoke',
      'scripts/check-f120-runtime-profile-smoke.mjs',
      'F121 should use the runtime smoke evidence',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF120RuntimeProfileSmokeSummary',
      'f120-runtime-profile-smoke-summary',
      'F120 Runtime profile smoke',
      'F120 Smoke runtime perfiles',
    ],
  },
  {
    file: 'scripts/check-f120-runtime-profile-smoke.mjs',
    tokens: [
      'f113-profile-${profile.id}',
      'radshield-e2e-controls',
      'e2e-open-memoria-ai',
      'e2e-open-pdf-report',
      'e2e-open-evidence-pack',
      'f117-modality-handoff-memoria',
      'f118-apply-suggested-equipment',
      'f117-modality-handoff-report',
      'f118-report-template-preselection',
      'f117-modality-handoff-evidence',
      'f118-apply-evidence-objective',
      'f120_runtime_profile_smoke_result.json',
      'fase_120_runtime_profile_smoke_result.md',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'test:f120:runtime-profile-smoke',
      'test:f120:runtime-profile-contracts',
    ],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const text = fs.readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      failures.push(`${check.file}: missing token "${token}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('F120 runtime profile smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F120 runtime profile smoke contracts OK.');
