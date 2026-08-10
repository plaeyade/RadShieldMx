import fs from 'node:fs';

const source = fs.readFileSync('src/lib/f586F590NormativeDatasetQa.ts', 'utf8');

const required = [
  ['schema', 'radshield-mx.calc.normative-dataset-qa.f586-f590.v1'],
  ['NCRP151 source', 'src-ncrp151-canonical'],
  ['NCRP147 source', 'src-ncrp147-canonical'],
  ['IAEA source', 'src-iaea-srs47-canonical'],
  ['TG108 source', 'src-tg108-pet-canonical'],
  ['UAQ source', 'src-uaq-memorias-realcase'],
  ['hash marker', 'fnv1a-'],
  ['document chunks route', 'document_chunks:'],
  ['0.25 tolerance', '0.25'],
  ['0.5 tolerance', '0.5'],
  ['db seed required', 'db-seed-required'],
  ['clinical blocked', 'blocked-for-clinical'],
];

const failures = required
  .filter(([, token]) => !source.includes(token))
  .map(([label, token]) => `${label}: missing ${token}`);

const sourceRecords = [...source.matchAll(/id: 'src-/g)].length;
if (sourceRecords < 5) failures.push(`expected at least 5 source records, found ${sourceRecords}`);

if (failures.length) {
  console.error(`F586-F590 normative dataset values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F586-F590] Normative dataset values OK (${sourceRecords} sources).`);
