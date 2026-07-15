import fs from 'node:fs';

const cypeGaps = [
  ['Datos generales de obra', 'partial', 'Project Setup unico con modalidad, norma, materiales, ocupacion y version documental'],
  ['Modelo por plantas y grupos', 'partial', 'Agregar niveles/planta, losa base, estructura existente y zonas de carga'],
  ['Cargas estructurales por blindaje', 'implemented', 'Mantener prediagnostico kg/m2, kg/ml, masa y revision estructural'],
  ['Resultados e isovalores', 'partial', 'Agregar capa visual kg/m2 junto a isodosis con umbrales y export visual'],
  ['Mediciones y presupuesto', 'partial', 'Crear BOQ por barrera: m2, m3, kg, piezas, juntas, anclajes, acabado y tiempo'],
  ['DWG/DXF/IFC/BIM', 'external-required', 'DWG por conversion externa; DXF/SVG/IFC/Revit como puentes seguros'],
  ['Listados de comprobacion', 'implemented', 'Incluir estado estructural y ficha material en Evidence Pack'],
].map(([area, status, nextAction]) => ({ area, status, nextAction }));

const dbAlternatives = [
  {
    id: 'mysql-windows-service',
    label: 'MySQL 8 directo en Windows',
    status: 'recommended',
    bestUse: 'Arquitectura actual sin Docker; validar migrations, seed y smoke full-stack.',
  },
  {
    id: 'mariadb-windows-service',
    label: 'MariaDB directo en Windows',
    status: 'viable',
    bestUse: 'Plan B local si MySQL MSI falla, con prueba de compatibilidad.',
  },
  {
    id: 'hosted-mysql',
    label: 'MySQL administrado externo',
    status: 'viable',
    bestUse: 'Demo multiusuario o colaborativa sin administrar servidor local.',
  },
  {
    id: 'sqlite-offline',
    label: 'SQLite offline',
    status: 'fallback',
    bestUse: 'Paquete portable/offline, no reemplazo exacto de MySQL final.',
  },
  {
    id: 'postgres-local',
    label: 'PostgreSQL local',
    status: 'not-for-release',
    bestUse: 'Solo si se rediseña persistencia despues del release candidate.',
  },
];

const output = {
  phase: 'F127',
  status: 'implemented-gap-review',
  sourceBasis:
    'CYPECAD: BIM structural model, general data, floors/groups, beams/walls/slabs/foundations, results/isovalues, reports, DWG/DXF/PDF/IFC and quantity/cost export.',
  cypeGaps,
  dbAlternatives,
  decision:
    'Keep CYPECAD-inspired structure as prediagnostic impact/risk/BOQ guidance; do not claim formal structural solver. Prefer MySQL 8 Windows Service when Docker pull is blocked.',
  nextPhase:
    'F128: validate direct Windows MySQL DATABASE_URL, run migrations/seed/live validation; if blocked, define SQLite offline adapter scope.',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/f127_cype_db_alternatives.json', `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# F127 CYPECAD + DB Alternatives',
  '',
  `Status: ${output.status}`,
  '',
  '## CYPECAD gaps',
  ...cypeGaps.map((gap) => `- ${gap.area}: ${gap.status}. ${gap.nextAction}.`),
  '',
  '## DB alternatives without Docker',
  ...dbAlternatives.map((option) => `- ${option.label}: ${option.status}. ${option.bestUse}`),
  '',
  `Decision: ${output.decision}`,
  `Next: ${output.nextPhase}`,
  '',
].join('\n');
fs.writeFileSync('outputs/fase_127_cype_db_alternatives.md', md);

console.log('F127 CYPECAD/DB alternatives outputs written.');
