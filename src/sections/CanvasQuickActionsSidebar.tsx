/**
 * CanvasQuickActionsSidebar v110
 * 18 quick-access buttons integrated into canvas sidebar
 * Groups: NCRP, Analysis, Tools, Import/Export
 */
import { useState } from 'react';
import '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import {
  Atom, Database, Brain, Building2, Code,
  TrendingDown, GitCompareArrows, FileDown,
  Crosshair, FileText, ShieldPlus, ShieldAlert,
  Wind, Truck, ScanEye, ChevronRight, ChevronLeft, MousePointer2, Ruler, Layers,
  Magnet, PenTool, Box, MapPin, Glasses
} from 'lucide-react';

interface QuickActionGroup {
  id: string;
  label: string;
  buttons: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    bgColor: string;
    hoverBg: string;
    dialogName: string;
    title: string;
  }[];
}

const ACTION_GROUPS: QuickActionGroup[] = [
  {
    id: 'ncrp',
    label: 'NCRP',
    buttons: [
      { id: 'prim', label: 'Prim', icon: ShieldPlus, iconColor: 'text-red-500', bgColor: 'bg-white', hoverBg: 'hover:bg-red-50', dialogName: 'barrierCalculator', title: 'Barrera Primaria NCRP 147/151' },
      { id: 'sec', label: 'Sec', icon: ShieldAlert, iconColor: 'text-orange-500', bgColor: 'bg-white', hoverBg: 'hover:bg-orange-50', dialogName: 'scatterCalculator', title: 'Barrera Secundaria Scatter+Leakage' },
      { id: 'neut', label: 'Neut', icon: Atom, iconColor: 'text-blue-500', bgColor: 'bg-white', hoverBg: 'hover:bg-blue-50', dialogName: 'neutronShielding', title: 'Blindaje Neutronico NCRP 151 Table B.7' },
      { id: 'sky', label: 'Sky', icon: Wind, iconColor: 'text-sky-500', bgColor: 'bg-white', hoverBg: 'hover:bg-sky-50', dialogName: 'chiltonSkyshine', title: 'Skyshine Chilton dispersion atmosferica' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analisis',
    buttons: [
      { id: 'nist', label: 'NIST', icon: Database, iconColor: 'text-emerald-500', bgColor: 'bg-white', hoverBg: 'hover:bg-emerald-50', dialogName: 'nistXcom', title: 'NIST XCOM Coeficientes de atenuacion' },
      { id: 'ml', label: 'ML', icon: Brain, iconColor: 'text-purple-500', bgColor: 'bg-white', hoverBg: 'hover:bg-purple-50', dialogName: 'onnxPredictor', title: 'ML Predictor ONNX espesor optimo' },
      { id: 'opt', label: 'Opt', icon: TrendingDown, iconColor: 'text-teal-500', bgColor: 'bg-white', hoverBg: 'hover:bg-teal-50', dialogName: 'multiObjectiveOptimizer', title: 'Optimizador multi-objetivo costo+peso+espacio' },
      { id: 'comp', label: 'Comp', icon: GitCompareArrows, iconColor: 'text-orange-500', bgColor: 'bg-white', hoverBg: 'hover:bg-orange-50', dialogName: 'materialComparison', title: 'Comparacion materiales Pb vs Concrete vs Steel' },
      { id: 'map', label: 'Map', icon: Crosshair, iconColor: 'text-red-500', bgColor: 'bg-white', hoverBg: 'hover:bg-red-50', dialogName: 'spatialDoseMap', title: 'Mapa de dosis espacial 2D heatmap' },
    ],
  },
  {
    id: 'tools',
    label: 'Herramientas',
    buttons: [
      { id: 'transport', label: 'Trans', icon: Truck, iconColor: 'text-indigo-500', bgColor: 'bg-white', hoverBg: 'hover:bg-indigo-50', dialogName: 'transportDialog', title: 'Transporte Material Radiactivo SSR-6' },
      { id: 'opencv', label: 'CV', icon: ScanEye, iconColor: 'text-emerald-500', bgColor: 'bg-white', hoverBg: 'hover:bg-emerald-50', dialogName: 'floorPlanFeatures', title: 'OpenCV deteccion automatica paredes' },
      { id: 'mc', label: 'MC', icon: Atom, iconColor: 'text-green-500', bgColor: 'bg-white', hoverBg: 'hover:bg-green-50', dialogName: 'geant4Mc', title: 'Geant4 Monte Carlo Gold Standard' },
    ],
  },
  {
    id: 'io',
    label: 'I/O',
    buttons: [
      { id: 'ifc', label: 'IFC', icon: Building2, iconColor: 'text-blue-500', bgColor: 'bg-white', hoverBg: 'hover:bg-blue-50', dialogName: 'revitIfcImport', title: 'Revit IFC Import modelo BIM' },
      { id: 'addin', label: 'Add', icon: Code, iconColor: 'text-indigo-500', bgColor: 'bg-white', hoverBg: 'hover:bg-indigo-50', dialogName: 'revitAddin', title: 'Revit Add-in C# template' },
      { id: 'exp', label: 'Exp', icon: FileDown, iconColor: 'text-pink-500', bgColor: 'bg-white', hoverBg: 'hover:bg-pink-50', dialogName: 'batchReportExporter', title: 'Exportar reporte batch JSON/CSV' },
      { id: 'rep', label: 'Rep', icon: FileText, iconColor: 'text-amber-500', bgColor: 'bg-white', hoverBg: 'hover:bg-amber-50', dialogName: 'regulatoryReport', title: 'Memoria Analitica NOM-008/040' },
    ],
  },
];

const MINI_CAD_ACTIONS = [
  { id: 'select', label: 'Sel', icon: MousePointer2, iconColor: 'text-slate-600', dialogName: 'floorPlanFeatures', title: 'Seleccion, grips y edicion directa' },
  { id: 'measure', label: 'Med', icon: Ruler, iconColor: 'text-emerald-600', dialogName: 'floorPlanFeatures', title: 'Cotas persistentes y medicion' },
  { id: 'layers', label: 'Cap', icon: Layers, iconColor: 'text-teal-600', dialogName: 'floorPlanFeatures', title: 'Capas, overlays y visibilidad' },
  { id: 'snap', label: 'Snap', icon: Magnet, iconColor: 'text-indigo-600', dialogName: 'keyboardShortcuts', title: 'Snapping endpoint/midpoint/angulo' },
  { id: 'wall', label: 'Muro', icon: PenTool, iconColor: 'text-orange-600', dialogName: 'barrierCalculator', title: 'Editar muro, espesor y material' },
  { id: 'equip', label: 'Eq', icon: Box, iconColor: 'text-rose-600', dialogName: 'equipmentLibrary', title: 'Equipo, footprint y fuente' },
  { id: 'zone', label: 'Zona', icon: MapPin, iconColor: 'text-emerald-600', dialogName: 'floorPlanFeatures', title: 'Zona controlada y puntos de control' },
  { id: 'inspect', label: '3D', icon: Glasses, iconColor: 'text-violet-600', dialogName: 'medicalFloorPlan3D', title: 'Inspeccion 3D del plano medico' },
];

export default function CanvasQuickActionsSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const open = useAppStore.getState().open;

  return (
    <div
      className={`flex flex-col border-l border-slate-200 bg-white transition-all duration-200 ${collapsed ? 'w-8' : 'w-[72px]'}`}
      style={{ zIndex: 15 }}
    >
      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-6 w-full flex items-center justify-center border-b border-slate-100 hover:bg-slate-50 transition-colors"
        title={collapsed ? 'Expandir herramientas CAD rapidas' : 'Colapsar herramientas CAD rapidas para liberar canvas'}
      >
        {collapsed ? (
          <ChevronLeft className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-1">
          <div data-testid="f112-mini-cad-sidebar" className="mb-1">
            <div className="px-1.5 py-0.5 text-[7px] font-semibold text-orange-500 uppercase tracking-wider">
              Mini CAD
            </div>
            <div className="grid grid-cols-2 gap-0.5 px-1">
              {MINI_CAD_ACTIONS.map(btn => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    data-testid={`f112-mini-cad-${btn.id}`}
                    onClick={() => open(btn.dialogName)}
                    title={btn.title}
                    className="flex flex-col items-center justify-center rounded-md border border-orange-100 bg-orange-50/50 py-1 px-0.5 transition-colors hover:bg-orange-100 hover:border-orange-200"
                  >
                    <Icon className={`w-3 h-3 ${btn.iconColor}`} />
                    <span className="text-[7px] font-medium text-slate-700 mt-0.5 leading-none">{btn.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mx-1.5 my-1 border-b border-orange-100" />
          </div>

          {ACTION_GROUPS.map(group => (
            <div key={group.id} className="mb-1">
              <div className="px-1.5 py-0.5 text-[7px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-0.5 px-1">
                {group.buttons.map(btn => {
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => open(btn.dialogName)}
                      title={btn.title}
                      className={`flex flex-col items-center justify-center rounded-md py-1 px-0.5 transition-colors border border-transparent hover:border-slate-200 ${btn.bgColor} ${btn.hoverBg}`}
                    >
                      <Icon className={`w-3 h-3 ${btn.iconColor}`} />
                      <span className="text-[7px] font-medium text-slate-600 mt-0.5 leading-none">{btn.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mx-1.5 my-1 border-b border-slate-100" />
            </div>
          ))}

          {/* Version badge */}
          <div className="px-1.5 pt-0.5 text-center">
            <span className="text-[6px] text-slate-300 font-mono">v112</span>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-1 gap-1">
          {MINI_CAD_ACTIONS.slice(0, 3).map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => open(btn.dialogName)}
                title={`Mini CAD: ${btn.title}`}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-50"
              >
                <Icon className={`w-3 h-3 ${btn.iconColor}`} />
              </button>
            );
          })}
          <span className="-rotate-90 mt-5 text-[8px] font-semibold uppercase tracking-wide text-slate-300">CAD</span>
          {ACTION_GROUPS.map(group =>
            group.buttons.slice(0, 1).map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => open(btn.dialogName)}
                  title={`${group.label}: ${btn.title}`}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-50"
                >
                  <Icon className={`w-3 h-3 ${btn.iconColor}`} />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
