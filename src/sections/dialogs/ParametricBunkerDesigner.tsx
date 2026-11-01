import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Box, ChevronRight, ChevronLeft, Wand2, Loader2 } from 'lucide-react';

interface BunkerTemplate {
  id: string;
  name: string;
  description: string;
  modality: string;
  defaults: {
    energy: number;
    workload: number;
    roomLength: number;
    roomWidth: number;
    roomHeight: number;
    mazeLength: number;
    mazeWidth: number;
    distanceToBarrier: number;
    occupancy: number;
    designGoal: number;
  };
}

const TEMPLATES: BunkerTemplate[] = [
  { id: 'linac-6mv', name: 'LINAC 6 MV — Standard', description: 'Acelerador lineal 6 MV, configuracion tipica', modality: 'TX', defaults: { energy: 6, workload: 300, roomLength: 7.5, roomWidth: 7.0, roomHeight: 4.0, mazeLength: 4.5, mazeWidth: 1.8, distanceToBarrier: 4.5, occupancy: 0.25, designGoal: 0.02 } },
  { id: 'linac-dual', name: 'LINAC Dual 6/15 MV', description: 'Acelerador dual energy con laberinto', modality: 'TX', defaults: { energy: 15, workload: 400, roomLength: 8.0, roomWidth: 7.5, roomHeight: 4.2, mazeLength: 5.0, mazeWidth: 2.0, distanceToBarrier: 5.0, occupancy: 0.25, designGoal: 0.02 } },
  { id: 'pet-ct', name: 'Sala PET-CT F-18', description: 'Unidad PET-CT con FDG', modality: 'NM', defaults: { energy: 0.511, workload: 148, roomLength: 6.0, roomWidth: 5.5, roomHeight: 3.5, mazeLength: 3.5, mazeWidth: 1.5, distanceToBarrier: 3.0, occupancy: 0.5, designGoal: 0.02 } },
  { id: 'gammaknife', name: 'Gamma Knife Perfexion', description: 'Radiocirugia con Co-60', modality: 'TX', defaults: { energy: 1.25, workload: 50, roomLength: 6.5, roomWidth: 6.5, roomHeight: 4.5, mazeLength: 4.0, mazeWidth: 1.8, distanceToBarrier: 4.0, occupancy: 0.2, designGoal: 0.02 } },
  { id: 'hdr', name: 'Braquiterapia HDR Ir-192', description: 'Sala de braquiterapia HDR', modality: 'TX', defaults: { energy: 0.38, workload: 40, roomLength: 5.5, roomWidth: 5.0, roomHeight: 3.5, mazeLength: 3.0, mazeWidth: 1.5, distanceToBarrier: 3.0, occupancy: 0.1, designGoal: 0.02 } },
  { id: 'cyclotron', name: 'Ciclotron 18 MeV', description: 'Ciclotron para produccion de FDG', modality: 'CY', defaults: { energy: 18, workload: 200, roomLength: 9.0, roomWidth: 8.0, roomHeight: 5.0, mazeLength: 6.0, mazeWidth: 2.0, distanceToBarrier: 5.0, occupancy: 0.1, designGoal: 0.02 } },
];

interface StepConfig {
  id: number;
  title: string;
  fields: Array<{ key: string; label: string; type: 'number' | 'select'; min?: number; max?: number; step?: number; options?: string[] }>;
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Seleccionar Template', fields: [] },
  { id: 2, title: 'Parametros del Equipo', fields: [
    { key: 'energy', label: 'Energia (MV)', type: 'number', min: 0.1, max: 50, step: 0.1 },
    { key: 'workload', label: 'Carga de trabajo (Gy/sem)', type: 'number', min: 1, max: 2000, step: 1 },
  ]},
  { id: 3, title: 'Dimensiones del Bunker', fields: [
    { key: 'roomLength', label: 'Longitud (m)', type: 'number', min: 3, max: 20, step: 0.1 },
    { key: 'roomWidth', label: 'Ancho (m)', type: 'number', min: 3, max: 20, step: 0.1 },
    { key: 'roomHeight', label: 'Altura (m)', type: 'number', min: 2.5, max: 8, step: 0.1 },
  ]},
  { id: 4, title: 'Laberinto y Blindaje', fields: [
    { key: 'mazeLength', label: 'Longitud laberinto (m)', type: 'number', min: 0, max: 10, step: 0.1 },
    { key: 'mazeWidth', label: 'Ancho laberinto (m)', type: 'number', min: 1, max: 3, step: 0.1 },
    { key: 'distanceToBarrier', label: 'Distancia fuente-barrera (m)', type: 'number', min: 1, max: 15, step: 0.1 },
  ]},
  { id: 5, title: 'Ocupacion y Limites', fields: [
    { key: 'occupancy', label: 'Factor de ocupacion T', type: 'number', min: 0.01, max: 1, step: 0.01 },
    { key: 'designGoal', label: 'Limite de diseno P (mSv/sem)', type: 'number', min: 0.001, max: 1, step: 0.001 },
  ]},
];

interface ParametricBunkerDesignerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerate?: (config: any) => void;
}

export default function ParametricBunkerDesigner({ open, onOpenChange, onGenerate }: ParametricBunkerDesignerProps) {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('linac-6mv');
  const [config, setConfig] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);

  const template = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  const getValue = (key: string) => {
    if (config[key] !== undefined) return config[key];
    return template.defaults[key as keyof typeof template.defaults] || 0;
  };

  const setValue = (key: string, val: number) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onGenerate?.({ template: selectedTemplate, ...config });
    }, 2000);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-blue-500" />
            Parametric Bunker Designer
            <Badge variant="outline" className="text-[10px]">6 templates</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{STEPS[step]?.title || 'Completado'}</span>
            <span className="text-xs text-slate-500">Paso {step + 1} de {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="px-6 pb-4 min-h-[250px]">
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">Seleccione un template pre-configurado. Los valores se cargaran automaticamente.</p>
              {TEMPLATES.map(t => (
                <button key={t.id} className={`w-full text-left p-3 border rounded-lg transition-all ${selectedTemplate === t.id ? 'border-blue-300 bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => setSelectedTemplate(t.id)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.name}</span>
                    <Badge className="text-[9px] h-4">{t.modality}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          )}

          {step > 0 && STEPS[step] && (
            <div className="space-y-3">
              {STEPS[step].fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-slate-700">{field.label}</label>
                  <Input
                    type="number"
                    value={getValue(field.key)}
                    onChange={e => setValue(field.key, Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className="h-8 text-xs mt-0.5"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview summary */}
        <div className="px-6 pb-3 bg-slate-50 rounded-lg mx-6 mb-2 p-3">
          <h4 className="text-[10px] font-semibold text-slate-600 uppercase mb-1">Configuracion actual</h4>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <span>Template: <strong>{template.name}</strong></span>
            <span>Energia: <strong>{getValue('energy')} MV</strong></span>
            <span>Workload: <strong>{getValue('workload')} Gy/sem</strong></span>
            <span>Dimensiones: <strong>{getValue('roomLength')}x{getValue('roomWidth')}x{getValue('roomHeight')}m</strong></span>
            <span>Laberinto: <strong>{getValue('mazeLength')}x{getValue('mazeWidth')}m</strong></span>
            <span>Ocupacion: <strong>{getValue('occupancy')}</strong></span>
          </div>
        </div>

        <div className="px-6 pb-4 flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />Anterior
          </Button>
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setStep(step + 1)}>
              Siguiente<ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button size="sm" variant="default" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
              {generating ? 'Generando...' : 'Generar Bunker'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
