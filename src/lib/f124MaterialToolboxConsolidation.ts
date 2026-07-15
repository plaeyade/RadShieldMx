export type F124ToolboxDisposition =
  | 'canonical-toolbox'
  | 'kept-as-specialized-subtool'
  | 'integrated-as-decision-layer'
  | 'deduplicated-route'
  | 'tracked-registry-debt';

export interface F124MaterialToolboxItem {
  id: string;
  label: string;
  source: string;
  previousRole: string;
  f124Role: string;
  disposition: F124ToolboxDisposition;
  stability: 'stable' | 'usable-with-review' | 'registry-risk';
  keepReason: string;
}

export interface F124PhaseReconciliation {
  phase: 'old-f121' | 'old-f122' | 'old-f123';
  requestedScope: string;
  status: string;
  currentHandling: string;
}

export interface F124MaterialToolboxSummary {
  phase: 'F124';
  status: 'implemented-toolbox-consolidation';
  canonicalDialog: 'materialComparison';
  canonicalSurface: string;
  duplicateRemoved: string;
  inventory: F124MaterialToolboxItem[];
  phaseReconciliation: F124PhaseReconciliation[];
  registryDebt: string[];
  nextPhase: 'F125';
  decision: string;
}

export function buildF124MaterialToolboxInventory(): F124MaterialToolboxItem[] {
  return [
    {
      id: 'material-comparison',
      label: 'Comparador HVL/TVL + matriz de decision',
      source: 'MaterialComparisonDialog.tsx',
      previousRole: 'Comparar materiales por HVL, TVL, masa y costo basico.',
      f124Role: 'Superficie canonica para decidir material por blindaje, costo, tiempo y estructura.',
      disposition: 'canonical-toolbox',
      stability: 'stable',
      keepReason: 'Ya esta conectado al store materialComparison y recibio la matriz F123 sin depender de DB live.',
    },
    {
      id: 'material-property-calculator',
      label: 'Editor fisico de materiales',
      source: 'MaterialPropertyCalculator.tsx',
      previousRole: 'Calcular MAC, HVL, TVL, MFP, Zeff, Neff y buildup para compuestos.',
      f124Role: 'Subherramienta avanzada para crear o justificar materiales antes de compararlos.',
      disposition: 'kept-as-specialized-subtool',
      stability: 'usable-with-review',
      keepReason: 'Aporta fisica de material que el comparador no debe duplicar; requiere ruta limpia en el registry.',
    },
    {
      id: 'lead-free-materials',
      label: 'Alternativas sin plomo',
      source: 'LeadFreeMaterialsDialog.tsx',
      previousRole: 'Dialogo separado para materiales lead-free y mezclas HDPE/high-Z.',
      f124Role: 'Categoria dentro del toolbox, no segundo dialogo con el mismo nombre materialComparison.',
      disposition: 'deduplicated-route',
      stability: 'stable',
      keepReason: 'El contenido es util, pero el montaje duplicado causaba ambiguedad de apertura.',
    },
    {
      id: 'cost-estimator',
      label: 'Estimador CAPEX/OPEX',
      source: 'CostEstimatorDialog.tsx',
      previousRole: 'Estimar costos por material, mano de obra, indirectos e ingenieria.',
      f124Role: 'Subherramienta de costo que debe consumir la seleccion canonica de material/barrera.',
      disposition: 'kept-as-specialized-subtool',
      stability: 'stable',
      keepReason: 'Calcula costos con mas detalle que la matriz F123; debe seguir separado para no sobrecargar el comparador.',
    },
    {
      id: 'cost-optimizer',
      label: 'Optimizador de costo',
      source: 'CostOptimizerDialog.tsx',
      previousRole: 'Optimizar espesor/material por objetivo de kerma, energia y longitud.',
      f124Role: 'Subherramienta de optimizacion despues de seleccionar familia de material.',
      disposition: 'kept-as-specialized-subtool',
      stability: 'stable',
      keepReason: 'Es util para iterar espesores, pero no reemplaza la comparacion estructural/obra.',
    },
    {
      id: 'predictive-material',
      label: 'Material predictivo',
      source: 'PredictiveMaterialDialog.tsx',
      previousRole: 'Sugerir material por pesos relativos de costo, peso y constructibilidad.',
      f124Role: 'Subherramienta de recomendacion IA/heuristica, subordinada al toolbox canonico.',
      disposition: 'kept-as-specialized-subtool',
      stability: 'usable-with-review',
      keepReason: 'Aporta exploracion de alternativas, pero sus sugerencias deben quedar trazadas y confirmadas.',
    },
    {
      id: 'f121-f122-f123',
      label: 'Capas F121/F122/F123',
      source: 'f121StructuralShieldingImpact.ts + f122CanvasStructuralOverlay.ts + f123MaterialDecisionMatrix.ts',
      previousRole: 'Capas nuevas para impacto estructural, overlay canvas y matriz de decision.',
      f124Role: 'Modelo de decision que une seguridad radiologica, obra, estructura y evidencia.',
      disposition: 'integrated-as-decision-layer',
      stability: 'stable',
      keepReason: 'Son offline-safe, testeables y conectan canvas, materiales y trazabilidad.',
    },
  ];
}

export function buildF124PhaseReconciliation(): F124PhaseReconciliation[] {
  return [
    {
      phase: 'old-f121',
      requestedScope: 'Pulido UX/documental post-smoke: etiquetas, textos, checklist de release, capturas y trazabilidad.',
      status: 'covered-by-f115-f120',
      currentHandling: 'Quedo absorbido por smoke visual, perfiles DX/TX/NM/CY, handoff Memoria/Report/Evidence y runtime screenshots.',
    },
    {
      phase: 'old-f122',
      requestedScope: 'QA canvas/floorplan final: seleccion, snapping, capas, cotas, heatmap, equipos y export visual.',
      status: 'covered-by-f85-f100-and-f122',
      currentHandling: 'La base CAD-like y el overlay estructural existen; queda una pasada final E2E antes de release candidate.',
    },
    {
      phase: 'old-f123',
      requestedScope: 'QA calculo/memoria: formula, norma, inputs, outputs, citas y evidencia por cada resultado.',
      status: 'partial-pending-report-evidence-gate',
      currentHandling: 'La cita y la memoria estan encaminadas, pero falta forzar el contrato por resultado exportado en reportes y memoria analitica.',
    },
  ];
}

export function buildF124MaterialToolboxSummary(): F124MaterialToolboxSummary {
  return {
    phase: 'F124',
    status: 'implemented-toolbox-consolidation',
    canonicalDialog: 'materialComparison',
    canonicalSurface: 'MaterialComparisonDialog as material editor + cost/time/structure toolbox entry point',
    duplicateRemoved: 'LeadFreeMaterialsDialog no longer mounts as materialComparison',
    inventory: buildF124MaterialToolboxInventory(),
    phaseReconciliation: buildF124PhaseReconciliation(),
    registryDebt: [
      'Resolved after F126 review: materialProperty, nuclearMedicine and neutronRemoval now use dedicated dialog routes.',
    ],
    nextPhase: 'F125',
    decision:
      'Mantener materialComparison como toolbox canonico; conservar calculadora fisica, lead-free, costos y optimizadores como subherramientas trazables sin duplicar rutas.',
  };
}
