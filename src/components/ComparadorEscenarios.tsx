/**
 * Fase 9 — comparador de escenarios del proyecto (CompareScenarios y CompareMode).
 *
 * Un escenario es una copia del plano que el usuario guarda (`useEscenariosStore`). Se compara A contra B (otro
 * escenario o el plano actual) barrera por barrera: espesor requerido por el motor, instalado y verificación
 * (`compararPlanos`). No hay costos ni dosis inventados: el costo depende de la altura de los muros, que el plano no
 * guarda, y la dosis tras la barrera la da el cálculo de cada escenario.
 */
import { useState } from 'react';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEscenariosStore } from '@/stores/escenariosStore';
import { ACTUAL } from '@/hooks/useComparacionEscenarios';
import { deltaMm as delta, mmEntero as mm, type ComparacionPlanos } from '@/lib/estadoProyecto';
import type { FilaVerificacion } from '@/lib/verificacionBlindaje';

const ESTADO_CLASE: Record<string, string> = { CUMPLE: 'text-emerald-700', NO_CUMPLE: 'text-red-700' };

function Estado({ f }: { f: FilaVerificacion | null }) {
  if (!f) return <span className="text-slate-400">no existe</span>;
  return <span className={ESTADO_CLASE[f.estado] ?? 'text-amber-700'}>{f.estado.replace('_', ' ')}</span>;
}

export function GestorEscenarios() {
  const actual = useCanvasStore((s) => s.floorPlan);
  const { escenarios, guardar, eliminar } = useEscenariosStore();
  const [nombre, setNombre] = useState('');
  return (
    <div className="rounded-lg border p-3 text-xs">
      <div className="mb-2 flex items-center gap-2">
        <input aria-label="Nombre del escenario" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Escenario ${escenarios.length + 1}`} className="h-7 flex-1 rounded border px-2" />
        <button type="button" data-testid="guardar-escenario" onClick={() => { guardar(nombre, actual); setNombre(''); }} className="flex h-7 items-center gap-1 rounded bg-violet-600 px-2 font-medium text-white hover:bg-violet-700">
          <Save className="h-3.5 w-3.5" /> Guardar plano actual
        </button>
      </div>
      {escenarios.length === 0 ? (
        <p className="text-slate-500">No hay escenarios guardados. Guarde el plano actual, modifíquelo (material, espesor, carga) y recalcule para comparar.</p>
      ) : (
        <ul className="space-y-1">
          {escenarios.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
              <span><strong>{e.nombre}</strong> · {new Date(e.fecha).toLocaleString('es-MX')} · {e.plano.barriers.length} barreras</span>
              <button type="button" aria-label={`Eliminar ${e.nombre}`} onClick={() => eliminar(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SelectorEscenario({ etiqueta, valor, onCambio, incluirActual }: { etiqueta: string; valor: string; onCambio: (v: string) => void; incluirActual: boolean }) {
  const escenarios = useEscenariosStore((s) => s.escenarios);
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="font-semibold">{etiqueta}</span>
      <select aria-label={`Escenario ${etiqueta}`} value={valor} onChange={(e) => onCambio(e.target.value)} className="h-7 rounded border px-2">
        {incluirActual && <option value={ACTUAL}>Plano actual</option>}
        {escenarios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
    </label>
  );
}

export function TablaComparacion({ c, nombreA, nombreB }: { c: ComparacionPlanos; nombreA: string; nombreB: string }) {
  const r = [
    { label: 'Barreras', a: c.resumenA.barreras, b: c.resumenB.barreras },
    { label: 'Calculadas', a: c.resumenA.calculadas, b: c.resumenB.calculadas },
    { label: 'Cumplen', a: c.resumenA.cumplen, b: c.resumenB.cumplen },
    { label: 'No cumplen', a: c.resumenA.noCumplen, b: c.resumenB.noCumplen },
    { label: 'Requerido máx. (mm)', a: c.resumenA.requeridoMax_mm, b: c.resumenB.requeridoMax_mm },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {r.map((x) => (
          <div key={x.label} className="rounded-lg bg-slate-50 p-2 text-xs">
            <div className="text-[10px] text-slate-500">{x.label}</div>
            <div className="mt-1 flex items-center gap-1 font-mono font-bold"><span>{x.a ?? '—'}</span><ArrowRight className="h-3 w-3 text-slate-400" /><span>{x.b ?? '—'}</span></div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table data-testid="tabla-comparacion" className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1.5 text-left">Barrera</th>
              <th className="px-2 py-1.5 text-right">Req. {nombreA}</th>
              <th className="px-2 py-1.5 text-right">Req. {nombreB}</th>
              <th className="px-2 py-1.5 text-right">Δ req.</th>
              <th className="px-2 py-1.5 text-right">Inst. {nombreA}</th>
              <th className="px-2 py-1.5 text-right">Inst. {nombreB}</th>
              <th className="px-2 py-1.5 text-right">Δ inst.</th>
              <th className="px-2 py-1.5 text-left">Estado A → B</th>
            </tr>
          </thead>
          <tbody>
            {c.filas.map((f, i) => (
              <tr key={`${f.barrera}-${i}`} className="border-t">
                <td className="px-2 py-1 font-medium">{f.barrera}</td>
                <td className="px-2 py-1 text-right font-mono">{mm(f.a?.requerido_mm)}</td>
                <td className="px-2 py-1 text-right font-mono">{mm(f.b?.requerido_mm)}</td>
                <td className="px-2 py-1 text-right font-mono">{delta(f.deltaRequerido_mm)}</td>
                <td className="px-2 py-1 text-right font-mono">{mm(f.a?.instalado_mm)}</td>
                <td className="px-2 py-1 text-right font-mono">{mm(f.b?.instalado_mm)}</td>
                <td className="px-2 py-1 text-right font-mono">{delta(f.deltaInstalado_mm)}</td>
                <td className="px-2 py-1"><Estado f={f.a} /> → <Estado f={f.b} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500">Espesores en mm. Requerido: motor normativo de cada escenario (recalcule tras cada cambio). Sin costos: el plano no guarda la altura de los muros.</p>
    </div>
  );
}
