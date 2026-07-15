import { useState, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Play, Calculator, BookOpen, Layers, BarChart3, FileText, ShieldCheck, Pencil,
  Scan, Cpu, Atom, FileImage, FolderOpen, Wand2, Settings, Database,
  ClipboardCheck, GitBranch, TrendingDown, Cloud, Zap, Construction,
  ArrowUpDown, Wind, CalendarDays, Table, Library, Brain, Hexagon,
  FlaskConical, Crosshair, Ruler, FileCheck, Box, Gauge, DollarSign,
  Upload, Download, FileDown, AlertTriangle, Sun, Moon, Undo, Redo,
  Globe, Activity, Keyboard, Search, FileBarChart, HelpCircle, Map,
  Flame, Grid3x3, ChevronRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CommandAction {
  id: string;
  name: string;
  icon: LucideIcon;
  shortcut?: string;
  group: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandAction[];
}

export const DEFAULT_COMMANDS = (handlers: Record<string, () => void>): CommandAction[] => [
  // Calculo
  { id: 'calc', name: 'Calcular Blindaje', icon: Play, shortcut: 'F5', group: 'Calculo', action: handlers.onCalculate },
  { id: 'shield', name: 'Calculadora Blindaje Avanzado', icon: Calculator, group: 'Calculo', action: handlers.onShieldingCalculator },
  { id: 'wizard', name: 'Wizard por Equipo', icon: Wand2, group: 'Calculo', action: handlers.onEquipmentShieldingWizard },
  { id: 'quick', name: 'Barrera Rapida', icon: Zap, shortcut: 'Ctrl+B', group: 'Calculo', action: handlers.onQuick },
  { id: 'maze', name: 'Laberinto', icon: Construction, group: 'Calculo', action: handlers.onMaze },
  { id: 'floor', name: 'Suelo / Techo', icon: ArrowUpDown, group: 'Calculo', action: handlers.onFloorCeiling },
  { id: 'neutron', name: 'Neutrones', icon: Atom, group: 'Calculo', action: handlers.onNeutron },
  { id: 'cbct', name: 'CBCT / IGRT', icon: Scan, group: 'Calculo', action: handlers.onCBCTIGRT },
  { id: 'vent', name: 'Ventilacion', icon: Wind, group: 'Calculo', action: handlers.onVentilation },
  { id: 'uncert', name: 'Incertidumbre', icon: BarChart3, group: 'Calculo', action: handlers.onUncertainty },
  { id: 'season', name: 'Ajuste Estacional', icon: CalendarDays, group: 'Calculo', action: handlers.onSeasonal },
  // Simulacion
  { id: 'mc', name: 'Monte Carlo Local', icon: Cpu, group: 'Simulacion', action: handlers.onMC },
  { id: 'mccloud', name: 'MC en Cloud', icon: Cloud, group: 'Simulacion', action: handlers.onMCCloud },
  { id: 'mcsim', name: 'Configurar Simulacion MC', icon: Cpu, group: 'Simulacion', action: handlers.onMonteCarloSim },
  { id: 'cyclone', name: 'Ciclotron IBA KIUBE', icon: Atom, group: 'Simulacion', action: handlers.onCycloneKIUBE },
  // Validacion
  { id: 'validate', name: 'Validar Plano', icon: FileCheck, group: 'Validacion', action: handlers.onPlanValidator },
  { id: 'checklist', name: 'Checklist CNSNS', icon: ClipboardCheck, group: 'Validacion', action: handlers.onChecklistCNSNS },
  { id: 'whatif', name: 'Escenarios What-If', icon: GitBranch, group: 'Validacion', action: handlers.onScenarioAnalysis },
  { id: 'dash', name: 'Dashboard Ejecutivo', icon: BarChart3, group: 'Validacion', action: handlers.onDashboard },
  // Reportes
  { id: 'memoria', name: 'Memoria Analitica', icon: BookOpen, shortcut: 'Ctrl+M', group: 'Reportes', action: handlers.onMemoriaWizard },
  { id: 'cnsns', name: 'Reporte CNSNS', icon: FileText, group: 'Reportes', action: handlers.onCNSNS },
  { id: 'pdf', name: 'Exportar PDF', icon: FileDown, shortcut: 'Ctrl+P', group: 'Reportes', action: handlers.onPDF },
  { id: 'maintenance', name: 'Registro Mantenimiento', icon: CalendarDays, group: 'Reportes', action: handlers.onMaintenanceLog },
  { id: 'loganalysis', name: 'Log File Analysis', icon: FileBarChart, group: 'Reportes', action: handlers.onLogFileAnalysis },
  // Visualizacion
  { id: 'dxf', name: 'Visor DXF', icon: Layers, group: 'Visualizacion', action: handlers.onDXFViewer },
  { id: '3d', name: '3D Viewer', icon: Box, group: 'Visualizacion', action: handlers.on3D },
  { id: 'dicom', name: 'SmartSearch DICOM', icon: Search, group: 'Visualizacion', action: handlers.onSmartSearchDICOM },
  { id: 'isodosis', name: 'Curvas Isodosis', icon: Map, group: 'Visualizacion', action: handlers.onIsodosisViewer },
  { id: 'dose3d', name: '3D Dose Mapping', icon: Grid3x3, group: 'Visualizacion', action: handlers.onDoseMapping3D },
  { id: 'heatmap', name: 'Heat Map Avanzado', icon: Flame, group: 'Visualizacion', action: handlers.onHeatMapViewer },
  // Referencias
  { id: 'equiplib', name: 'Biblioteca de Equipos', icon: Library, group: 'Referencias', action: handlers.onEquipmentLibrary },
  { id: 'reflib', name: 'Biblioteca de Referencias', icon: BookOpen, group: 'Referencias', action: handlers.onReferenceLibrary },
  { id: 'biblio', name: 'Bibliografia Validada', icon: BookOpen, group: 'Referencias', action: handlers.onBibliography },
  { id: 'ncrp', name: 'Tablas NCRP 151', icon: Table, group: 'Referencias', action: handlers.onNCRP151Tables },
  { id: 'epa', name: 'EPA FGR 14', icon: BookOpen, group: 'Referencias', action: handlers.onEPA },
  { id: 'shleien', name: 'Handbook Shleien', icon: BookOpen, group: 'Referencias', action: handlers.onShleien },
  { id: 'gk', name: 'Gamma Knife', icon: Brain, group: 'Referencias', action: handlers.onGammaKnife },
  { id: 'hdr', name: 'Braquiterapia Co-60', icon: Hexagon, group: 'Referencias', action: handlers.onBraquiCo60 },
  { id: 'versa', name: 'Versa HD 15MV', icon: Zap, group: 'Referencias', action: handlers.onVersaHD },
  { id: 'icru57', name: 'ICRU 57', icon: Atom, group: 'Referencias', action: handlers.onICRU57 },
  { id: 'icru96', name: 'ICRU 96', icon: FlaskConical, group: 'Referencias', action: handlers.onICRU96 },
  { id: 'layout', name: 'Layouts de Bunkers', icon: Ruler, group: 'Referencias', action: handlers.onLayoutBunker },
  // Proyecto
  { id: 'projects', name: 'Proyectos', icon: FolderOpen, shortcut: 'Ctrl+O', group: 'Proyecto', action: handlers.onProjects },
  { id: 'import', name: 'Importar CSV', icon: Upload, group: 'Proyecto', action: handlers.onBatchImport },
  { id: 'export', name: 'Exportar', icon: Download, group: 'Proyecto', action: handlers.onExport },
  { id: 'techspec', name: 'Especificaciones Tecnicas', icon: Settings, group: 'Proyecto', action: handlers.onTechSpecs },
  { id: 'audit', name: 'Audit Trail', icon: Activity, group: 'Proyecto', action: handlers.onAuditTrail },
  // Herramientas adicionales
  { id: 'sketch', name: 'Croquis / Sketch Pad', icon: Pencil, group: 'Herramientas', action: handlers.onSketchPad },
  { id: 'cadimport', name: 'Importar Geometrias CAD', icon: Upload, group: 'Herramientas', action: handlers.onCADImport },
  { id: 'examples', name: 'Wizard de Ejemplos', icon: Wand2, group: 'Herramientas', action: handlers.onExampleWizard },
  { id: 'parametric', name: 'Parametric Bunker Designer', icon: Box, group: 'Herramientas', action: handlers.onParametricBunker },
  { id: 'mlpredict', name: 'ML Shielding Predictor', icon: Brain, group: 'Calculo', action: handlers.onMLPrediction },
  { id: 'cnsnsreport', name: 'Reporte CNSNS Automatico', icon: FileText, group: 'Reportes', action: handlers.onCNSNSAutoReport },
  { id: 'keyboard', name: 'Configurar Atajos', icon: Keyboard, group: 'Utilidades', action: handlers.onKeyboardConfig },
  // Utilidades
  { id: 'shortcuts', name: 'Atajos de Teclado', icon: Keyboard, group: 'Utilidades', action: handlers.onKeyboardShortcuts },
  { id: 'dark', name: 'Toggle Dark Mode', icon: Sun, group: 'Utilidades', action: handlers.onDarkModeToggle },
  { id: 'lang', name: 'Cambiar Idioma ES/EN', icon: Globe, group: 'Utilidades', action: handlers.onLangToggle },
  { id: 'help', name: 'Ayuda / Tutorial', icon: HelpCircle, group: 'Utilidades', action: handlers.onTutorial },
];

export default function CommandPalette({ open, onOpenChange, actions }: CommandPaletteProps) {
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('radshield_cmd_recent') || '[]'); } catch { return []; }
  });

  // Group actions by group
  const grouped = useMemo(() => {
    const g: Record<string, CommandAction[]> = {};
    actions.forEach(a => { if (!g[a.group]) g[a.group] = []; g[a.group].push(a); });
    return g;
  }, [actions]);

  const handleSelect = (action: CommandAction) => {
    onOpenChange(false);
    action.action();
    // Add to recent
    setRecentCommands(prev => {
      const next = [action.id, ...prev.filter(id => id !== action.id)].slice(0, 5);
      localStorage.setItem('radshield_cmd_recent', JSON.stringify(next));
      return next;
    });
  };

  const recentActions = useMemo(() => {
    return recentCommands.map(id => actions.find(a => a.id === id)).filter(Boolean) as CommandAction[];
  }, [recentCommands, actions]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <Command>
          <CommandInput placeholder="Escribe para buscar comandos..." autoFocus />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No se encontraron comandos.</CommandEmpty>
            {recentActions.length > 0 && (
              <CommandGroup heading="Recientes">
                {recentActions.map(action => (
                  <CommandItem key={action.id} onSelect={() => handleSelect(action)} className="gap-2">
                    <action.icon className="w-4 h-4" />
                    <span>{action.name}</span>
                    {action.shortcut && (
                      <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">{action.shortcut}</kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            {Object.entries(grouped).map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map(action => (
                  <CommandItem key={action.id} onSelect={() => handleSelect(action)} className="gap-2 cursor-pointer">
                    <action.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{action.name}</span>
                    {action.shortcut && (
                      <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">{action.shortcut}</kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
