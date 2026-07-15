import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

function S({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("animate-pulse bg-slate-200 rounded-md", className)} style={style} />;
}

export function FormSkeleton({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-4 p-4">
    <div className="flex items-center gap-3 mb-6">
      <S className="w-8 h-8 rounded-lg" />
      <div className="flex-1 space-y-2"><S className="w-48 h-5" /><S className="w-32 h-3" /></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-1.5"><S className="w-24 h-3" /><S className="w-full h-9" /></div>
    ))}
    <div className="flex gap-2 pt-4"><S className="w-20 h-9 ml-auto" /><S className="w-28 h-9" /></div>
  </div>;
}

export function TableSkeleton({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return <div className="space-y-3 p-4">
    <div className="flex gap-2 pb-2 border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => <S key={i} className="h-4 flex-1" />)}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-2 py-2">
        {Array.from({ length: cols }).map((_, c) => <S key={c} className="h-3 flex-1" />)}
      </div>
    ))}
  </div>;
}

export function ChartSkeleton() {
  return <div className="p-4 space-y-4">
    <S className="w-40 h-5" />
    <div className="flex items-end gap-1 h-48 pt-4">
      {Array.from({ length: 12 }).map((_, i) => <S key={i} className="flex-1 rounded-t-sm" style={{ height: `${25 + (i % 5) * 15}%` }} />)}
    </div>
    <div className="flex justify-between">{Array.from({ length: 6 }).map((_, i) => <S key={i} className="w-12 h-2" />)}</div>
  </div>;
}

export function WizardSkeleton({ steps = 4 }: { steps?: number }) {
  return <div className="p-4 space-y-4">
    <div className="flex gap-2">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center gap-2">
          <S className={`w-7 h-7 rounded-full ${i === 0 ? "bg-orange-200" : ""}`} />
          {i < steps - 1 && <S className="flex-1 h-0.5" />}
        </div>
      ))}
    </div>
    <S className="w-full h-32" />
    <div className="flex gap-2"><S className="w-24 h-9" /><S className="w-24 h-9 ml-auto" /></div>
  </div>;
}

export function ListSkeleton({ items = 6 }: { items?: number }) {
  return <div className="space-y-2 p-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2">
        <S className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1.5"><S className="w-40 h-3.5" /><S className="w-24 h-2.5" /></div>
        <S className="w-14 h-6 rounded-full" />
      </div>
    ))}
  </div>;
}

export function DialogSkeleton({ type }: { type: 'form' | 'table' | 'chart' | 'wizard' | 'list' }) {
  const C = { form: FormSkeleton, table: TableSkeleton, chart: ChartSkeleton, wizard: WizardSkeleton, list: ListSkeleton }[type];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto"><C /></div>
  </div>;
}
