import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/appStore';
import {
  // Drawing tools
  MousePointer, Ruler, Eraser,
  // NCRP
  ShieldPlus, ShieldAlert, Atom, Wind, ArrowUpDown, Zap,
  // Analysis
  Database, Brain, TrendingDown, GitCompareArrows, Crosshair,
  // v114-116
  ShieldHalf, Library, ScanLine,
  // v117-120
  BarChart3, Wand2,
  // Tools
  Truck, ScanEye, Building2, Code, Layers, Box,
  // I/O
  FileDown, FileText, FolderOpen,
  // Action bar integration
  Play, Calculator, Sparkles, FileSpreadsheet,
  // Utility
  Upload, ChevronLeft, ChevronRight, Moon, Keyboard, Stethoscope,
} from 'lucide-react';
import type { CriticalPoint, FloorPlan, Barrier } from '@/types/radshield';
import { applyShieldingPresetToBarrier, SHIELDING_PRESETS } from '@/lib/canvasF85Workflow';
import { CANVAS_TOOL_ICON_PROFILES, getCanvasToolIconProfile } from '@/lib/f98UnifiedIconography';
import { toast } from 'sonner';
import { filtrarVisoresEnRevision } from '@/lib/featureFlags';
import TG108PatientModelCard from './TG108PatientModelCard';

type Tool = 'select' | 'barrier' | 'source' | 'region' | 'measure' | 'pan' | 'eraser' | 'reset';

const SIDEBAR_WIDTH_KEY = 'radshield_sidebar_width_f188';
const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 244;
const MAX_SIDEBAR_WIDTH = 300;

function clampSidebarWidth(value: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value));
}

function loadSidebarWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
  const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
  return Number.isFinite(storedWidth) ? clampSidebarWidth(storedWidth) : DEFAULT_SIDEBAR_WIDTH;
}

/* ═══════════════════════════════════════════
   ACTION BUTTON — Enhanced visual style
   ═══════════════════════════════════════════ */
