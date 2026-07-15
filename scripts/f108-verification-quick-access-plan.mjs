import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const plan = {
  phase: 'F108',
  generatedAt: new Date().toISOString(),
  status: 'controlled-migration',
  targetFlow: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  canonicalCommands: [
    'NCRP validation suite',
    'NCRP 147 vs 151 cross-validation',
    'Shielding verification',
    'Sensitivity analysis',
    'Uncertainty / GUM',
    'Dose map / heatmap',
    'Performance dashboard',
    'Continuous tests',
  ],
  quickAccessImplementationPlan: [
    { phase: 'now-document-only', label: 'No tocar Acceso Rapido durante F108', risk: 'none' },
    { phase: 'f111-low-risk', label: 'Favoritos fijables', risk: 'none' },
    { phase: 'f111-low-risk', label: 'Chips de estado operativo', risk: 'low' },
    { phase: 'f112-feature-flag', label: 'Paleta contextual por modo', risk: 'low' },
    { phase: 'post-release', label: 'Ribbon compacto por flujo', risk: 'medium' },
  ],
  nextGroups: ['Reportes', 'Evidencia', 'Integraciones'],
  physicalRemovalNow: false,
  decision: 'Implementar Acceso Rapido despues de cerrar la migracion de menus canonicos y pasar smoke visual; empezar por Favoritos fijables y Chips de estado operativo.',
};

const jsonPath = join(outputsDir, 'f108_verification_quick_access_plan.json');
const mdPath = join(outputsDir, 'fase_108_verification_quick_access_plan.md');

const md = [
  '# F108 - Verificacion canonica y decision de Acceso Rapido',
  '',
  '## Resultado',
  '',
  '- Verificacion queda como cuarto dropdown canonico.',
  '- Los accesos legacy se conservan como fallback F108.',
  '- Acceso Rapido no se modifica todavia para no afectar operacion.',
  '',
  '## Cuando implementar Acceso Rapido',
  '',
  '- Ahora/F108: solo documentar y preparar contratos.',
  '- F111: implementar Favoritos fijables, porque no reemplaza handlers.',
  '- F111: implementar Chips de estado operativo conectados a Layout, Equipo, Zona, Calculo, Heatmap, Evidencia y DB.',
  '- F112: probar Paleta contextual por modo detras de feature flag.',
  '- Post-release: evaluar Ribbon compacto por flujo en rama experimental.',
  '',
  '## Siguiente etapa',
  '',
  'F109 debe migrar Reportes y mantener fallbacks hasta smoke runtime.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: plan.status }, null, 2));
