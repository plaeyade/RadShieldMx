import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f126ReleaseEvidenceHardening.ts',
    tokens: [
      'buildF126ReleaseEvidenceHardening',
      'buildF126ReleaseEvidenceSection',
      'implemented-release-evidence-hardening',
      'pageRef-or-sectionRef',
      'verificationStatus-reviewed-or-verified',
      'readyForReleaseCandidate',
    ],
  },
  {
    file: 'src/lib/analyticMemoryEvidence.ts',
    tokens: [
      'buildF126ReleaseEvidenceSection',
      'documentId',
      'sectionRef',
      'verificationStatus',
      'buildF126ReleaseEvidenceSection(sources)',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: ['buildF126ReleaseEvidenceHardening', 'f126-release-evidence-hardening', 'F126 evidencia release'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['buildF126ReleaseEvidenceHardening', 'f126-release-evidence-summary', 'F126 Release evidence hardening'],
  },
  {
    file: 'scripts/f126-release-evidence-hardening.mjs',
    tokens: [
      'f126_release_evidence_hardening.json',
      'fase_126_release_evidence_hardening.md',
      'radshield-mx.release-evidence-hardening.f126',
    ],
  },
  {
    file: 'outputs/f126_release_evidence_hardening.json',
    tokens: ['"phase": "F126"', 'radshield-mx.release-evidence-hardening.f126', '"nextPhase": "F127"'],
  },
  {
    file: 'outputs/fase_126_release_evidence_hardening.md',
    tokens: ['# F126 Release Evidence Hardening', 'Required fields', 'F127 release candidate smoke'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f126:release-evidence', 'test:f126:release-evidence'],
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
    if (!text.includes(token)) failures.push(`${check.file}: missing token "${token}"`);
  }
}

if (failures.length > 0) {
  console.error('F126 release evidence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F126 release evidence contracts OK.');
