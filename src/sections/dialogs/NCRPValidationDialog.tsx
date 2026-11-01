import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, FileDown, Play } from 'lucide-react';
import DialogShell from '@/components/DialogShell';
import { runValidation, summarize, toCSV, CASES } from '@/lib/validation/NCRPValidationSuite';
import type { ValResult, SuiteSummary } from '@/lib/validation/NCRPValidationSuite';

export default function NCRPValidationDialog({ onClose }: { onClose: () => void }) {
  const [results, setResults] = useState<readonly ValResult[] | null>(null);
  const [cat, setCat] = useState('all');

  const run = useCallback(() => setResults(runValidation(CASES)), []);

  const summary: SuiteSummary | null = useMemo(
    () => results ? summarize(results) : null,
    [results]
  );

  const filtered = useMemo(
    () => cat === 'all' || !results ? results : results.filter(r => r.details.includes(cat)),
    [results, cat]
  );

  const cats = useMemo(
    () => results ? ['all', ...new Set(CASES.map(c => c.category))] : ['all'],
    [results]
  );

  const exportCSV = useCallback(() => {
    if (!results) return;
    const blob = new Blob([toCSV(results)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCRP_Validation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  if (!results) {
    return (
      <DialogShell title="NCRP Validation Suite" subtitle="24 casos vs tablas oficiales NCRP 147/151" gradientFrom="from-emerald-600" gradientTo="to-green-700" onClose={onClose}>
        <div className="text-center py-8">
          <button onClick={run} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
            <Play className="w-5 h-5" />Ejecutar Validacion
          </button>
          <p className="mt-3 text-sm text-slate-500">24 casos: TVL, Scatter, Archer, Leakage, CT</p>
        </div>
      </DialogShell>
    );
  }

  return (
    <DialogShell
      title="NCRP Validation Suite"
      subtitle={`${summary?.passed ?? 0}/${summary?.total ?? 0} aprobados | maxDiff=${summary?.maxDiff.toFixed(1) ?? 0}%`}
      gradientFrom="from-emerald-600"
      gradientTo="to-green-700"
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={
        <>
          <span className="text-xs text-slate-500">NCRP Validation v50.4</span>
          <div className="flex gap-2">
            <button onClick={run} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">
              <Play className="w-3.5 h-3.5" />Re-ejecutar
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium text-slate-600 hover:bg-slate-100">
              <FileDown className="w-3.5 h-3.5" />CSV
            </button>
          </div>
        </>
      }
    >
      {/* Dashboard */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-blue-50 rounded border"><div className="text-2xl font-bold text-blue-700">{summary?.total}</div><div className="text-[10px] text-slate-500">Casos</div></div>
        <div className="text-center p-2 bg-emerald-50 rounded border"><div className="text-2xl font-bold text-emerald-700">{summary?.passed}</div><div className="text-[10px] text-slate-500">OK</div></div>
        <div className="text-center p-2 bg-red-50 rounded border"><div className="text-2xl font-bold text-red-700">{summary?.failed}</div><div className="text-[10px] text-slate-500">Fail</div></div>
        <div className={`text-center p-2 rounded border ${summary?.allPassed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <div className={`text-lg font-bold ${summary?.allPassed ? 'text-emerald-700' : 'text-amber-700'}`}>{summary?.allPassed ? 'PASS' : 'REVIEW'}</div>
          <div className="text-[10px] text-slate-500">max {summary?.maxDiff.toFixed(1)}%</div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${cat === c ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}>
            {c === 'all' ? 'Todos' : c}
          </button>
        ))}
      </div>

      {/* Results table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1.5 text-left">Caso</th><th className="px-2 py-1.5 text-right">Diff%</th><th className="px-2 py-1.5">Estado</th></tr></thead>
          <tbody>{filtered?.map((r, i) => (
            <tr key={i} className={`border-t ${!r.passed ? 'bg-red-50' : ''}`}>
              <td className="px-2 py-1.5"><span className="font-mono text-[10px] text-slate-400">{r.caseId}</span> <span className="font-medium">{r.name}</span></td>
              <td className={`px-2 py-1.5 text-right font-mono font-bold ${r.passed ? 'text-emerald-600' : 'text-red-600'}`}>{r.diffPercent.toFixed(1)}%</td>
              <td className="px-2 py-1.5">{r.passed ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" />PASS</span> : <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" />FAIL</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </DialogShell>
  );
}
