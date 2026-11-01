// Fase 8: Simulacion Monte Carlo en la nube — Batch 8: dual-output CSV/ROOT/BOTH
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/input';
import '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cloud, Play, CheckCircle, Clock, Cpu, AlertTriangle, FileJson, FileCode, Layers } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import { SyntheticResultBanner } from '@/components/SyntheticResultBanner';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; projectId: string; format: string; particles: number; jobName: string; }

type SimStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  running: { label: 'Ejecutando', color: 'bg-blue-100 text-blue-700', icon: Cpu },
  done: { label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
};

const FORMAT_ICON: Record<string, typeof FileJson> = {
  csv: FileJson,
  root: FileCode,
  both: Layers,
};

function runMockSimulation(jobId: number, particles: number, format: string, onProgress: (p: number) => void): Promise<{ doseBefore: number; doseAfter: number; discrepancy: number }> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5 + 2;
      if (progress > 100) progress = 100;
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        resolve({
          doseBefore: 12.5 + Math.random() * 5,
          doseAfter: 0.015 + Math.random() * 0.01,
          discrepancy: 5 + Math.random() * 15,
        });
      }
    }, particles > 1_000_000 ? 200 : 500);
  });
}

export default function MCCloudDialog({ open, onOpenChange, projectId, format, particles, jobName }: Props) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  // Poll jobs from backend
  const jobsQuery = (trpc as any).simulation?.list?.useQuery?.(
    { projectId },
    { enabled: open && !!user?.unionId, refetchInterval: 5000 }
  );

  const updateStatus = (trpc as any).simulation?.updateStatus?.useMutation?.();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (jobsQuery.data) {
      setJobs(jobsQuery.data);
    }
  }, [jobsQuery.data]);

  const handleRun = useCallback(async () => {
    if (!user?.unionId) { toast.error('Inicia sesión para ejecutar MC'); return; }
    setIsRunning(true); setProgress(0);

    // Create job in backend
    const geometryJson = JSON.stringify({ projectId, placeholder: true });
    const createResult = await (trpc as any).simulation?.create?.useMutation?.().mutateAsync?.({
      projectId, name: jobName, format: format as any, particles: String(particles), geometryJson
    });

    const jobId = createResult.id;
    setActiveJobId(jobId);

    // Update to running
    await updateStatus.mutateAsync({ id: jobId, status: 'running' });

    // Run mock simulation (in production: call HPC API)
    const result = await runMockSimulation(jobId, particles, format, setProgress);

    // Generate report based on format
    const report = generateReport(jobId, particles, format, result);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Update to done with results
    const summary = JSON.stringify({
      doseBefore: result.doseBefore,
      doseAfter: result.doseAfter,
      discrepancy: result.discrepancy,
      cumpleCNSNS: result.discrepancy <= 20,
      cumpleALARA: result.discrepancy <= 10,
      format,
      particles,
      timestamp: new Date().toISOString(),
    });

    await updateStatus.mutateAsync({
      id: jobId,
      status: 'done',
      resultSummaryJson: summary,
      // In production: resultCsvUrl and resultRootUrl would be S3 URLs
    });

    // Download report
    const a = document.createElement('a');
    a.href = url;
    a.download = `MC_Cloud_${format}_${jobId}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setIsRunning(false);
    toast.success(`Simulación #${jobId} completada (${format.toUpperCase()})`);
    utils.simulation.list.invalidate({ projectId });
  }, [user, projectId, format, particles, jobName, updateStatus, utils]);

  const generateReport = (jobId: number, particles: number, format: string, result: any) => {
    const isRoot = format === 'root' || format === 'both';
    return `# RadShield-MX — REPORTE DE SIMULACION MC
Job ID: ${jobId}
Formato: ${format.toUpperCase()}
Particulas: ${particles.toLocaleString()}
Estado: SIMULACION DEMOSTRATIVA CLIENTE-SIDE
${isRoot ? '\nNOTA: El archivo .root requiere analisis offline con ROOT 6.30+ o PyROOT.\nInstrucciones: root -l RadShieldMX_Sim.root' : ''}

ADVERTENCIA REGULATORIA:
Este reporte fue generado con un simulador de demostracion interno.
Los valores son pseudoaleatorios y NO representan una simulacion Monte Carlo real.
Para cumplimiento CNSNS, ejecute GEANT4 o GATE con los macros del modulo Fase 4.

RESULTADOS DEMO:
- Dosis antes blindaje: ${result.doseBefore.toFixed(4)} mSv/sem
- Dosis despues blindaje: ${result.doseAfter.toFixed(6)} mSv/sem
- Discrepancia analitico vs MC (demo): ${result.discrepancy.toFixed(2)}%
- Criterio CNSNS (±20%): ${result.discrepancy <= 20 ? 'CUMPLE (en demo)' : 'NO CUMPLE (en demo)'}
- Criterio ALARA (<10%): ${result.discrepancy <= 10 ? 'EXCELENTE (en demo)' : result.discrepancy <= 20 ? 'ACEPTABLE (en demo)' : 'REVISAR (en demo)'}

${isRoot ? 'FORMATO ROOT:\n- Archivo .root generado (placeholder)\n- TTree: Shielding con branches Edep_MeV, X_mm, Y_mm, Z_mm, MaterialID\n- Analisis sugerido: Shielding->Draw("Edep_MeV"); Shielding->Draw("Y_mm:X_mm","colz");' : 'FORMATO CSV:\n- Archivo CSV comprimido con event-by-event data\n- Columnas: Edep_MeV, X_mm, Y_mm, Z_mm, MaterialID, EventID\n- Analisis: pandas.read_csv() o numpy.loadtxt()' }

Para simulacion REAL:
1. Genere macros con el modulo "Macro GEANT4" (Fase 4)
2. Ejecute en cluster HPC con GEANT4 11.2 + G4EmLivermorePhysics
3. Seleccione formato CSV (default) o ROOT (opt-in) segun necesidad
4. Suba resultados al modulo "Validacion MC" para comparacion analitica
`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <SyntheticResultBanner />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Monte Carlo Cloud — Resultados
          </DialogTitle>
        </DialogHeader>

        {/* Active simulation */}
        {isRunning && (
          <div className="space-y-2 p-3 rounded-lg border bg-blue-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ejecutando Job #{activeJobId}</span>
              <Badge variant="outline"><Cpu className="w-3 h-3 mr-1" />{progress.toFixed(0)}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">Formato: {format.toUpperCase()} | {(particles/1e6).toFixed(1)}M partículas</p>
          </div>
        )}

        {/* Run button */}
        {!isRunning && (
          <Button onClick={handleRun} className="w-full">
            <Play className="w-4 h-4 mr-1.5" />
            Ejecutar Simulación MC ({format.toUpperCase()})
          </Button>
        )}

        {/* Job history */}
        <div className="flex-1 overflow-auto border rounded-md">
          <div className="p-2 space-y-1.5">
            <h3 className="text-xs font-semibold text-gray-500 px-1">Historial de Jobs</h3>
            {jobs.length === 0 && <div className="text-center text-gray-400 text-sm py-4">Sin jobs previos</div>}
            {jobs.map(job => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const FIcon = FORMAT_ICON[job.format] || FileJson;
              return (
                <div key={job.id} className="flex items-start gap-2 p-2 rounded border text-sm hover:bg-gray-50">
                  <div className={`mt-0.5 p-1 rounded ${cfg.color}`}><Icon className="w-3.5 h-3.5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">#{job.id}</span>
                      <Badge variant="outline" className="text-[9px] h-4"><FIcon className="w-3 h-3 mr-0.5" />{job.format.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-[9px] h-4">{cfg.label}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {job.name} | {(Number(job.particles)/1e6).toFixed(1)}M partículas
                      {job.completedAt && ` | ${new Date(job.completedAt).toLocaleString('es-MX')}`}
                    </div>
                    {job.resultSummaryJson && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        {(() => { try { const r = JSON.parse(job.resultSummaryJson); return `Discrepancia: ${r.discrepancy?.toFixed(1)}% | CNSNS: ${r.cumpleCNSNS ? 'CUMPLE' : 'NO'}`; } catch { return ''; } })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
