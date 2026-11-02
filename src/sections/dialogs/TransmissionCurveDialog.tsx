/**
 * TransmissionCurveDialog — Recomendación B.6
 * Importa y visualiza curvas de transmisión medidas de certificados del fabricante.
 * 
 * Fundamento: Los valores HVL/TVL del fabricante pueden diferir de los
 * valores nominales por variaciones de lote, temperatura, y envejecimiento.
 * NCRP 147 §4.3: "Transmission curves from the manufacturer should be used
 * when available. If not, the values in Table 4.1 may be used."
 * Importancia: Diferencias de 10-15% en HVL son comunes entre lotes de plomo.
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Upload, Download } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface TransmissionPoint { thickness_mm: number; transmission: number; source: 'nominal' | 'measured'; }

const NOMINAL_PB_6MV: TransmissionPoint[] = [
  { thickness_mm: 0, transmission: 1.0, source: 'nominal' },
  { thickness_mm: 1, transmission: 0.35, source: 'nominal' },
  { thickness_mm: 2, transmission: 0.12, source: 'nominal' },
  { thickness_mm: 3, transmission: 0.042, source: 'nominal' },
  { thickness_mm: 4, transmission: 0.015, source: 'nominal' },
  { thickness_mm: 5, transmission: 0.005, source: 'nominal' },
  { thickness_mm: 6, transmission: 0.002, source: 'nominal' },
  { thickness_mm: 8, transmission: 0.0002, source: 'nominal' },
];

export default function TransmissionCurveDialog({ open, onClose }: Props) {
  const [measuredPoints, setMeasuredPoints] = useState<TransmissionPoint[]>([]);
  const [hvlMeasured, setHvlMeasured] = useState<number | null>(null);
  const [materialName, setMaterialName] = useState('Lead PB');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [testDate, setTestDate] = useState('');


  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    const points: TransmissionPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const [t, tr] = lines[i].split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(t) && !isNaN(tr)) points.push({ thickness_mm: t, transmission: tr, source: 'measured' });
    }
    setMeasuredPoints(points);
    // Calculate HVL from first measured point
    if (points.length > 0) {
      const hvl = points.find(p => p.transmission <= 0.5)?.thickness_mm || points[0].thickness_mm;
      setHvlMeasured(hvl);
    }
    toast.success(`${points.length} puntos importados`);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => parseCSV(ev.target?.result as string);
    reader.readAsText(file);
  }, [parseCSV]);

  const exportTemplate = () => {
    const csv = 'thickness_mm,transmission\n0,1.0\n1,0.38\n2,0.14\n3,0.05\n4,0.018\n5,0.006\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transmission_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Transmission Curve Import (HVL/TVL Certificates)
            <Badge variant="outline" className="text-[10px]">B.6</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-[11px] text-violet-700">
          <b>NCRP 147 §4.3:</b> Importa curvas de transmisión medidas de certificados
          del fabricante. Las diferencias de 10-15% en HVL entre lotes son comunes.
          Se recomienda usar valores medidos cuando estén disponibles.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Material</Label><Input value={materialName} onChange={e => setMaterialName(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Fabricante</Label><Input value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="h-8 text-xs" placeholder="Ej: Raybloc, Nelco..." /></div>
          <div><Label className="text-[11px]">No. de lote</Label><Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-[11px]">Fecha de prueba</Label><Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} className="h-8 text-xs" /></div>
        </div>

        <div className="flex gap-2">
          <Label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-violet-400 transition-colors">
              <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500">Click para subir CSV (thickness_mm,transmission)</span>
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </Label>
          <Button variant="outline" size="sm" className="text-[10px] h-auto" onClick={exportTemplate}>
            <Download className="w-3 h-3 mr-1" /> Template
          </Button>
        </div>

        {/* Simple visual comparison */}
        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="text-xs font-semibold mb-2">Comparación Nominal vs Medido</div>
          <div className="h-32 flex items-end gap-0.5">
            {Array.from({ length: 20 }, (_, i) => {
              const t = i * 0.5;
              const nominal = NOMINAL_PB_6MV.find(p => p.thickness_mm >= t)?.transmission || 0;
              const measured = measuredPoints.find(p => Math.abs(p.thickness_mm - t) < 0.3)?.transmission;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  {measured !== undefined && (
                    <div className="w-full bg-red-400 rounded-t" style={{ height: `${measured * 80}px` }} title={`Measured: ${measured.toFixed(3)} @ ${t}mm`} />
                  )}
                  <div className="w-full bg-blue-400 rounded-t" style={{ height: `${nominal * 80}px` }} title={`Nominal: ${nominal.toFixed(3)} @ ${t}mm`} />
                  <div className="text-[6px] text-slate-400">{t.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-1 text-[9px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded" /> Nominal NCRP 147</span>
            {measuredPoints.length > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded" /> Medido</span>}
          </div>
        </div>

        {hvlMeasured && (
          <div className="bg-white rounded-lg border p-3 text-center">
            <div className="text-[9px] text-slate-500">HVL medido (importado)</div>
            <div className="text-lg font-bold text-violet-600">{hvlMeasured.toFixed(2)} mm Pb</div>
            <div className="text-[9px] text-slate-400">Nominal: 1.55 mm Pb @ 6 MV</div>
          </div>
        )}

        <div className="text-[10px] text-slate-500">
          <b>Formato CSV requerido:</b> Primera fila: thickness_mm,transmission. Filas siguientes: valores numéricos.
          <br/>Referencia: NCRP 147 (2004) §4.3, Table 4.1 — Half-Value Layers.
        </div>
      </DialogContent>
    </Dialog>
  );
}
