/**
 * Entrada común de una fuente PET (Fase 7, AAPM TG-108): nucleido, actividad administrada A₀ (MBq), pacientes por
 * semana, tiempos de captación e imagen, tipo de sala, distancia, P y T. La dosis semanal usa Γ del nucleido
 * (TG-108 Tabla 1), la absorción del paciente (0.36) y el decaimiento Rₜ; ver `blindajePET`.
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NUCLIDOS_PET_LISTA, OBJETIVOS_DISENO, type EntradaPET } from '@/lib/calculadorasNormativas';
import { NUCLIDOS_PET, type NuclidoPET } from '@/lib/tg108';

const sel = 'h-7 w-full rounded-md border border-input px-1 text-xs';
const NOMBRE: Record<NuclidoPET, string> = { F18: 'F-18', Ga68: 'Ga-68', C11: 'C-11', N13: 'N-13', O15: 'O-15', Cu64: 'Cu-64' };

export default function EntradaFuentePET({ v, onChange, prefijo }: { v: EntradaPET; onChange: (e: EntradaPET) => void; prefijo: string }) {
  const num = (k: 'A0_MBq' | 'pacientesSemana' | 'tU_h' | 'tI_h' | 'd_m' | 'T', label: string) => (
    <div><Label htmlFor={`${prefijo}-${k}`} className="text-[10px]">{label}</Label>
      <Input id={`${prefijo}-${k}`} type="number" step="any" value={v[k]} onChange={e => onChange({ ...v, [k]: +e.target.value })} className="h-7 text-xs" /></div>
  );
  return (
    <div className="grid grid-cols-5 gap-2">
      <div><Label htmlFor={`${prefijo}-nuc`} className="text-[10px]">Nucleido (Γ, μSv·m²/(MBq·h))</Label>
        <select id={`${prefijo}-nuc`} className={sel} value={v.nuclido} onChange={e => onChange({ ...v, nuclido: e.target.value as NuclidoPET })}>
          {NUCLIDOS_PET_LISTA.map(n => <option key={n} value={n}>{NOMBRE[n]} (Γ = {NUCLIDOS_PET[n].gamma})</option>)}
        </select></div>
      <div><Label htmlFor={`${prefijo}-sala`} className="text-[10px]">Sala</Label>
        <select id={`${prefijo}-sala`} className={sel} value={v.sala} onChange={e => onChange({ ...v, sala: e.target.value as EntradaPET['sala'] })}>
          <option value="captacion">Captación (Ec. 2–3)</option><option value="imagen">Imagen / tomógrafo (Ec. 9–10)</option>
        </select></div>
      {num('A0_MBq', 'Actividad administrada A₀ (MBq)')}
      {num('pacientesSemana', 'Pacientes por semana')}
      {num('d_m', 'Distancia paciente → punto (m)')}
      {num('tU_h', 'Tiempo de captación t_U (h)')}
      {num('tI_h', 'Tiempo de imagen t_I (h)')}
      <div><Label htmlFor={`${prefijo}-P`} className="text-[10px]">Objetivo de diseño P</Label>
        <select id={`${prefijo}-P`} className={sel} value={String(v.P_mSv_semana)} onChange={e => onChange({ ...v, P_mSv_semana: +e.target.value })}>
          {OBJETIVOS_DISENO.map(o => <option key={o.id} value={o.P_mSv_semana}>{o.etiqueta}</option>)}
        </select></div>
      {num('T', 'Factor de ocupación T')}
    </div>
  );
}
