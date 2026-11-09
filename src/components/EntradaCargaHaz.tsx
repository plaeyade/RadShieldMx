/**
 * Entrada común de la carga de un haz (Fase 7): megavoltaje (NCRP 151: energía, W, U, d) o diagnóstico
 * (NCRP 147: distribución, barrera primaria/secundaria, N, U, d). La usan el optimizador de Pareto y el blindaje
 * multicapa, que calculan con `calculadorasNormativas`.
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CARGA_DIAG_INICIAL, CARGA_MV_INICIAL, DISTRIBUCIONES_PRIMARIA, DISTRIBUCIONES_SECUNDARIA, ENERGIAS_MV_TABULADAS,
  ETIQUETAS_NCRP147, type CargaHaz,
} from '@/lib/calculadorasNormativas';
import type { DistribucionNCRP147 } from '@/lib/ncrp147';
import type { EnergiaMV } from '@/lib/ncrp151';


const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';

export default function EntradaCargaHaz({ carga, onChange, prefijo }: { carga: CargaHaz; onChange: (c: CargaHaz) => void; prefijo: string }) {
  const num = (id: string, label: string, v: number, set: (n: number) => void) => (
    <div><Label htmlFor={`${prefijo}-${id}`} className="text-[10px]">{label}</Label>
      <Input id={`${prefijo}-${id}`} type="number" step="any" value={v} onChange={e => set(+e.target.value)} className="h-7 text-xs" /></div>
  );
  return (
    <div className="grid grid-cols-4 gap-2">
      <div><Label htmlFor={`${prefijo}-regimen`} className="text-[10px]">Régimen</Label>
        <select id={`${prefijo}-regimen`} className={sel} value={carga.regimen}
          onChange={e => onChange(e.target.value === 'megavoltaje' ? CARGA_MV_INICIAL : CARGA_DIAG_INICIAL)}>
          <option value="megavoltaje">Megavoltaje (NCRP 151, primaria)</option>
          <option value="diagnostico">Rayos X diagnóstico (NCRP 147)</option>
        </select></div>
      {carga.regimen === 'megavoltaje' ? (
        <>
          <div><Label htmlFor={`${prefijo}-energia`} className="text-[10px]">Energía</Label>
            <select id={`${prefijo}-energia`} className={sel} value={String(carga.energia)} onChange={e => onChange({ ...carga, energia: Number(e.target.value) as EnergiaMV })}>
              {ENERGIAS_MV_TABULADAS.map(x => <option key={x} value={x}>{x} MV</option>)}
            </select></div>
          {num('W', 'Carga W (Gy/semana)', carga.W_Gy_semana, n => onChange({ ...carga, W_Gy_semana: n }))}
          {num('U', 'Factor de uso U', carga.U, n => onChange({ ...carga, U: n }))}
          {num('d', 'Distancia blanco → punto (m)', carga.d_m, n => onChange({ ...carga, d_m: n }))}
        </>
      ) : (
        <>
          <div><Label htmlFor={`${prefijo}-barrera`} className="text-[10px]">Barrera</Label>
            <select id={`${prefijo}-barrera`} className={sel} value={carga.barrera}
              onChange={e => {
                const barrera = e.target.value as 'primaria' | 'secundaria';
                const lista = barrera === 'primaria' ? DISTRIBUCIONES_PRIMARIA : DISTRIBUCIONES_SECUNDARIA;
                onChange({ ...carga, barrera, distribucion: lista.includes(carga.distribucion) ? carga.distribucion : lista[0] });
              }}>
              <option value="primaria">Primaria (Tabla 4.5)</option><option value="secundaria">Secundaria (Tabla 4.7)</option>
            </select></div>
          <div className="col-span-2"><Label htmlFor={`${prefijo}-dist`} className="text-[10px]">Distribución de carga</Label>
            <select id={`${prefijo}-dist`} className={sel} value={carga.distribucion} onChange={e => onChange({ ...carga, distribucion: e.target.value as DistribucionNCRP147 })}>
              {(carga.barrera === 'primaria' ? DISTRIBUCIONES_PRIMARIA : DISTRIBUCIONES_SECUNDARIA).map(d => <option key={d} value={d}>{ETIQUETAS_NCRP147[d]}</option>)}
            </select></div>
          {num('N', 'Pacientes por semana N', carga.N_pacientes_semana, n => onChange({ ...carga, N_pacientes_semana: n }))}
          {num('U', 'Factor de uso U', carga.U, n => onChange({ ...carga, U: n }))}
          {num('d', 'Distancia al punto (m)', carga.d_m, n => onChange({ ...carga, d_m: n }))}
        </>
      )}
    </div>
  );
}
