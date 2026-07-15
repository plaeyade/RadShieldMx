import { useState } from 'react';
import { X, RotateCcw, GitBranch, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Version { id: string; name: string; date: string; time: string; size: string; changes: string[]; author: string; }

const DEMO_VERSIONS: Version[] = [
  { id: 'v1', name: 'Initial Setup', date: '2026-05-28', time: '09:15', size: '12 KB', changes: ['Created project', 'Added floor plan', 'Placed 3 sources'], author: 'Dr. Martinez' },
  { id: 'v2', name: 'Barrier Design v1', date: '2026-05-28', time: '11:30', size: '18 KB', changes: ['Added 5 barriers', 'Set occupancy factors', 'Calculated shielding'], author: 'Dr. Martinez' },
  { id: 'v3', name: 'Material Update', date: '2026-05-29', time: '14:20', size: '21 KB', changes: ['Changed Wall-3 to heavy concrete', 'Updated NCRP 151 parameters'], author: 'Ing. Lopez' },
  { id: 'v4', name: 'MC Simulation', date: '2026-05-30', time: '16:45', size: '156 KB', changes: ['Ran PHITS simulation', 'Dose map generated', 'Results validated'], author: 'Dr. Martinez' },
  { id: 'v5', name: 'Current (Auto-save)', date: '2026-06-03', time: '10:00', size: '203 KB', changes: ['Barrier-2 thickness adjusted', 'Cost estimate updated'], author: 'Auto-save' },
];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onRestore?: (version: Version) => void; }

export default function VersionHistoryDialog({ open, onOpenChange, onRestore }: Props) {
  const [versions] = useState<Version[]>(DEMO_VERSIONS);
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const handleRestore = (v: Version) => {
    onRestore?.(v);
    toast.success(`Restored to ${v.name}`, { description: `Version from ${v.date} ${v.time}` });
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-[#fff7ed]">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-sm font-bold text-slate-800">Version History</h2>
          </div>
          <button aria-label="Cerrar Version History" onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {versions.map((v, i) => (
              <div key={v.id} className={`border rounded-lg p-3 transition-all cursor-pointer ${selected === v.id ? 'border-[#f97316] bg-[#fff7ed]' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => setSelected(v.id)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">v{i + 1}</span>
                    <span className="text-[12px] font-semibold text-slate-700">{v.name}</span>
                    {i === versions.length - 1 && <span className="px-1.5 py-0.5 bg-[#f97316] text-white text-[9px] rounded-full font-bold">CURRENT</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><HardDrive className="w-3 h-3" />{v.size}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{v.date} {v.time}</span>
                  <span>{v.author}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {v.changes.map((c, j) => <span key={j} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">{c}</span>)}
                </div>
                {selected === v.id && i !== versions.length - 1 && (
                  <Button size="sm" variant="outline" className="mt-2 text-[11px] gap-1 h-7" onClick={() => handleRestore(v)}>
                    <RotateCcw className="w-3 h-3" /> Restore this version
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
