import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const implementation = {
  phase: 'F112',
  generatedAt: new Date().toISOString(),
  status: 'implemented-feature-flag-safe',
  persistentFavorites: [
    { id: 'memoria', label: 'Memoria', persistence: 'localStorage', purpose: 'Acceso persistente al flujo de memoria analitica.' },
    { id: 'evidence', label: 'Evidencia', persistence: 'localStorage', purpose: 'Acceso persistente a Evidence Pack y trazabilidad.' },
    { id: 'validate', label: 'Validar', persistence: 'localStorage', purpose: 'Acceso persistente a validacion normativa y numerica.' },
    { id: 'heatmap', label: 'Heatmap', persistence: 'localStorage', purpose: 'Acceso persistente a mapas de dosis/isodosis.' },
  ],
  smartChips: [
    { id: 'layout', label: 'Layout B/F/Z', behavior: 'Resume barreras, fuentes y zonas desde floorPlan.' },
    { id: 'rag', label: 'RAG listo/tras calcular', behavior: 'Cambia segun resultados disponibles para evidencia.' },
    { id: 'heat', label: 'Heat ON/OFF', behavior: 'Refleja si el heatmap esta activo.' },
    { id: 'db', label: 'DB diferida', behavior: 'Mantiene decision operativa mientras MySQL esta pendiente.' },
    { id: 'smoke', label: 'Smoke pendiente', behavior: 'Expone el gate de validacion antes de quitar fallbacks.' },
  ],
  miniCadTools: [
    { id: 'select', label: 'Sel', target: 'floorPlanFeatures', purpose: 'Seleccion, grips y edicion directa.' },
    { id: 'measure', label: 'Med', target: 'floorPlanFeatures', purpose: 'Cotas persistentes y medicion.' },
    { id: 'layers', label: 'Cap', target: 'floorPlanFeatures', purpose: 'Capas, overlays y visibilidad.' },
    { id: 'snap', label: 'Snap', target: 'keyboardShortcuts', purpose: 'Snapping endpoint/midpoint/angulo.' },
    { id: 'wall', label: 'Muro', target: 'barrierCalculator', purpose: 'Editar muro, espesor y material.' },
    { id: 'equip', label: 'Eq', target: 'equipmentLibrary', purpose: 'Equipo, footprint y fuente.' },
    { id: 'zone', label: 'Zona', target: 'floorPlanFeatures', purpose: 'Zona controlada y puntos de control.' },
    { id: 'inspect', label: '3D', target: 'medicalFloorPlan3D', purpose: 'Inspeccion 3D del plano medico.' },
  ],
  sidebarIntegration: [
    'CanvasQuickActionsSidebar mantiene acciones rapidas existentes.',
    'Mini CAD agrega comandos orientados a objeto/edicion sin reemplazar botones legacy.',
    'Modo colapsado conserva acciones representativas y agrega accesos CAD compactos.',
  ],
  dxTxNmCyPolicy: 'DX/TX/NM/CY permanecen como lanzadores de categoria en F112. Convertirlos en perfiles activos de modalidad queda para F113 despues de smoke.',
  decision: 'F112 implementa favoritos persistentes, chips inteligentes y Sidebar mini CAD como capa aditiva. No elimina dropdowns canonicos, fallbacks legacy ni botones DX/TX/NM/CY.',
};

const jsonPath = join(outputsDir, 'f112_quick_access_cad_integration.json');
const mdPath = join(outputsDir, 'fase_112_quick_access_cad_integration.md');

const md = [
  '# F112 - Chips inteligentes, Sidebar mini CAD y favoritos persistentes',
  '',
  '## Resultado',
  '',
  '- Favoritos persistentes en Acceso Rapido mediante localStorage.',
  '- Chips inteligentes conectados a estado de layout, RAG, heatmap, DB y smoke gate.',
  '- Sidebar mini CAD con herramientas de seleccion, medicion, capas, snap, muros, equipos, zonas e inspeccion 3D.',
  '- DX/TX/NM/CY se preservan como lanzadores de categoria; los perfiles activos quedan propuestos para F113.',
  '',
  '## Favoritos persistentes',
  '',
  ...implementation.persistentFavorites.map((item) => `- ${item.label}: ${item.purpose}`),
  '',
  '## Chips inteligentes',
  '',
  ...implementation.smartChips.map((item) => `- ${item.label}: ${item.behavior}`),
  '',
  '## Sidebar mini CAD',
  '',
  ...implementation.miniCadTools.map((item) => `- ${item.label}: ${item.purpose} Abre ${item.target}.`),
  '',
  '## Decision',
  '',
  implementation.decision,
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(implementation, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: implementation.status }, null, 2));
