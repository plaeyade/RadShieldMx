// Batch 8: MC Config Dialog — dual-output format selector (CSV / ROOT / BOTH)
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cloud, Settings2, FileJson, FileCode, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import type { FloorPlan } from '@/types/radshield';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; floorPlan: FloorPlan; onLaunchMC: (jobId: number, format: string) => void; }

type OutputFormat = 'csv' | 'root' | 'both';

const FORMATS: { value: OutputFormat; label: string; desc: string; size: string; icon: typeof FileJson; color: string }[] = [
  { value: 'csv', label: 'CSV ligero (default)', desc: '1-5 MB, análisis web instantáneo. Recomendado para validación rápida y dictámenes CNSNS estándar.', size: '~2 MB / 10⁶ eventos', icon: FileJson, color: 'bg-green-100 text-green-700' },
  { value: 'root', label: 'ROOT completo', desc: '20-100 MB, análisis offline avanzado. Requiere ROOT 6.30+ instalado localmente. Para colaboraciones internacionales.', size: '~40 MB / 10⁶ eventos', icon: FileCode, color: 'bg-purple-100 text-purple-700' },
  { value: 'both', label: 'Ambos formatos', desc: 'CSV para revisión web + ROOT para archivo regulatorio y colaboraciones. Doble espacio de almacenamiento.', size: '~42 MB / 10⁶ eventos', icon: Layers, color: 'bg-blue-100 text-blue-700' },
];

export default function MCConfigDialog({ open, onOpenChange, floorPlan, onLaunchMC }: Props) {
  const [particles, setParticles] = useState(1_000_000);
  const [format, setFormat] = useState<OutputFormat>('csv');
  const [jobName, setJobName] = useState(`MC_${floorPlan.name || 'Bunker'}_${new Date().toISOString().slice(0,10)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createJob = (trpc as any).simulation?.create?.useMutation?.({
    onSuccess: (data) => {
      toast.success(`Job #${data.id} creado con formato ${format.toUpperCase()}`);
      onLaunchMC(data.id, format);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(`Error al crear job: ${err.message}`);
      setIsSubmitting(false);
    }
  });

  const handleLaunch = useCallback(() => {
    setIsSubmitting(true);
    const geometryJson = JSON.stringify({
      projectId: floorPlan.id,
      name: floorPlan.name,
      sources: floorPlan.sources,
      barriers: floorPlan.barriers,
      scale: (floorPlan as any).scale_m_per_px || floorPlan.scale_m_per_pixel,
      calibration: (floorPlan as any).calibration || null,
    });
    createJob.mutate({
      projectId: floorPlan.id,
      name: jobName,
      format,
      particles: String(particles),
      geometryJson,
      modality: floorPlan.sources[0]?.modality?.id || 'LINAC',
      energy: String((floorPlan.sources[0]?.modality as any)?.maxEnergy_MeV || (floorPlan.sources[0]?.modality as any)?.energies?.[0] || 6),
    });
  }, [floorPlan, format, particles, jobName, createJob, onLaunchMC, onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-500" />
            Configurar Simulación Monte Carlo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job name */}
          <div className="space-y-1.5">
            <Label>Nombre del Job</Label>
            <Input value={jobName} onChange={e => setJobName(e.target.value)} placeholder="MC_Bunker_2026-05-01" />
          </div>

          {/* Particles */}
          <div className="space-y-1.5">
            <Label>Partículas a simular</Label>
            <div className="flex items-center gap-3">
              <Input type="number" min={100_000} max={1_000_000_000} step={100_000}
                value={particles} onChange={e => setParticles(Number(e.target.value))} />
              <span className="text-xs text-gray-500 whitespace-nowrap">{(particles / 1e6).toFixed(1)} M</span>
            </div>
            <p className="text-[10px] text-gray-400">1M = ~30s (local) | 10M = ~5min | 100M = ~1h (8 cores)</p>
          </div>

          {/* Format selector */}
          <div className="space-y-2">
            <Label>Formato de salida</Label>
            <RadioGroup value={format} onValueChange={v => setFormat(v as OutputFormat)} className="space-y-2">
              {FORMATS.map(f => (
                <div key={f.value} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${format === f.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setFormat(f.value)}>
                  <RadioGroupItem value={f.value} id={f.value} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${f.color}`}><f.icon className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-sm">{f.label}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{f.size}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Warning for ROOT */}
          {(format === 'root' || format === 'both') && (
            <div className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                ROOT requiere instalación local (~2 GB). El frontend web <strong>no</strong> incluye ROOT.
                El archivo <code>.root</code> se descarga para análisis offline con PyROOT o C++.
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center gap-2 p-2 rounded bg-gray-50 border text-xs">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>
              <strong>{jobName}</strong> | {particles.toLocaleString()} partículas | Formato: <strong>{format.toUpperCase()}</strong>
            </span>
          </div>

          <Button onClick={handleLaunch} disabled={isSubmitting} className="w-full">
            <Cloud className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Creando job...' : 'Lanzar Simulación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
