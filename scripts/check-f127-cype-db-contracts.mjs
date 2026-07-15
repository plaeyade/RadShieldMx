import fs from 'node:fs';

const files = [
  'src/lib/f127CypeDbAlternatives.ts',
  'scripts/f127-cype-db-alternatives.mjs',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
for (const file of files) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(files[0]) ? fs.readFileSync(files[0], 'utf8') : '';
const script = fs.existsSync(files[1]) ? fs.readFileSync(files[1], 'utf8') : '';
const updateDialog = fs.existsSync(files[2]) ? fs.readFileSync(files[2], 'utf8') : '';

const requiredLibTokens = [
  'buildF127CypeDbAlternatives',
  'mysql-windows-service',
  'mariadb-windows-service',
  'hosted-mysql',
  'sqlite-offline',
  'postgres-local',
  'Datos generales de obra',
  'Modelo por plantas y grupos',
  'Resultados e isovalores',
  'Mediciones y presupuesto',
  'DWG/DXF/IFC/BIM',
];

for (const token of requiredLibTokens) {
  if (!lib.includes(token)) failures.push(`src/lib/f127CypeDbAlternatives.ts missing token: ${token}`);
}

for (const token of ['f127_cype_db_alternatives.json', 'fase_127_cype_db_alternatives.md']) {
  if (!script.includes(token)) failures.push(`scripts/f127-cype-db-alternatives.mjs missing output token: ${token}`);
}

for (const token of ['buildF127CypeDbAlternatives', 'F127 CYPECAD + DB alternatives']) {
  if (!updateDialog.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

if (failures.length > 0) {
  console.error('F127 CYPE/DB contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F127 CYPE/DB contracts OK.');
