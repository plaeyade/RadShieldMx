/** Ventilación de la bóveda: activación de Ar-41 en el aire y tiempo de espera antes de entrar. */
import { useMemo, useState } from 'react';
import DialogShell from '@/components/DialogShell';
import { AR41, calcularVentilacionAr41, flujoParaCorriente, leerFlujoAire, type EntradaVentilacion, type FlujoAireCyclotronSim } from '@/lib/ventilacionBunker';
import kiube from '@/data/flujo_aire_kiube.json';

const CAMPOS: Array<[keyof EntradaVentilacion, string]> = [
  ['volumenSala_m3', 'Volumen de la sala (m³)'],
  ['renovaciones_h', 'Renovaciones de aire por hora'],
  ['flujoTermico_n_cm2_s', 'Flujo térmico medio en el aire (n/cm²/s)'],
  ['horasIrradiacion', 'Horas de irradiación continua'],
  ['esperaAntesDeEntrar_min', 'Espera antes de entrar (min)'],
];

const fmt = (v: number) => (Math.abs(v) >= 1e4 || (v !== 0 && Math.abs(v) < 1e-2) ? v.toExponential(2) : v.toFixed(2));

export default function VentilationDialog({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  const [e, setE] = useState<EntradaVentilacion>({ volumenSala_m3: 120, renovaciones_h: 10, flujoTermico_n_cm2_s: 1e5, horasIrradiacion: 2, esperaAntesDeEntrar_min: 10 });
  const [mc, setMc] = useState<FlujoAireCyclotronSim | null>(null);
  const [corriente, setCorriente] = useState(300);
  const [errorMc, setErrorMc] = useState<string | null>(null);
  const aplicarMc = (f: FlujoAireCyclotronSim, conservador: boolean) => {
    setMc(f);
    setErrorMc(null);
    setE((x) => ({ ...x, flujoTermico_n_cm2_s: Math.round(flujoParaCorriente(f, corriente, conservador)) }));
  };
  const importar = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      aplicarMc(leerFlujoAire(JSON.parse(await f.text())), false);
    } catch (err) {
      setErrorMc((err as Error).message);
    }
  };
  const r = useMemo(() => {
    try {
      return { ok: calcularVentilacionAr41(e) } as const;
    } catch (err) {
      return { error: (err as Error).message } as const;
    }
  }, [e]);
  if (!open) return null;
  return (
    <DialogShell title="Ventilación del búnker" subtitle="Ar-41 en el aire de la bóveda (NCRP 144)" gradientFrom="from-sky-600" gradientTo="to-cyan-700" maxWidth="max-w-2xl" onClose={() => onClose?.()}>
      <div className="grid gap-4 p-4 text-sm md:grid-cols-2" data-testid="ventilation-dialog">
        <div className="space-y-2">
          {CAMPOS.map(([k, label]) => (
            <label key={k} className="block">
              <span className="text-xs text-slate-600">{label}</span>
              <input type="number" className="w-full rounded border p-1" value={e[k] ?? 0} onChange={(ev) => setE({ ...e, [k]: Number(ev.target.value) })} />
            </label>
          ))}
          <div className="space-y-1 rounded border border-sky-200 bg-sky-50 p-2 text-xs" data-testid="ventilation-mc">
            <p className="font-medium">Flujo desde el MC de Cyclotron-SIM</p>
            <label className="block">
              Corriente total (µA)
              <input type="number" className="ml-2 w-20 rounded border p-0.5" value={corriente} onChange={(ev) => setCorriente(Number(ev.target.value))} />
            </label>
            <div className="flex flex-wrap gap-1">
              <button type="button" className="rounded border bg-white px-2" onClick={() => aplicarMc(leerFlujoAire(kiube), false)}>KIUBE 300 · media</button>
              <button type="button" className="rounded border bg-white px-2" onClick={() => aplicarMc(leerFlujoAire(kiube), true)}>KIUBE 300 · p95</button>
              <input type="file" accept=".json" onChange={importar} aria-label="Importar flujo_aire@1" />
            </div>
            {mc ? <p>{mc.maquina}: {mc.lotes} lotes MC, escalado a {corriente} µA.</p> : null}
            {errorMc ? <p className="text-red-700">{errorMc}</p> : null}
          </div>
          <p className="text-xs text-slate-500">El flujo térmico medio del aire es el dato que más pesa en el resultado. Sale de la malla MC de la bóveda (Cyclotron-SIM) o de una medición.</p>
        </div>
        <div className="space-y-1">
          {'error' in r ? (
            <p className="text-red-700">{r.error}</p>
          ) : (
            <>
              <p>Saturación: <b>{fmt(r.ok.concentracionSaturacion_Bq_m3)}</b> Bq/m³</p>
              <p>Fin de irradiación: <b>{fmt(r.ok.concentracionFinIrradiacion_Bq_m3)}</b> Bq/m³</p>
              <p>Al entrar: <b>{fmt(r.ok.concentracionAlEntrar_Bq_m3)}</b> Bq/m³ ({fmt(r.ok.fraccionDAC_alEntrar)} × DAC)</p>
              <p>Espera mínima para quedar bajo el DAC: <b>{r.ok.tiempoHastaBajoDAC_min.toFixed(0)}</b> min</p>
              <p>Emisión por chimenea: <b>{fmt(r.ok.emisionChimenea_Bq_s)}</b> Bq/s ({fmt(r.ok.relacionEfluente_finIrradiacion)} × límite de efluente)</p>
              {r.ok.advertencias.map((a) => (
                <p key={a} className="text-amber-700">• {a}</p>
              ))}
              <p className="pt-2 text-xs text-slate-500">
                DAC Ar-41 {fmt(AR41.DAC_Bq_m3)} Bq/m³ y efluente {fmt(AR41.efluente_Bq_m3)} Bq/m³ (10 CFR 20 Ap. B); verificar contra la autorización CNSNS. Modelo de mezcla completa; resultado preliminar, no apto para firma.
              </p>
            </>
          )}
        </div>
      </div>
    </DialogShell>
  );
}
