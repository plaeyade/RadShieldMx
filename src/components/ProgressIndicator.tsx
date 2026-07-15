import { memo, useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressState {
  id: string; label: string; description?: string; percent: number;
  status: 'running' | 'success' | 'error' | 'cancelled'; startTime: number;
}

function PI({ progress, onCancel, onDismiss }: { progress: ProgressState; onCancel?: (id: string) => void; onDismiss?: (id: string) => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { if (progress.status !== 'running') return; const iv = setInterval(() => setElapsed(Math.round((Date.now() - progress.startTime) / 1000)), 1000); return () => clearInterval(iv); }, [progress.status, progress.startTime]);
  const cfg = { running: { ic: <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />, bc: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200' }, success: { ic: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, bc: 'bg-green-500', bg: 'bg-green-50 border-green-200' }, error: { ic: <AlertCircle className="w-3.5 h-3.5 text-red-500" />, bc: 'bg-red-500', bg: 'bg-red-50 border-red-200' }, cancelled: { ic: <X className="w-3.5 h-3.5 text-slate-400" />, bc: 'bg-slate-400', bg: 'bg-slate-50 border-slate-200' } }[progress.status];
  const ft = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return <div className={cn("w-full border rounded-md p-2.5 text-xs", cfg.bg)}>
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2">{cfg.ic}<span className="font-medium text-slate-700">{progress.label}</span>{progress.description && <span className="text-slate-400">— {progress.description}</span>}</div>
      <div className="flex items-center gap-2"><span className="text-slate-400 tabular-nums">{ft(elapsed)}</span>{progress.status !== 'running' && onDismiss && <button onClick={() => onDismiss(progress.id)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}{progress.status === 'running' && onCancel && <button onClick={() => onCancel(progress.id)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}</div>
    </div>
    <div className="w-full bg-white/60 rounded-full h-1.5"><div className={cn("h-1.5 rounded-full transition-all duration-300", cfg.bc)} style={{ width: `${progress.percent}%` }} /></div>
    <div className="text-right text-[10px] text-slate-400 mt-0.5 tabular-nums">{Math.round(progress.percent)}%</div>
  </div>;
}
export default memo(PI);
