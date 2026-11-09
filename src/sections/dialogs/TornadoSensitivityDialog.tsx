import { useState, useMemo } from 'react';
import { Wind, AlertTriangle, Download } from 'lucide-react';
import DialogShell from '@/components/DialogShell';
import { espesorRequeridoHaz } from '@/lib/calculadorasNormativas';

// Fase 8a: antes K = W·(F/400)/d² sin rendimiento K¹ (mGy por paciente a 1 m) y la inversa de Archer estaba mal
// escrita (con los valores iniciales daba ln de un número negativo → NaN). Ahora el espesor de plomo es el de
// NCRP 147 (Ec. 4.3/4.8; Tabla 4.5 y Tabla B.1, «Rad Room (chest bucky)») con `espesorRequeridoHaz`, que usa la
// inversa correcta x = ln[(B^−γ + β/α)/(1 + β/α)]/(αγ). Valores iniciales: §5.3.3.1 (1.3 mm de plomo).
const PARAM_DEFS = [
  { key: 'N', name: 'Pacientes/semana', unit: '', def: 125 },
  { key: 'distance', name: 'Distancia', unit: 'm', def: 2.5 },
  { key: 'U', name: 'Factor de uso U', unit: '', def: 1 },
  { key: 'T', name: 'Ocupación T', unit: '', def: 0.2 },
  { key: 'designGoal', name: 'Meta de diseño', unit: 'μSv/sem', def: 20 },
] as const;

const calcThickness = (p: Record<string, number>): number => {
  try {
    return espesorRequeridoHaz(
      { regimen: 'diagnostico', distribucion: 'rad_room_chest_bucky', barrera: 'primaria', N_pacientes_semana: p.N, U: p.U, d_m: p.distance },
      'lead', p.designGoal / 1000, Math.min(1, p.T),
    );
  } catch { return 0; }
};

export default function TornadoSensitivityDialog({ onClose }: { onClose: () => void }) {
  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(PARAM_DEFS.map(p => [p.key, p.def]))
  );

  const base = useMemo(() => calcThickness(vals), [vals]);

  const params = useMemo(() =>
    PARAM_DEFS.map(pd => {
      const m20 = { ...vals, [pd.key]: vals[pd.key] * 0.8 };
      const p20 = { ...vals, [pd.key]: vals[pd.key] * 1.2 };
      const rm = calcThickness(m20);
      const rp = calcThickness(p20);
      const swing = Math.max(Math.abs(rm - base), Math.abs(rp - base));
      return { ...pd, rm, rp, swing };
    }).sort((a, b) => b.swing - a.swing),
    [vals, base]
  );

  const maxSwing = Math.max(...params.map(p => p.swing), 0.1);

  const exportCSV = () => {
    const csv = ['Parametro,Base,-20%,+20%,Swing_mm',
      ...params.map(p => `${p.name},${vals[p.key]},${p.rm.toFixed(3)},${p.rp.toFixed(3)},${p.swing.toFixed(3)}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Tornado_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DialogShell
      title="Análisis de sensibilidad (tornado) — NCRP 147"
      subtitle="±20 % por parámetro · plomo, Rad Room (chest bucky), Tablas 4.5 y B.1"
      gradientFrom="from-teal-600"
      gradientTo="to-emerald-700"
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={<>
        <span className="text-xs text-slate-500">NCRP 147 Ec. 4.3/4.8</span>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 text-white text-xs font-medium hover:bg-teal-700">
          <Download className="w-3.5 h-3.5" />CSV
        </button>
      </>}
    >
      {/* Inputs */}
      <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg border">
        {PARAM_DEFS.map(pd => (
          <div key={pd.key}>
            <label htmlFor={`tor-${pd.key}`} className="text-[10px] font-medium text-slate-500">{pd.name}{pd.unit ? ` (${pd.unit})` : ''}</label>
            <input id={`tor-${pd.key}`} type="number" step="any" value={vals[pd.key]} onChange={e => setVals(v => ({ ...v, [pd.key]: Number(e.target.value) }))} className="w-full mt-1 text-xs p-1.5 border rounded" />
          </div>
        ))}
      </div>

      <div className="text-center p-2 bg-blue-50 rounded border">
        <div className="text-xs text-blue-600">Espesor base de plomo (total, sin descontar preblindaje)</div>
        <div className="text-2xl font-bold font-mono text-blue-800" data-testid="tor-base">{base.toFixed(3)} mm</div>
      </div>

      {/* Tornado bars */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b text-sm font-semibold flex items-center gap-2"><Wind className="w-4 h-4" />Diagrama Tornado</div>
        <div className="p-3 space-y-1.5">
          {params.map((p, i) => {
            const lw = p.rm < base ? Math.min(((base - p.rm) / maxSwing) * 40, 40) : 0;
            const rw = p.rp > base ? Math.min(((p.rp - base) / maxSwing) * 40, 40) : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-28 text-right text-xs font-medium text-slate-700">{p.name} {i === 0 && <span className="text-amber-600 text-[9px]">(crítico)</span>}</div>
                <div className="flex-1 flex items-center h-5 relative">
                  <div className="absolute left-1/2 w-px h-full bg-slate-300" />
                  {lw > 0 && <div className="h-4 bg-red-400 rounded-l absolute" style={{ right: '50%', width: `${lw}%` }} />}
                  {rw > 0 && <div className="h-4 bg-emerald-400 rounded-r absolute" style={{ left: '50%', width: `${rw}%` }} />}
                </div>
                <div className="w-16 text-right text-[10px] font-mono">+/-{p.swing.toFixed(2)}mm</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert */}
      <div className="p-3 bg-amber-50 rounded-lg border flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-amber-800">Parámetro más crítico: {params[0]?.name}</p>
          <p className="text-amber-700">Mayor impacto en el espesor. Menos crítico: {params[params.length - 1]?.name}.</p>
        </div>
      </div>
    </DialogShell>
  );
}
