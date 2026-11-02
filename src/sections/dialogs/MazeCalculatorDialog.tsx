/**
 * Laberinto y puerta de teleterapia — NCRP 151 §2.4 (fotones, captura y neutrones).
 * Sustituye al modelo anterior por segmentos, que no seguía las ecuaciones del informe.
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { cargaFuga, type EnergiaMV } from '@/lib/ncrp151';
import {
  capturaGammaPorGy, fotonesEnPuerta, fuenteNeutronesConservadora, neutronesKersey, neutronesWuMcGinley,
  puerta, TABLA_B_9,
} from '@/lib/ncrp151Laberinto';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

// Valores iniciales: carga y sala del ejemplo NCRP 151 §7.1 (Varian 1800, 18 MV); geometría de fotones ilustrativa.
const INICIAL = {
  energia: 18 as EnergiaMV, W: 450, fIMRT: 0, cIMRT: 5, P_mSv: 0.1,
  dh: 7.4, dr: 5.0, dz: 8.5, A0: 2.6, Az: 9.2, dsec: 6.4, dzz: 8.5, A1: 22, dL: 7.3, BZ: 2.41e-4,
  equipo: 'conservador', d1: 6.4, d2: 8.5, Sr: 236, S0: 9.2, S1: 8.4,
};

function Num({ id, label, value, onChange, step = 'any' }: { id: string; label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="text-[11px]">{label}</Label>
      <Input id={id} type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
    </div>
  );
}

const fmt = (sv: number) => (sv * 1e6).toLocaleString('es-MX', { maximumFractionDigits: 1 });

export default function MazeCalculatorDialog({ open, onOpenChange }: Props) {
  const [v, setV] = useState(INICIAL);
  const set = (k: keyof typeof INICIAL) => (x: number | string) => setV((p) => ({ ...p, [k]: x }));
  const altaEnergia = typeof v.energia === 'number' && v.energia > 10;

  const r = useMemo(() => {
    try {
      const WL = cargaFuga({ energia: v.energia, W_Gy_semana: v.W, fraccionIMRT: v.fIMRT, factorIMRT: v.cIMRT });
      const fot = fotonesEnPuerta(
        { dh_m: v.dh, dr_m: v.dr, dz_m: v.dz, A0_m2: v.A0, Az_m2: v.Az, dsec_m: v.dsec, dzz_m: v.dzz, A1_m2: v.A1, dL_m: v.dL, B_muroZ: v.BZ },
        { energia: v.energia, W_Gy_semana: v.W, WL_Gy_semana: WL },
      );
      let Hn = 0, Hcg = 0;
      const notas: string[] = [];
      if (altaEnergia) {
        const mv = v.energia as number;
        const fila = TABLA_B_9.find((f) => `${f.fabricante} ${f.modelo} ${f.mv}` === v.equipo);
        const fuente = fila ? { Qn: fila.Qn, H0_mSv_Gy: fila.H0_mSv_Gy ?? fuenteNeutronesConservadora(mv).H0_mSv_Gy } : fuenteNeutronesConservadora(mv);
        if (!fila) notas.push(fuenteNeutronesConservadora(mv).nota);
        const sala = { Qn: fuente.Qn, d1_m: v.d1, d2_m: v.d2, Sr_m2: v.Sr, S0_m2: v.S0, S1_m2: v.S1, H0_mSv_Gy: fuente.H0_mSv_Gy };
        Hcg = WL * capturaGammaPorGy(sala, mv);
        const kersey = neutronesKersey(sala);
        const wu = neutronesWuMcGinley(sala);
        Hn = WL * Math.max(kersey, wu);
        notas.push(`Neutrones: el mayor de Kersey (${(kersey * 1e6).toFixed(2)} µSv/Gy) y Wu–McGinley (${(wu * 1e6).toFixed(2)} µSv/Gy).`);
      }
      const door = puerta(v.P_mSv / 1000, { neutrones: Hn, captura: Hcg, fotones: fot.HTot });
      return { WL, fot, Hn, Hcg, door, notas: [...notas, ...door.notas], error: null as string | null };
    } catch (e) {
      return { error: (e as Error).message } as const;
    }
  }, [v, altaEnergia]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Laberinto y puerta — NCRP 151 §2.4
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Valores iniciales: carga, sala y laberinto para neutrones del ejemplo §7.1 del informe; la geometría de fotones es ilustrativa y debe tomarse del plano. Distancias en m, áreas en m², dosis en µSv/semana.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <Label htmlFor="maze-energia" className="text-[11px]">Energía</Label>
            <Select value={String(v.energia)} onValueChange={(x) => set('energia')(Number(x) as EnergiaMV)}>
              <SelectTrigger id="maze-energia" className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{[6, 10, 15, 18, 20, 25].map((e) => <SelectItem key={e} value={String(e)}>{e} MV</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Num id="maze-W" label="W (Gy/semana)" value={v.W} onChange={set('W')} />
          <Num id="maze-fimrt" label="Fracción IMRT" value={v.fIMRT} onChange={set('fIMRT')} step="0.05" />
          <Num id="maze-cimrt" label="Factor IMRT C_I" value={v.cIMRT} onChange={set('cIMRT')} />
          <Num id="maze-P" label="P (mSv/semana)" value={v.P_mSv} onChange={set('P_mSv')} step="0.01" />
        </div>

        <div className="text-xs font-semibold mt-1">Geometría del laberinto (Fig. 2.7)</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Num id="maze-dh" label="d_h" value={v.dh} onChange={set('dh')} />
          <Num id="maze-dr" label="d_r" value={v.dr} onChange={set('dr')} />
          <Num id="maze-dz" label="d_z" value={v.dz} onChange={set('dz')} />
          <Num id="maze-A0" label="A₀" value={v.A0} onChange={set('A0')} />
          <Num id="maze-Az" label="A_z" value={v.Az} onChange={set('Az')} />
          <Num id="maze-dsec" label="d_sec" value={v.dsec} onChange={set('dsec')} />
          <Num id="maze-dzz" label="d_zz" value={v.dzz} onChange={set('dzz')} />
          <Num id="maze-A1" label="A₁" value={v.A1} onChange={set('A1')} />
          <Num id="maze-dL" label="d_L" value={v.dL} onChange={set('dL')} />
          <Num id="maze-BZ" label="B muro Z" value={v.BZ} onChange={set('BZ')} />
        </div>

        {altaEnergia && (
          <>
            <div className="text-xs font-semibold mt-1">Neutrones y captura (Fig. 2.8)</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="maze-equipo" className="text-[11px]">Equipo (Tabla B.9)</Label>
                <Select value={v.equipo} onValueChange={set('equipo')}>
                  <SelectTrigger id="maze-equipo" className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservador">Máximo de la tabla para la energía</SelectItem>
                    {TABLA_B_9.filter((f) => f.mv === v.energia).map((f) => {
                      const k = `${f.fabricante} ${f.modelo} ${f.mv}`;
                      return <SelectItem key={k} value={k}>{f.fabricante} {f.modelo}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Num id="maze-d1" label="d₁" value={v.d1} onChange={set('d1')} />
              <Num id="maze-d2" label="d₂" value={v.d2} onChange={set('d2')} />
              <Num id="maze-Sr" label="S_r sala" value={v.Sr} onChange={set('Sr')} />
              <Num id="maze-S0" label="S₀" value={v.S0} onChange={set('S0')} />
              <Num id="maze-S1" label="S₁" value={v.S1} onChange={set('S1')} />
            </div>
          </>
        )}

        {'error' in r && r.error ? (
          <p className="text-sm text-red-700">{r.error}</p>
        ) : 'fot' in r && r.fot ? (
          <div className="space-y-3 border-t pt-3">
            <table className="w-full text-sm">
              <tbody>
                <tr><td>Dispersión del haz en muros (H_S)</td><td className="text-right tabular-nums">{fmt(r.fot.HS)}</td></tr>
                <tr><td>Fuga dispersada (H_LS)</td><td className="text-right tabular-nums">{fmt(r.fot.HLS)}</td></tr>
                <tr><td>Dispersión del paciente (H_ps)</td><td className="text-right tabular-nums">{fmt(r.fot.Hps)}</td></tr>
                <tr><td>Fuga a través del muro Z (H_LT)</td><td className="text-right tabular-nums">{fmt(r.fot.HLT)}</td></tr>
                <tr className="font-semibold"><td>Fotones en la puerta, H_Tot = 2.64·H_G</td><td className="text-right tabular-nums">{fmt(r.fot.HTot)}</td></tr>
                {altaEnergia && <tr><td>Gamma de captura (H_cg)</td><td className="text-right tabular-nums">{fmt(r.Hcg)}</td></tr>}
                {altaEnergia && <tr><td>Neutrones (H_n)</td><td className="text-right tabular-nums">{fmt(r.Hn)}</td></tr>}
                <tr className="font-semibold border-t"><td>Total en la puerta</td><td className="text-right tabular-nums">{fmt(r.door.H_total_Sv)}</td></tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border p-3 text-center"><div className="text-2xl font-semibold tabular-nums">{r.door.plomo_mm.toFixed(1)}</div><div className="text-xs text-muted-foreground">mm de plomo en la puerta</div></div>
              <div className="rounded border p-3 text-center"><div className="text-2xl font-semibold tabular-nums">{r.door.bpe_mm.toFixed(1)}</div><div className="text-xs text-muted-foreground">mm de polietileno borado</div></div>
            </div>
            <ul className="text-xs text-muted-foreground list-disc pl-5">
              <li>Carga de fuga W_L = {r.WL.toFixed(0)} Gy/semana (Ec. 3.6).</li>
              {r.notas.map((n) => <li key={n}>{n}</li>)}
              <li>Ec. 2.14 es válida con 2 &lt; d_zz/√(ancho × alto) &lt; 6 y 1 &lt; alto/ancho &lt; 2. Resultado de tamizaje: requiere revisión del físico médico.</li>
            </ul>
            <Button variant="outline" size="sm" onClick={() => setV(INICIAL)}>Restablecer valores iniciales</Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
