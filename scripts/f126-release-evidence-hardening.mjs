import fs from 'node:fs';
import path from 'node:path';

const requiredFields = ['claimId', 'documentId', 'pageRef-or-sectionRef', 'excerptHash', 'verificationStatus-reviewed-or-verified'];

const payload = {
  phase: 'F126',
  title: 'Release Evidence Hardening',
  status: 'implemented-release-evidence-hardening',
  schema: 'radshield-mx.release-evidence-hardening.f126',
  requiredFields,
  gates: [
    'Evidence Pack release-ready citation ledger',
    'Memoria/PDF generated evidence section includes F126 status',
    'Internal canvas/calculation sources include documentId and sectionRef',
    'Draft citations block release candidate until reviewed or verified',
  ],
  nextPhase: 'F127',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f126_release_evidence_hardening.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F126 Release Evidence Hardening',
  '',
  'F126 hardens the citation ledger for release-candidate readiness. A citation is not considered release-ready unless it has document identity, page or section reference, excerpt hash and reviewed/verified status.',
  '',
  'Required fields:',
  '',
  ...requiredFields.map((field) => `- ${field}`),
  '',
  'Gates:',
  '',
  ...payload.gates.map((gate) => `- ${gate}`),
  '',
  'Next phase: F127 release candidate smoke and registry cleanup.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_126_release_evidence_hardening.md'), markdown);
console.log('F126 release evidence hardening outputs written.');
