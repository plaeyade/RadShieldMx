import { useState, useRef } from 'react';
import { X, Upload, Scan, Layers, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RTStructure { name: string; color: string; type: string; volume: string; contours: number; }

const DEMO_STRUCTURES: RTStructure[] = [
  { name: 'PTV (Prostate)', color: '#ef4444', type: 'Target', volume: '42.3 cc', contours: 24 },
  { name: 'CTV', color: '#f97316', type: 'Target', volume: '35.1 cc', contours: 24 },
  { name: 'Bladder', color: '#3b82f6', type: 'OAR', volume: '180.5 cc', contours: 24 },
  { name: 'Rectum', color: '#22c55e', type: 'OAR', volume: '65.2 cc', contours: 24 },
  { name: 'Femoral Heads', color: '#a855f7', type: 'OAR', volume: '95.8 cc', contours: 48 },
  { name: 'Small Bowel', color: '#eab308', type: 'OAR', volume: '210.3 cc', contours: 30 },
];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function DICOMRTSTRUCTDialog({ open, onOpenChange }: Props) {
  const [imported, setImported] = useState(false);
  const [structures] = useState<RTStructure[]>(DEMO_STRUCTURES);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    setImported(true);
    toast.success('RTSTRUCT imported', { description: '6 structures loaded from Eclipse TPS' });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">DICOM RTSTRUCT Import</h2>
          </div>
          <button aria-label="Cerrar DICOM RTSTRUCT Import" onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Upload Panel */}
          <div className="w-64 border-r border-slate-200 p-4 space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[11px] text-slate-500">Import RTSTRUCT.dcm</p>
              <input ref={fileRef} type="file" accept=".dcm" className="hidden" onChange={handleImport} />
              <Button size="sm" variant="outline" className="mt-2 text-[11px]" onClick={() => fileRef.current?.click()}>Browse</Button>
            </div>
            <div className="text-[9px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-500">Supported TPS:</p>
              <p>• Varian Eclipse</p>
              <p>• Elekta Monaco</p>
              <p>• Philips Pinnacle</p>
              <p>• RayStation</p>
            </div>
          </div>

          {/* Structures Panel */}
          <div className="flex-1 overflow-auto p-4">
            {!imported ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Scan className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Import a DICOM RTSTRUCT file to view contours</p>
                <p className="text-[11px] mt-1">Supports Eclipse, Monaco, Pinnacle, RayStation</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-600">{structures.length} structures loaded</p>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]">Export to Shielding</Button>
                </div>
                {structures.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700">{s.name}</p>
                      <p className="text-[9px] text-slate-400">{s.type} — {s.contours} contours</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-mono text-slate-600">{s.volume}</p>
                      <p className="text-[9px] text-slate-400">Volume</p>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[10px] text-blue-700">
                  <p className="font-semibold mb-1">Shielding Calculation:</p>
                  <p>• PTV distance to barrier: 3.2 m</p>
                  <p>• Estimated dose at barrier: 0.45 mGy/wk</p>
                  <p>• Required Pb: 2.35 mm</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
