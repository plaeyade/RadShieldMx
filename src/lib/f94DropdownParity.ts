import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';
import { F93_DROPDOWN_MIGRATION_DECISION } from '@/lib/f93ReleaseSafety';
import { isDialogRegistered } from '@/stores/dialogRegistry';

export type F94ParityStatus = 'covered' | 'needs-handler-review' | 'missing-dialog';
export type F94MigrationGate = 'ready-for-staged-smoke-not-moved' | 'blocked';

export interface F94CriticalCommand {
  id: string;
  label: string;
  workflowStage: F92WorkflowStageId;
  legacyMenu: string;
  handler: string;
  dialogName?: string;
}

export interface F94StageParity {
  workflowStage: F92WorkflowStageId;
  label: string;
  total: number;
  covered: number;
  missingDialogs: string[];
}

export interface F94DropdownParitySummary {
  phase: 'F94';
  migrationGate: F94MigrationGate;
  physicalMoveNow: false;
  decision: string;
  totalCommands: number;
  coveredCommands: number;
  missingDialogs: string[];
  stageParity: F94StageParity[];
}

export const F94_CRITICAL_DROPDOWN_COMMANDS: F94CriticalCommand[] = [
  { id: 'design-floor-features', label: 'Floor Plan Features', workflowStage: 'design', legacyMenu: 'Diseno', handler: 'onFloorPlanFeatures', dialogName: 'floorPlanFeatures' },
  { id: 'design-medical-3d', label: 'Medical 3D Floor Plan', workflowStage: 'design', legacyMenu: 'Diseno', handler: 'onMedicalFloorPlan3D', dialogName: 'medicalFloorPlan3D' },
  { id: 'design-dxf-viewer', label: 'DXF Viewer', workflowStage: 'design', legacyMenu: 'Archivo/Diseno', handler: 'onDXFViewer', dialogName: 'dxfViewer' },
  { id: 'equipment-library', label: 'Equipment Library', workflowStage: 'equipment', legacyMenu: 'Herramientas/Med. Nuclear', handler: 'onEquipmentLibrary', dialogName: 'equipmentLibrary' },
  { id: 'equipment-source-library', label: 'Source Library', workflowStage: 'equipment', legacyMenu: 'Canvas/Analisis', handler: 'open(sourceLibrary)', dialogName: 'sourceLibrary' },
  { id: 'equipment-gamma-knife', label: 'Gamma Knife', workflowStage: 'equipment', legacyMenu: 'Med. Nuclear', handler: 'onGammaKnife', dialogName: 'gammaKnife' },
  { id: 'shielding-calculator', label: 'Shielding Calculator', workflowStage: 'shielding', legacyMenu: 'Calcular', handler: 'onShieldingCalculator', dialogName: 'shieldingCalculator' },
  { id: 'shielding-quick', label: 'Quick Barrier', workflowStage: 'shielding', legacyMenu: 'Calcular', handler: 'onQuick', dialogName: 'quickBarrier' },
  { id: 'shielding-multilayer', label: 'Multi-Layer Shield', workflowStage: 'shielding', legacyMenu: 'Canvas/Analisis', handler: 'open(multiLayerShield)', dialogName: 'multiLayerShield' },
  { id: 'verification-ncrp', label: 'NCRP Validation Suite', workflowStage: 'verification', legacyMenu: 'Normativa', handler: 'onNCRPValidation', dialogName: 'ncrpValidation' },
  { id: 'verification-cross', label: 'Cross Validation', workflowStage: 'verification', legacyMenu: 'Calcular', handler: 'onCrossValidation', dialogName: 'crossValidation' },
  { id: 'verification-heatmap', label: 'Spatial Dose Map', workflowStage: 'verification', legacyMenu: 'Fisica/Canvas', handler: 'onDoseMap/open(spatialDoseMap)', dialogName: 'spatialDoseMap' },
  { id: 'reports-memoria', label: 'Memoria AI', workflowStage: 'reports', legacyMenu: 'Reportes/Acceso rapido', handler: 'onMemoriaAI', dialogName: 'memoriaAI' },
  { id: 'reports-pdf', label: 'PDF Report', workflowStage: 'reports', legacyMenu: 'Archivo/Reportes', handler: 'onPDF', dialogName: 'pdfReport' },
  { id: 'reports-regulatory', label: 'Regulatory Report', workflowStage: 'reports', legacyMenu: 'Reportes/Canvas', handler: 'open(regulatoryReport)', dialogName: 'regulatoryReport' },
  { id: 'evidence-pack', label: 'Evidence Pack', workflowStage: 'evidence', legacyMenu: 'Reportes', handler: 'onEvidencePack', dialogName: 'evidencePack' },
  { id: 'evidence-bibliography', label: 'Bibliografia', workflowStage: 'evidence', legacyMenu: 'Normativa', handler: 'onBibliografia', dialogName: 'bibliography' },
  { id: 'evidence-audit', label: 'Audit Trail', workflowStage: 'evidence', legacyMenu: 'Archivo', handler: 'onAuditTrail', dialogName: 'auditTrail' },
  { id: 'integration-external', label: 'External Connector', workflowStage: 'integrations', legacyMenu: 'Herramientas', handler: 'onExternalSoftware', dialogName: 'externalConnector' },
  { id: 'integration-bim', label: 'BIM Connector', workflowStage: 'integrations', legacyMenu: 'Diseno/Herramientas', handler: 'onBIMConnector', dialogName: 'bimConnector' },
  { id: 'integration-python', label: 'Python Tools', workflowStage: 'integrations', legacyMenu: 'Herramientas', handler: 'onPythonTools', dialogName: 'pythonIntegration' },
];

export function getF94CommandStatus(command: F94CriticalCommand): F94ParityStatus {
  if (command.dialogName && !isDialogRegistered(command.dialogName)) return 'missing-dialog';
  if (!command.handler) return 'needs-handler-review';
  return 'covered';
}

export function buildF94DropdownParitySummary(): F94DropdownParitySummary {
  const missingDialogs = F94_CRITICAL_DROPDOWN_COMMANDS
    .filter((command) => getF94CommandStatus(command) === 'missing-dialog')
    .map((command) => command.dialogName || command.id);

  const coveredCommands = F94_CRITICAL_DROPDOWN_COMMANDS.filter((command) => getF94CommandStatus(command) === 'covered').length;
  const stageParity = F92_REAL_WORKFLOW.map((stage) => {
    const commands = F94_CRITICAL_DROPDOWN_COMMANDS.filter((command) => command.workflowStage === stage.id);
    return {
      workflowStage: stage.id,
      label: stage.label,
      total: commands.length,
      covered: commands.filter((command) => getF94CommandStatus(command) === 'covered').length,
      missingDialogs: commands
        .filter((command) => getF94CommandStatus(command) === 'missing-dialog')
        .map((command) => command.dialogName || command.id),
    };
  });

  return {
    phase: 'F94',
    migrationGate: missingDialogs.length === 0 ? 'ready-for-staged-smoke-not-moved' : 'blocked',
    physicalMoveNow: false,
    decision: `${F93_DROPDOWN_MIGRATION_DECISION.status}: mover dropdowns solo despues de smoke por grupo y regresion visual.`,
    totalCommands: F94_CRITICAL_DROPDOWN_COMMANDS.length,
    coveredCommands,
    missingDialogs,
    stageParity,
  };
}

