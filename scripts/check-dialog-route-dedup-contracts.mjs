import fs from 'node:fs';

const file = 'src/pages/ShieldingDesigner.tsx';
const text = fs.readFileSync(file, 'utf8');
const matchesWithIndex = [...text.matchAll(/<LazyDialog\s+name="([^"]+)"/g)].map((match) => ({
  name: match[1],
  line: text.slice(0, match.index ?? 0).split('\n').length,
}));
const matches = matchesWithIndex.map((match) => match.name);
const counts = matches.reduce((acc, name) => {
  acc[name] = (acc[name] || 0) + 1;
  return acc;
}, {});

const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
const requiredDedicatedRoutes = [
  'materialComparison',
  'materialProperty',
  'materialLibrary',
  'costEstimator',
  'costOptimizer',
  'predictiveMaterial',
  'themeEngine',
  'dicom',
  'nuclearMedicine',
  'neutronShielding',
  'neutronRemoval',
  'complianceCertification',
  'aapmTG108',
  'ipem109',
  'batemanDecay',
  'decayChains',
  'shieldingCalculator',
  'therapyShielding',
];

const failures = [];
if (duplicates.length > 0) {
  failures.push(`Duplicated LazyDialog routes: ${duplicates.map(([name, count]) => {
    const lines = matchesWithIndex.filter((match) => match.name === name).map((match) => match.line).join('/');
    return `${name}(${count})@${lines}`;
  }).join(', ')}`);
}

for (const route of requiredDedicatedRoutes) {
  if (!matches.includes(route)) failures.push(`Missing LazyDialog route "${route}"`);
}

const handlerTokens = [
  "open('materialProperty')",
  "open('materialComparison')",
  "open('nuclearMedicine')",
  "open('neutronRemoval')",
  "open('costEstimator')",
  "open('costOptimizer')",
  "open('predictiveMaterial')",
  "open('aapmTG108')",
  "open('ipem109')",
  "open('decayChains')",
  "open('therapyShielding')",
];

for (const token of handlerTokens) {
  if (!text.includes(token)) failures.push(`${file}: missing handler token ${token}`);
}

if (failures.length > 0) {
  console.error('Dialog route dedup contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Dialog route dedup contracts OK.');
