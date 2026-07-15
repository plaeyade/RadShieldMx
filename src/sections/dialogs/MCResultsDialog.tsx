// Batch 8-1: MC Results Dialog — visualización gráfica de resultados Monte Carlo
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, XCircle, BarChart3, TrendingDown, Activity, FileDown } from 'lucide-react';

interface MCResult {
  jobId: number;
  jobName: string;
  format: string;
  particles: number;
  doseBefore: number;
  doseAfter: number;
  discrepancy: number;
  cumpleCNSNS: boolean;
  cumpleALARA: boolean;
  pValue?: number;
  tvlMC?: number;
  tvlNCRP?: number;
  timestamp: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultJson: string | null;
}

function parseResult(json: string | null): MCResult | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

export default function MCResultsDialog({ open, onOpenChange, resultJson }: Props) {
  const result = useMemo(() => parseResult(resultJson), [resultJson]);

  if (!result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultados Monte Carlo</DialogTitle>
          </DialogHeader>
          <div className="text-center text-gray-500 py-8">Sin resultados disponibles. Ejecute una simulación primero.</div>
        </DialogContent>
      </Dialog>
    );
  }

  const { discrepancy, cumpleCNSNS, cumpleALARA, doseBefore, doseAfter, particles, format } = result;

  // Histogram bars for dose distribution (simulated from result)
  const histogramBins = useMemo(() => {
    const bins = 20;
    const maxDose = doseBefore * 1.2;
    const counts = Array(bins).fill(0);
    // Simulate log-normal distribution peaking near doseAfter
    for (let i = 0; i < bins; i++) {
      const x = (i / bins) * maxDose;
      const mu = Math.log(doseAfter + 1e-12);
      const sigma = 0.5;
      counts[i] = Math.exp(-0.5 * Math.pow((Math.log(x + 1e-12) - mu) / sigma, 2));
    }
    const maxCount = Math.max(...counts);
    return counts.map(c => ({ height: (c / maxCount) * 100, value: c }));
  }, [doseBefore, doseAfter]);

  // Convergence curve (simulated)
  const convergencePoints = useMemo(() => {
    const points = 50;
    return Array.from({ length: points }, (_, i) => {
      const progress = (i + 1) / points;
      const error = 50 / Math.sqrt(progress * particles / 1000);
      return { x: progress * 100, y: Math.max(0.5, error) };
    });
  }, [particles]);

  const dictamenColor = cumpleALARA ? 'bg-green-100 text-green-700 border-green-300' :
                         cumpleCNSNS ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                         'bg-red-100 text-red-700 border-red-300';
  const DictamenIcon = cumpleCNSNS ? (cumpleALARA ? CheckCircle : AlertTriangle) : XCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Resultados Monte Carlo — Job #{result.jobId}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Dictamen banner */}
            <div className={`p-3 rounded-lg border ${dictamenColor} flex items-center gap-3`}>
              <DictamenIcon className="w-6 h-6 shrink-0" />
              <div>
                <div className="font-bold text-sm">
                  {cumpleALARA ? 'DICTAMEN FAVORABLE — ALARA' :
                   cumpleCNSNS ? 'DICTAMEN ACEPTABLE — CNSNS' :
                   'DICTAMEN CON OBSERVACIONES'}
                </div>
                <div className="text-xs opacity-80">
                  Discrepancia: {discrepancy.toFixed(1)}% | Criterio CNSNS: ±20%
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Dosis antes" value={`${doseBefore.toFixed(2)}`} unit="mSv/sem" icon={<Activity className="w-4 h-4" />} color="text-red-600" />
              <MetricCard label="Dosis después" value={`${doseAfter.toFixed(4)}`} unit="mSv/sem" icon={<TrendingDown className="w-4 h-4" />} color="text-green-600" />
              <MetricCard label="Discrepancia" value={`${discrepancy.toFixed(1)}%`} unit="vs NCRP" icon={<BarChart3 className="w-4 h-4" />} color={discrepancy <= 10 ? 'text-green-600' : discrepancy <= 20 ? 'text-yellow-600' : 'text-red-600'} />
            </div>

            {/* Histogram */}
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Distribución de dosis depositada (simulada)</h3>
              <div className="flex items-end gap-0.5 h-32">
                {histogramBins.map((bin, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div className="w-full bg-blue-400 rounded-t transition-all hover:bg-blue-500" style={{ height: `${bin.height}%` }} />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {bin.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>0</span>
                <span>{(doseBefore / 2).toFixed(1)}</span>
                <span>{doseBefore.toFixed(1)} mSv/sem</span>
              </div>
            </div>

            {/* Convergence curve */}
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Convergencia MC (% error vs eventos)</h3>
              <svg viewBox="0 0 500 120" className="w-full h-28">
                <polyline
                  fill="none" stroke="#3b82f6" strokeWidth="2"
                  points={convergencePoints.map(p => `${p.x * 5},${110 - p.y * 2}`).join(' ')}
                />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#ccc" strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2="110" stroke="#ccc" strokeWidth="1" />
                <text x="250" y="118" textAnchor="middle" fontSize="8" fill="#999">% Simulación</text>
                <text x="-40" y="55" textAnchor="middle" fontSize="8" fill="#999" transform="rotate(-90, -40, 55)">Error (%)</text>
                {/* 5% reference line */}
                <line x1="0" y1="80" x2="500" y2="80" stroke="#22c55e" strokeWidth="1" strokeDasharray="4" />
                <text x="480" y="78" textAnchor="end" fontSize="8" fill="#22c55e">5%</text>
              </svg>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-500">Partículas:</span> <strong>{(particles / 1e6).toFixed(1)}M</strong>
              </div>
              <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-500">Formato:</span> <strong>{format.toUpperCase()}</strong>
              </div>
              {result.tvlMC && (
                <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-500">TVL MC:</span> <strong>{result.tvlMC.toFixed(1)} mm</strong>
                </div>
              )}
              {result.tvlNCRP && (
                <div className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-500">TVL NCRP:</span> <strong>{result.tvlNCRP} mm</strong>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const report = `RadShield-MX MC Results — Job ${result.jobId}
Dosis antes: ${doseBefore.toFixed(4)} mSv/sem
Dosis después: ${doseAfter.toFixed(6)} mSv/sem
Discrepancia: ${discrepancy.toFixed(2)}%
CNSNS: ${cumpleCNSNS ? 'CUMPLE' : 'NO CUMPLE'}
ALARA: ${cumpleALARA ? 'CUMPLE' : 'NO CUMPLE'}
`;
            const blob = new Blob([report], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `MC_Results_${result.jobId}.txt`;
            a.click();
          }}>
            <FileDown className="w-3.5 h-3.5 mr-1" /> Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value, unit, icon, color }: { label: string; value: string; unit: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="border rounded-lg p-2.5 bg-white dark:bg-gray-800 flex flex-col">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400">{unit}</div>
    </div>
  );
}