function ActionBtn({
  icon: Icon, label, title, color, bgColor, isActive, onClick, size = 'md'
}: {
  icon: React.ComponentType<{className?: string; style?: React.CSSProperties; strokeWidth?: number}>;
  label: string; title: string; color: string; bgColor: string;
  isActive?: boolean; onClick: () => void; size?: 'sm' | 'md';
}) {
  const h = size === 'sm' ? 'h-7' : 'h-9';
  const w = size === 'sm' ? 'min-w-0' : 'min-w-0';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const fontSize = size === 'sm' ? 'text-[7px]' : 'text-[8px]';

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={`${label}: ${title}`}
      data-testid={`sidebar-action-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
      className={`${h} ${w} flex flex-col items-center justify-center rounded-lg py-1 px-0.5 transition-all duration-150 border ${
        isActive
          ? 'border-white/30 shadow-md scale-[1.02]'
          : 'border-transparent hover:border-slate-200 hover:shadow-sm hover:scale-[1.02] active:scale-95'
      }`}
      style={{
        backgroundColor: isActive ? color : bgColor,
        color: isActive ? '#fff' : color,
      }}
    >
      <Icon className={iconSize} strokeWidth={isActive ? 2.5 : 2} />
      <span className={`${fontSize} font-bold mt-0.5 leading-none tracking-tight`}>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   DRAWING TOOLS — v113
   ═══════════════════════════════════════════ */
const DRAWING_TOOLS = ([
  'select',
  'barrier',
  'source',
  'region',
  'pan',
  'measure',
  'eraser',
  'reset',
] as Tool[]).map((id) => {
  const profile = getCanvasToolIconProfile(id);
  return {
    id,
    icon: profile.icon,
    label: profile.shortLabel,
    color: profile.color,
    bg: profile.bg,
    desc: profile.description,
  };
});

/* ═══════════════════════════════════════════
   NCRP CALCULATORS — v113
   ═══════════════════════════════════════════ */
const NCRP_TOOLS = [
  { icon: ShieldPlus,  label: 'Prim', dialog: 'shieldingCalculator',  title: 'Barrera Primaria NCRP 147/151',       color: '#dc2626', bg: '#fef2f2' },
  { icon: ShieldAlert, label: 'Sec',  dialog: 'shieldingCalculator',  title: 'Barrera Secundaria Scatter+Leakage',   color: '#f97316', bg: '#fff7ed' },
  { icon: Atom,        label: 'Neut', dialog: 'neutronShielding',     title: 'Blindaje Neutronico NCRP 151',         color: '#2563eb', bg: '#eff6ff' },
  { icon: Wind,        label: 'Sky',  dialog: 'skyshine',             title: 'Skyshine Chilton dispersion',          color: '#0891b2', bg: '#ecfeff' },
  { icon: ArrowUpDown, label: 'Piso', dialog: 'floorCeiling',         title: 'Suelo/Techo blindaje vertical',        color: '#059669', bg: '#ecfdf5' },
  { icon: Zap,         label: 'Rap',  dialog: 'quickBarrier',         title: 'Barrera Rapida calculo directo',       color: '#d97706', bg: '#fef3c7' },
];

/* ═══════════════════════════════════════════
   ANALYSIS TOOLS — v113
   ═══════════════════════════════════════════ */
const ANALYSIS_TOOLS = filtrarVisoresEnRevision([
  { icon: Database,         label: 'NIST', dialog: 'nistXcom',                title: 'NIST XCOM Coef. Atenuacion',      color: '#059669', bg: '#ecfdf5' },
  { icon: Brain,            label: 'PET',  dialog: 'onnxPredictor',           title: 'Espesor PET (TG-108)',            color: '#7c3aed', bg: '#f5f3ff' },
  { icon: TrendingDown,     label: 'Opt',  dialog: 'multiObjectiveOptimizer', title: 'Optimizador de materiales PET',   color: '#0d9488', bg: '#f0fdfa' },
  { icon: GitCompareArrows, label: 'Comp', dialog: 'materialComparison',      title: 'Comparacion Materiales Pb/Concr', color: '#ea580c', bg: '#fff7ed' },
  { icon: Crosshair,        label: 'Dose', dialog: 'spatialDoseMap',          title: 'Mapa Dosis 2D Heatmap',           color: '#e11d48', bg: '#fff1f2' },
  { icon: ShieldHalf,       label: 'MLay', dialog: 'multiLayerShield',        title: 'Multi-Layer Shield — Barreras laminadas', color: '#b45309', bg: '#fef3c7' },
  { icon: Library,          label: 'Src',  dialog: 'sourceLibrary',           title: 'Source Library — 7 geometrias, 14 radionucleidos', color: '#dc2626', bg: '#fef2f2' },
  { icon: ScanLine,         label: '3DI',  dialog: 'isosurface3d',            title: '3D Isosurface Dose Map — Canvas 3D', color: '#0891b2', bg: '#ecfeff' },
  { icon: BarChart3,        label: 'Sens', dialog: 'sensitivityAnalysis',     title: 'Sensitivity Analysis — Tornado charts ±20%', color: '#0d9488', bg: '#f0fdfa' },
  { icon: TrendingDown,     label: 'Pare', dialog: 'paretoOptimizer',         title: 'NSGA-III Pareto Optimizer — Multi-objetivo', color: '#7c3aed', bg: '#f5f3ff' },
  { icon: Atom,             label: 'Nuc',  dialog: 'nuclideLibrary500',       title: 'Nuclide Library — 40+ radionucleidos',       color: '#7c3aed', bg: '#f5f3ff' },
  { icon: Play,             label: 'Swp',  dialog: 'doseSweep',               title: 'Animated Dose Sweep — 360deg rotation',      color: '#e11d48', bg: '#fff1f2' },
], (t) => t.dialog);

/* ═══════════════════════════════════════════
   UTILITY TOOLS — v113
   ═══════════════════════════════════════════ */
const UTILITY_TOOLS = [
  { icon: Truck,      label: 'Trans', dialog: 'transportDialog',   title: 'Transporte SSR-6 Radiactivo',     color: '#4f46e5', bg: '#eef2ff' },
  { icon: ScanEye,    label: 'CV',    dialog: 'floorPlanFeatures', title: 'OpenCV Deteccion Automatica',     color: '#16a34a', bg: '#f0fdf4' },
  { icon: Atom,       label: 'MC',    dialog: 'geant4Mc',          title: 'Referencia analítica para Geant4', color: '#16a34a', bg: '#f0fdf4' },
  { icon: Building2,  label: 'IFC',   dialog: 'revitIfcImport',    title: 'Revit IFC Import Modelo BIM',     color: '#2563eb', bg: '#eff6ff' },
  { icon: Code,       label: 'Add',   dialog: 'revitAddin',        title: 'Revit Add-in Template C#',        color: '#4f46e5', bg: '#eef2ff' },
  { icon: Layers,     label: 'Lab',   dialog: 'maze',              title: 'Laberinto NCRP 151',              color: '#7c3aed', bg: '#f5f3ff' },
  { icon: Box,        label: '3D',    dialog: 'viewer3d',          title: 'Visor 3D Bunker',                 color: '#0891b2', bg: '#ecfeff' },
  { icon: Stethoscope,label: 'Med3D', dialog: 'medicalFloorPlan3D', title: 'Plano medico 3D fotorealista',    color: '#0f766e', bg: '#ccfbf1' },
  { icon: Wand2,      label: 'ALARA', dialog: 'alaraWizard',       title: 'Asistente ALARA — sustitución de materiales',     color: '#10b981', bg: '#ecfdf5' },
  { icon: Moon,       label: 'Dark',  dialog: 'darkMode',          title: 'Dark Mode — Tema y colores',      color: '#475569', bg: '#f1f5f9' },
  { icon: Keyboard,   label: 'Keys',  dialog: 'keyboardShortcuts', title: 'Atajos de teclado personalizables', color: '#475569', bg: '#f1f5f9' },
  { icon: Library,    label: 'Mat',   dialog: 'materialLibrary',   title: 'Biblioteca de materiales (propios y del sistema)', color: '#b45309', bg: '#fef3c7' },
];

/* ═══════════════════════════════════════════
   I/O TOOLS — v113
   ═══════════════════════════════════════════ */
const IO_TOOLS = [
  { icon: FileDown,       label: 'Exp',  dialog: 'batchReportExporter', title: 'Exportar Reporte Batch',        color: '#db2777', bg: '#fdf2f8' },
  { icon: FileText,       label: 'Rep',  dialog: 'regulatoryReport',    title: 'Memoria Regulatoria CNSNS',     color: '#d97706', bg: '#fef3c7' },
  { icon: FileText,       label: 'Gest', dialog: 'reportManager',       title: 'Gestor de reportes guardados',  color: '#d97706', bg: '#fef3c7' },
  { icon: FileText,       label: 'PDF',  dialog: 'pdfReport',           title: 'PDF Report — CNSNS LA-007/01',  color: '#b45309', bg: '#fef3c7' },
  { icon: GitCompareArrows, label: 'Diff', dialog: 'designCompare',     title: 'Design Compare — Before/After', color: '#2563eb', bg: '#eff6ff' },
  { icon: FileDown,       label: 'DXF',  dialog: 'dxfExport',           title: 'Exportar DXF/DWG/SVG/JSON',     color: '#ea580c', bg: '#fff7ed' },
  { icon: FolderOpen,     label: 'Proj', dialog: 'projects',            title: 'Gestor de Proyectos',           color: '#475569', bg: '#f1f5f9' },
];

/* ═══════════════════════════════════════════
   QUICK ACTIONS — Integrated from QAB
   ═══════════════════════════════════════════ */
const QUICK_ACTIONS = [
  { icon: Play,        label: 'Calc', action: 'calculate',  title: 'Calcular blindaje (F5)',            color: '#f97316', bg: '#fff7ed' },
  { icon: Calculator,  label: 'UAQ',  action: 'uaq',        title: 'Unidad de Atenuacion Cualitativa',   color: '#10b981', bg: '#ecfdf5' },
  { icon: FileSpreadsheet, label: 'Mem', action: 'memoria', title: 'Memoria Analitica AI',              color: '#8b5cf6', bg: '#f5f3ff' },
  { icon: GitCompareArrows, label: 'Mat', action: 'material', title: 'Toolbox materiales: TVL, densidad, peso, costo, tiempo y carga estructural', color: '#ea580c', bg: '#fff7ed' },
  { icon: Box,         label: 'DXF',  action: 'dxf',        title: 'Importar DXF AutoCAD',              color: '#ea580c', bg: '#fff7ed' },
];

/* ═══════════════════════════════════════════
   Section Header
   ═══════════════════════════════════════════ */
function SectionHead({ icon: Icon, label, color, count }: { icon: React.ComponentType<{className?: string; style?: React.CSSProperties}>, label: string, color: string, count?: number }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2 pb-1">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-4 h-4 p-0.5" style={{ color }} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{count}</span>
      )}
    </div>
  );
}

interface SidebarProps {
  floorPlan: FloorPlan;
  setFloorPlan: React.Dispatch<React.SetStateAction<FloorPlan>>;
  activeTool: Tool;
  setActiveTool: (t: Tool) => void;
  selectedSource: FloorPlan['sources'][number] | null;
  selectedBarrier: FloorPlan['barriers'][number] | null;
  selectedCriticalPoint?: CriticalPoint | null;
  updateSelected: (props: Partial<Barrier> | Partial<FloorPlan['sources'][number]> | Partial<CriticalPoint>) => void;
  deleteSelected: () => void;
  resetView: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunCalculations?: () => void;
  onUAQ?: () => void;
  onMemoriaAI?: () => void;
  onMazeCalculator?: () => void;
  onDXFViewer?: () => void;
}

export default function Sidebar({
  floorPlan, setFloorPlan, activeTool, setActiveTool,
  selectedSource, selectedBarrier, selectedCriticalPoint, updateSelected, deleteSelected, resetView, onImageUpload,
  onRunCalculations, onUAQ, onMemoriaAI, onMazeCalculator: _onMazeCalculator, onDXFViewer,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(loadSidebarWidth);
  const [lastQuickAction, setLastQuickAction] = useState<string | null>(null);
  const open = useAppStore((s) => s.open);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const adjustSidebarWidth = (delta: number) => {
    setSidebarWidth((current) => clampSidebarWidth(current + delta));
  };

  /* ─── Quick action dispatcher ─── */
  const runQuickAction = (label: string, handler?: () => void, fallbackDialog?: string) => {
    try {
      if (handler) {
        handler();
      } else if (fallbackDialog) {
        open(fallbackDialog as any);
      } else {
        throw new Error('accion no configurada');
      }
      setLastQuickAction(label);
      toast.success(`${label}: accion enviada`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      setLastQuickAction(`${label}: error`);
      toast.error(`${label}: ${message}`);
    }
  };

  const dispatchQuickAction = (action: string) => {
    switch (action) {
      case 'calculate': runQuickAction('Calcular blindaje', onRunCalculations, 'dashboardCalc'); break;
      case 'uaq': runQuickAction('UAQ / Atenuacion', onUAQ, 'shieldingCalculator'); break;
      case 'memoria': runQuickAction('Memoria IA', onMemoriaAI, 'memoriaAI'); break;
      case 'material': runQuickAction('Toolbox materiales', () => open('materialComparison')); break;
      case 'dxf': runQuickAction('DXF / DWG', onDXFViewer, 'dxfViewer'); break;
      default:
        setLastQuickAction('Accion no configurada');
        toast.warning('Accion rapida no configurada');
    }
  };

  /* ─── collapsed mode ─── */
  if (collapsed) {
    return (
      <div className="h-full w-12 min-w-12 max-w-12 shrink-0 flex flex-col bg-white border-r border-gray-200 items-center py-2" data-testid="f186-sidebar-collapsed-stable">
        <Button variant="ghost" size="icon" className="h-8 w-8 mb-2" onClick={() => setCollapsed(false)} title="Expandir">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center mb-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <Separator className="my-2" />
        {DRAWING_TOOLS.slice(0, 5).map(({ id, icon: Icon, label, color, desc }) => (
          <Button key={id} variant={activeTool === id ? 'default' : 'ghost'} size="icon" className="h-8 w-8 mb-1"
            onClick={() => setActiveTool(id)} title={desc} aria-label={`${label}: ${desc}`}>
            <Icon className="w-4 h-4" style={{ color: activeTool === id ? '#fff' : color }} />
          </Button>
        ))}
        <Separator className="my-2" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={deleteSelected} title="Borrar">
          <Eraser className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="h-full shrink-0 flex flex-col bg-white border-r border-gray-200"
      style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
      data-testid="f186-sidebar-stable-width"
      data-f188-sidebar-resizable="true"
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gradient-to-r from-[#fff7ed] to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-[12px] text-gray-800">RadShield</span>
            <span className="text-[12px] font-bold text-[#f97316]">-MX</span>
            <p className="text-[8px] text-gray-400 font-mono">v127 | NCRP 147/151</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div
            data-testid="f188-sidebar-width-controls"
            className="flex items-center gap-0.5 rounded-md border border-orange-100 bg-white/80 px-1 py-0.5"
            aria-label="Ajustar ancho de sidebar"
          >
            <button
              type="button"
              className="h-5 w-5 rounded text-[11px] font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => adjustSidebarWidth(-20)}
              title="Reducir ancho de sidebar"
              aria-label="Reducir ancho de sidebar"
            >
              -
            </button>
            <span className="w-9 text-center text-[8px] font-mono text-slate-400">{sidebarWidth}px</span>
            <button
              type="button"
              className="h-5 w-5 rounded text-[11px] font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => adjustSidebarWidth(20)}
              title="Aumentar ancho de sidebar"
              aria-label="Aumentar ancho de sidebar"
            >
              +
            </button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(true)} title="Colapsar">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 overflow-auto p-2 space-y-2">

        {/* ─── QUICK ACTIONS (from QAB) ─── */}
        <div className="bg-gradient-to-r from-[#fff7ed] via-white to-[#ecfdf5] rounded-lg border border-slate-100 p-2 shadow-sm">
          <SectionHead icon={Play} label="Acciones" color="#f97316" />
          <div className="grid grid-cols-5 gap-1 mt-1" data-testid="f186-quick-actions-with-mat">
            {QUICK_ACTIONS.map((a) => (
              <ActionBtn key={a.label} icon={a.icon} label={a.label} title={a.title}
                color={a.color} bgColor={a.bg} size="sm"
                onClick={() => dispatchQuickAction(a.action)} />
            ))}
          </div>
          <div
            data-testid="f374-quick-action-status"
            className="mt-1 rounded-md border border-orange-100 bg-white/80 px-2 py-1 text-[9px] font-medium text-slate-500"
            title="Confirmacion de que el acceso rapido envio una accion real o abrio su fallback"
          >
            {lastQuickAction ? `Ultima accion: ${lastQuickAction}` : 'Accesos conectados: calculo, UAQ, Memoria IA, materiales y DXF.'}
          </div>
        </div>

        {/* ─── DRAWING TOOLS ─── */}
        <Card
          data-testid="f98-unified-canvas-buttons"
          data-tool-count={Object.keys(CANVAS_TOOL_ICON_PROFILES).length}
          className="border-slate-200 shadow-sm overflow-hidden"
        >
          <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <MousePointer className="w-3 h-3 text-slate-400" />
              Herramientas de Dibujo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-4 gap-1">
              {DRAWING_TOOLS.map(({ id, icon, label, color, bg, desc }) => (
                <ActionBtn key={id} icon={icon} label={label} title={desc}
                  color={color} bgColor={bg} isActive={activeTool === id}
                  onClick={() => {
                    if (id === 'reset') resetView();
                    else if (id === 'eraser') deleteSelected();
                    else setActiveTool(id);
                  }} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── NCRP CALCULATORS ─── */}
        <Card className="border-red-100 shadow-sm overflow-hidden">
          <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-red-50 to-white">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-red-600">
              <ShieldPlus className="w-3 h-3" /> Calculo NCRP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-3 gap-1">
              {NCRP_TOOLS.map((t) => (
                <ActionBtn key={t.label} icon={t.icon} label={t.label} title={t.title}
                  color={t.color} bgColor={t.bg} onClick={() => open(t.dialog as any)} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── ANALYSIS TOOLS ─── */}
        <Card className="border-emerald-100 shadow-sm overflow-hidden">
          <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-emerald-50 to-white">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
              <Database className="w-3 h-3" /> Analisis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-4 gap-1">
              {ANALYSIS_TOOLS.map((t) => (
                <ActionBtn key={t.label} icon={t.icon} label={t.label} title={t.title}
                  color={t.color} bgColor={t.bg} onClick={() => open(t.dialog as any)} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── UTILITY TOOLS ─── */}
        <Card className="border-indigo-100 shadow-sm overflow-hidden">
          <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-indigo-50 to-white">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
              <Truck className="w-3 h-3" /> Utilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-4 gap-1">
              {UTILITY_TOOLS.map((t) => (
                <ActionBtn key={t.label} icon={t.icon} label={t.label} title={t.title}
                  color={t.color} bgColor={t.bg} onClick={() => open(t.dialog as any)} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── I/O TOOLS ─── */}
        <Card className="border-amber-100 shadow-sm overflow-hidden">
          <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-amber-50 to-white">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
              <FileText className="w-3 h-3" /> Entrada / Salida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-3 gap-1">
              {IO_TOOLS.map((t) => (
                <ActionBtn key={t.label} icon={t.icon} label={t.label} title={t.title}
                  color={t.color} bgColor={t.bg} onClick={() => open(t.dialog as any)} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── PROJECT ─── */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-2 px-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div>
              <Label className="text-[10px] text-slate-500">Nombre</Label>
              <Input value={floorPlan.name} onChange={e => setFloorPlan(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Escala (m/pixel)</Label>
              <Input type="number" step="0.001" value={floorPlan.scale_m_per_pixel.toFixed(4)}
                onChange={e => setFloorPlan(p => ({ ...p, scale_m_per_pixel: parseFloat(e.target.value) || 0.01 }))} className="h-8 text-xs mt-0.5" />
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs mt-1 hover:bg-[#fff7ed] hover:text-[#f97316] hover:border-[#f97316] transition-colors" asChild>
              <label><Upload className="w-3 h-3 mr-1" />Cargar plano<input type="file" accept="image/*" className="hidden" onChange={onImageUpload} /></label>
            </Button>
          </CardContent>
        </Card>

        {selectedCriticalPoint && (
          <Card data-testid="f86-critical-point-editor" className="border-orange-200 shadow-sm">
            <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3 h-3" /> Punto critico F86
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div>
                <Label className="text-[10px] text-slate-500">Nombre</Label>
                <Input value={selectedCriticalPoint.name} onChange={e => updateSelected({ name: e.target.value })} className="h-8 text-xs mt-0.5" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Ocupacion T</Label>
                  <Input type="number" step="0.025" min={0} max={1} value={selectedCriticalPoint.occupancyFactor}
                    onChange={e => updateSelected({ occupancyFactor: parseFloat(e.target.value) || 0 })} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">P mSv/sem</Label>
                  <Input type="number" step="0.001" min={0} value={selectedCriticalPoint.designGoal_mSv_per_wk}
                    onChange={e => updateSelected({ designGoal_mSv_per_wk: parseFloat(e.target.value) || 0.02 })} className="h-8 text-xs mt-0.5" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Tipo</Label>
                <select
                  value={selectedCriticalPoint.pointType}
                  onChange={e => updateSelected({ pointType: e.target.value as CriticalPoint['pointType'] })}
                  className="w-full h-8 text-xs mt-0.5 rounded-md border border-input bg-background px-2"
                >
                  <option value="public">Publica</option>
                  <option value="controlled">Controlada</option>
                  <option value="poe">Punto POE</option>
                  <option value="storage">Almacen</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Nota QA</Label>
                <Input value={selectedCriticalPoint.notes ?? ''} onChange={e => updateSelected({ notes: e.target.value })} className="h-8 text-xs mt-0.5" />
              </div>
            </CardContent>
          </Card>
        )}

        {selectedBarrier && (
          <Card data-testid="cad-inline-barrier-editor" className="border-sky-200 shadow-sm">
            <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-sky-50 to-white">
              <CardTitle className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-3 h-3" /> Edicion CAD barrera
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <Input value={selectedBarrier.name} onChange={e => updateSelected({ name: e.target.value })} className="h-8 text-xs" />
              <div className="grid grid-cols-4 gap-1">
                {[
                  ['x1', selectedBarrier.x1],
                  ['y1', selectedBarrier.y1],
                  ['x2', selectedBarrier.x2],
                  ['y2', selectedBarrier.y2],
                ].map(([key, value]) => (
                  <div key={String(key)}>
                    <Label className="text-[9px] text-slate-500">{String(key).toUpperCase()}</Label>
                    <Input
                      type="number"
                      value={Number(value).toFixed(0)}
                      onChange={e => updateSelected({ [key as string]: parseFloat(e.target.value) || 0 } as Partial<Barrier>)}
                      className="h-7 text-[10px]"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedSource && (
          <Card data-testid="cad-inline-source-editor" className="border-cyan-200 shadow-sm">
            <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-cyan-50 to-white">
              <CardTitle className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3 h-3" /> Edicion CAD equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <Input value={selectedSource.name} onChange={e => updateSelected({ name: e.target.value })} className="h-8 text-xs" />
              <div className="grid grid-cols-3 gap-1">
                {[
                  ['x', selectedSource.x],
                  ['y', selectedSource.y],
                  ['rotationDeg', selectedSource.rotationDeg ?? 0],
                ].map(([key, value]) => (
                  <div key={String(key)}>
                    <Label className="text-[9px] text-slate-500">{String(key) === 'rotationDeg' ? 'ROT' : String(key).toUpperCase()}</Label>
                    <Input
                      type="number"
                      value={Number(value).toFixed(0)}
                      onChange={e => updateSelected({ [key as string]: parseFloat(e.target.value) || 0 } as Partial<FloorPlan['sources'][number]>)}
                      className="h-7 text-[10px]"
                    />
                  </div>
                ))}
              </div>
              <Input value={selectedSource.manufacturerVariant ?? 'generic'} onChange={e => updateSelected({ manufacturerVariant: e.target.value })} className="h-8 text-xs" />
            </CardContent>
          </Card>
        )}

        {selectedSource && (
          <TG108PatientModelCard source={selectedSource} onChange={tg108 => updateSelected({ tg108 })} />
        )}

        {selectedBarrier && (
          <Card data-testid="f87-barrier-preset-selector" className="border-orange-200 shadow-sm">
            <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldHalf className="w-3 h-3" /> Presets visuales F87
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {SHIELDING_PRESETS.map((preset) => {
                const active = selectedBarrier.shieldingPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`f87-preset-${preset.id}`}
                    onClick={() => {
                      setFloorPlan(prev => ({
                        ...prev,
                        barriers: prev.barriers.map(barrier => barrier.id === selectedBarrier.id ? applyShieldingPresetToBarrier(barrier, preset) : barrier),
                      }));
                    }}
                    className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors ${
                      active ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: preset.color }} />
                      <span className="text-[10px] font-bold text-slate-700 truncate">{preset.name}</span>
                      <span className="ml-auto text-[8px] text-slate-400">{preset.materialCodes.join('+')}</span>
                    </div>
                    <div className="mt-0.5 text-[8px] text-slate-500 truncate">
                      {preset.materialCodes.map((code, i) => `${code} ${preset.thicknesses_mm[i] ?? preset.thicknesses_mm[0]} mm`).join(' | ')}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {selectedBarrier?.shieldingPresetId && (
          <Card data-testid="f86-selected-barrier-preset" className="border-slate-200 shadow-sm">
            <CardContent className="p-3 text-[10px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">Preset F86 aplicado</div>
              <div>{selectedBarrier.shieldingPresetName}</div>
              <div className="font-mono text-[9px]">
                {(selectedBarrier.shieldingLayers ?? []).map(layer => `${layer.materialCode}:${layer.thickness_mm}mm`).join(' + ') || selectedBarrier.materialCode}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STATS ─── */}
        <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 p-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-md p-1.5 shadow-sm">
              <div className="text-lg font-bold text-red-500">{floorPlan.sources?.length || 0}</div>
              <div className="text-[8px] text-slate-400 font-medium">Fuentes</div>
            </div>
            <div className="bg-white rounded-md p-1.5 shadow-sm">
              <div className="text-lg font-bold text-[#f97316]">{floorPlan.barriers?.length || 0}</div>
              <div className="text-[8px] text-slate-400 font-medium">Barreras</div>
            </div>
            <div className="bg-white rounded-md p-1.5 shadow-sm">
              <div className="text-lg font-bold text-emerald-500">{floorPlan.regions?.length || 0}</div>
              <div className="text-[8px] text-slate-400 font-medium">Regiones</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
