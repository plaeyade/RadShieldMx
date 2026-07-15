import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const migration = {
  phase: 'F107',
  generatedAt: new Date().toISOString(),
  status: 'controlled-migration',
  targetFlow: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  canonicalCommands: [
    'Calcular blindaje',
    'Calculadora UAQ/NCRP',
    'Quick Barrier',
    'Suelo/Techo',
    'Multi-layer/Laminated',
    'Neutrones',
    'Skyshine',
    'Optimizacion',
    'PET/SPECT/Terapia',
  ],
  labeledRollbackItems: [
    'Calcular fallback F107',
    'UAQ/NCRP fallback F107',
    'Quick Barrier fallback F107',
    'Suelo/Techo fallback F107',
    'Neutrones fallback F107',
    'AAPM TG 108 fallback F107',
    'IPEM 109 fallback F107',
    'Therapy Radionuclide fallback F107',
  ],
  quickAccessAlternatives: [
    'Paleta contextual por modo',
    'Ribbon compacto por flujo',
    'Favoritos fijables',
    'Chips de estado operativo',
  ],
  nextGroups: ['Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  physicalRemovalNow: false,
  decision: 'Blindaje becomes the third canonical workflow dropdown. Legacy commands stay labeled as F107 fallback until visual and submenu smoke evidence pass.',
};

const jsonPath = join(outputsDir, 'f107_shielding_menu_migration.json');
const mdPath = join(outputsDir, 'fase_107_shielding_menu_migration.md');

const md = [
  '# F107 - Migracion canonica de Blindaje',
  '',
  '## Resultado',
  '',
  '- Estado: controlled-migration.',
  '- Blindaje queda como tercer dropdown canonico del flujo real.',
  '- Los accesos legacy en Calcular, Fisica y Med. Nuclear quedan rotulados como fallback F107.',
  '- Eliminacion fisica masiva: no.',
  '',
  '## Comandos canonicos',
  '',
  ...migration.canonicalCommands.map((item) => `- ${item}.`),
  '',
  '## Fallback conservado',
  '',
  ...migration.labeledRollbackItems.map((item) => `- ${item}.`),
  '',
  '## Alternativas futuras para acceso rapido',
  '',
  '- Paleta contextual por modo: bajo riesgo si se agrega como capa opcional.',
  '- Ribbon compacto por flujo: util, pero requiere feature flag para no romper operacion.',
  '- Favoritos fijables: primera mejora recomendada porque no afecta handlers.',
  '- Chips de estado operativo: conectar con Layout, Equipo, Zona, Calculo, Heatmap, Evidencia y DB.',
  '',
  '## Siguiente etapa',
  '',
  'F108 debe mover Verificacion y revisar los warnings runtime persistentes antes de retirar fallbacks.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(migration, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: migration.status, nextGroups: migration.nextGroups }, null, 2));
