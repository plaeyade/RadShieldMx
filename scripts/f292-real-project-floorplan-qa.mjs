import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f292_real_project_floorplan_qa');
fs.mkdirSync(outDir, { recursive: true });

const canvas = fs.readFileSync(path.join(root, 'src', 'sections', 'CanvasArea.tsx'), 'utf8');
const sidebar = fs.readFileSync(path.join(root, 'src', 'sections', 'Sidebar.tsx'), 'utf8');
const f291 = JSON.parse(fs.readFileSync(path.join(root, 'outputs', 'f291_calculation_real_case_hardening', 'f291_calculation_real_case_hardening.json'), 'utf8'));

const input = {
  hasMainCanvas: canvas.includes('data-testid="f100-main-floorplan-canvas"'),
  hasSidebar: sidebar.includes('data-testid="f186-sidebar-stable-width"') || sidebar.includes('f186-sidebar'),
  hasImportFloorPlan: canvas.includes('onImportFloorPlan') && canvas.includes('Importar plano base'),
  hasDxfRecovery: fs.existsSync(path.join(root, 'outputs', 'f204_canvas_dxf_recovery_smoke_result.json')),
  hasScaleCalibration: canvas.includes('onCalibrateScale') && canvas.includes('Calibrar escala'),
  hasLayers: canvas.includes('onOpenLayers') && canvas.includes('Capas del canvas'),
  hasDimensionSchedule: canvas.includes('buildF209CanvasDimensionSchedule') && canvas.includes('f209'),
  hasEquipmentSymbols: canvas.includes('buildF211CanvasEquipmentSymbolSchedule') && canvas.includes('equipment'),
  hasHeatmapLegend: canvas.includes('buildF212HeatmapRegulatoryLegend') && canvas.includes('f89-heatmap-toggle'),
  hasVisualExport: canvas.includes('buildF217VisualExportByScene') && canvas.includes('onExportPNG'),
  hasWorkflowPanelControls: canvas.includes('f188-workflow-dock-button') && canvas.includes('f201-workflow-close-button'),
  hasMedical3DHandoff: canvas.includes('onOpenMedical3D') || canvas.includes('onOpen3DViewer'),
};

const rows = [
  ['shell', 'canvas/sidebar visible', input.hasMainCanvas && input.hasSidebar, 'Open app, confirm sidebar and floorplan viewport are visible before loading plans.'],
  ['plan-import', 'plan import path', input.hasImportFloorPlan && input.hasDxfRecovery, 'Load PNG/PDF or converted DXF and verify scale/layers before tracing barriers.'],
  ['scale', 'scale calibration', input.hasScaleCalibration, 'Calibrate with a known dimension and verify m/pixel in HUD.'],
  ['cad-edition', 'CAD editing surfaces', input.hasLayers && input.hasDimensionSchedule && input.hasEquipmentSymbols, 'Trace barriers, place equipment footprint and confirm schedule updates.'],
  ['dose-visuals', 'heatmap/isocontour visual QA', input.hasHeatmapLegend, 'Run calculation, enable heat/iso view and check regulatory legend before exporting.'],
  ['export-handoff', 'visual export and 3D handoff', input.hasVisualExport && input.hasMedical3DHandoff, 'Export canvas scene and open 3D inspection with same equipment/barriers.'],
  ['panel-controls', 'movable/closable workflow panels', input.hasWorkflowPanelControls, 'Move/compact/close Layout Blindaje Memoria and restore it from controls.'],
];

const items = rows.map(([id, label, ready, operatorCheck]) => ({
  id,
  label,
  status: ready ? 'ready' : 'guarded',
  evidence: ready ? 'Required UI/contract hooks are present.' : 'One or more required hooks/evidence artifacts are missing.',
  operatorCheck,
}));

const readyCount = items.filter((item) => item.status === 'ready').length;
const guardedCount = items.length - readyCount;
const payload = {
  schema: 'radshield-mx.f292.real-project-floorplan-qa.v1',
  phase: 'F292',
  generatedAt: new Date().toISOString(),
  status: guardedCount === 0 && f291.status === 'calculation-real-case-hardening-ready' ? 'real-project-floorplan-qa-ready' : 'real-project-floorplan-qa-guarded',
  inputPhases: ['F197', 'F204', 'F209', 'F211', 'F212', 'F217', 'F229', 'F291'],
  checks: input,
  readyCount,
  guardedCount,
  items,
  realProjectEntryOrder: [
    'Import plan or converted DXF',
    'Calibrate scale',
    'Trace controlled/adjacent areas',
    'Place equipment symbols and source metadata',
    'Assign materials and occupancy/use/design goals',
    'Run calculation and inspect heatmap/isocontours',
    'Export Memoria IA/PDF/Evidence/3D snapshots',
  ],
  highRiskRendererDecision: 'Do not replace renderer base/event controller before F292 is ready. Only then consider flagged renderer v2 with rollback.',
  outputArtifacts: [
    'outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json',
    'outputs/f292_real_project_floorplan_qa/f292_floorplan_operator_checklist.csv',
    'outputs/fase_292_real_project_floorplan_qa.md',
  ],
};

const csvHeader = ['id', 'label', 'status', 'operatorCheck'];
const csv = [
  csvHeader.join(','),
  ...items.map((row) => csvHeader.map((key) => JSON.stringify(String(row[key] ?? ''))).join(',')),
].join('\n');

fs.writeFileSync(path.join(outDir, 'f292_real_project_floorplan_qa.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f292_floorplan_operator_checklist.csv'), `${csv}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_292_real_project_floorplan_qa.md'), [
  '# F292 Real Project Floorplan QA',
  '',
  `Status: ${payload.status}`,
  '',
  '## Operator order',
  ...payload.realProjectEntryOrder.map((item, index) => `${index + 1}. ${item}`),
  '',
  '## QA items',
  ...items.map((item) => `- ${item.status.toUpperCase()} ${item.id}: ${item.operatorCheck}`),
  '',
  `Renderer decision: ${payload.highRiskRendererDecision}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({ status: payload.status, readyCount, guardedCount }, null, 2));
if (payload.status !== 'real-project-floorplan-qa-ready') process.exit(1);
