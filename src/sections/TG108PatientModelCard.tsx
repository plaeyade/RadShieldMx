import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Atom } from 'lucide-react';
import type { RadiationSource } from '@/types/radshield';
import {
  dosisSemanalPorModalidad,
  NUCLIDO_PET_POR_MODALIDAD,
  protocolosParaModalidad,
  tieneModeloPorPaciente,
  type ParametrosPorPaciente,
} from '@/lib/tg108';

type TG108 = NonNullable<RadiationSource['tg108']>;

/** Valores iniciales al activar el modelo: ejemplo de diseño TG-108 (555 MBq, 60 min de captación). */
function valoresIniciales(modalityId: string): TG108 {
  const presets = protocolosParaModalidad(modalityId);
  const A0 = NUCLIDO_PET_POR_MODALIDAD[modalityId] ? 555 : presets[0]?.A_MBq[1] ?? 555;
  return { A0_MBq: A0, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion' };
}

const NUMERICOS: { key: keyof Omit<TG108, 'sala'>; label: string; step: string }[] = [
  { key: 'A0_MBq', label: 'A₀ (MBq)', step: '1' },
  { key: 'pacientesSemana', label: 'Pacientes/semana', step: '1' },
  { key: 'tU_h', label: 'Captación t_U (h)', step: '0.05' },
  { key: 'tI_h', label: 'Imagen t_I (h)', step: '0.05' },
];

interface Props {
  source: RadiationSource;
  onChange: (tg108: TG108 | undefined) => void;
}

/**
 * Modelo por paciente de medicina nuclear. En PET es AAPM TG-108; en SPECT/I-131 es una extensión
 * «estilo TG-108» (sin atenuación del paciente ni vaciado, ver src/lib/tg108.ts). Apagado ⇒ `tg108`
 * queda undefined y el cálculo vuelve a «actividad × horas».
 */
export default function TG108PatientModelCard({ source, onChange }: Props) {
  const modalityId = source.modality.id;
  if (!tieneModeloPorPaciente(modalityId)) return null;

  const tg = source.tg108;
  const esPET = Boolean(NUCLIDO_PET_POR_MODALIDAD[modalityId]);
  const presets = protocolosParaModalidad(modalityId);
  const update = (patch: Partial<TG108>) => tg && onChange({ ...tg, ...patch });

  let hint: string | null = null;
  if (tg) {
    try {
      const r = dosisSemanalPorModalidad(modalityId, source.modality.doseRateConstant ?? 0, tg as ParametrosPorPaciente, 1);
      if (r) hint = `Rₜ = ${r.Rt.toFixed(3)} · D(1 m) = ${r.D_uSv.toFixed(1)} μSv/sem (${(r.D_uSv / 1000).toFixed(3)} mSv/sem)`;
    } catch {
      hint = 'Entrada inválida';
    }
  }

  return (
    <Card data-testid="tg108-patient-model" className="border-violet-200 shadow-sm">
      <CardHeader className="py-2 px-3 pb-1 bg-gradient-to-r from-violet-50 to-white">
        <CardTitle className="text-[10px] font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
          <Atom className="w-3 h-3" /> Modelo TG-108 por paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="tg108-toggle" className="text-[10px] text-slate-600">
            {esPET ? 'Usar TG-108 (PET)' : 'Usar modelo estilo TG-108'}
          </Label>
          <Switch
            id="tg108-toggle"
            data-testid="tg108-toggle"
            checked={Boolean(tg)}
            onCheckedChange={(on) => onChange(on ? valoresIniciales(modalityId) : undefined)}
          />
        </div>
        {!esPET && (
          <p className="text-[9px] text-amber-700">
            Extensión, no TG-108 (sólo PET): Γ de la modalidad sin atenuación del paciente ni vaciado; conservador.
          </p>
        )}
        {tg && (
          <>
            {presets.length > 0 && (
              <div>
                <Label htmlFor="tg108-preset" className="text-[9px] text-slate-500">Actividad de referencia</Label>
                <select
                  id="tg108-preset"
                  data-testid="tg108-preset"
                  className="mt-0.5 h-7 w-full rounded-md border border-input bg-transparent px-2 text-[10px]"
                  value=""
                  onChange={(e) => {
                    const p = presets.find((x) => x.id === e.target.value);
                    if (p) update({ A0_MBq: p.A_MBq[1] });
                  }}
                >
                  <option value="">Elegir protocolo…</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id} title={`${p.fuente}${p.nota ? ` — ${p.nota}` : ''}`}>
                      {p.estudio} ({p.A_MBq[0] === p.A_MBq[1] ? p.A_MBq[0] : `${p.A_MBq[0]}–${p.A_MBq[1]}`} MBq)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1">
              {NUMERICOS.map(({ key, label, step }) => (
                <div key={key}>
                  <Label htmlFor={`tg108-${key}`} className="text-[9px] text-slate-500">{label}</Label>
                  <Input
                    id={`tg108-${key}`}
                    data-testid={`tg108-${key}`}
                    type="number"
                    min={0}
                    step={step}
                    value={tg[key]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      update({ [key]: Number.isFinite(v) && v >= 0 ? v : 0 });
                    }}
                    className="h-7 text-[10px]"
                  />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="tg108-sala" className="text-[9px] text-slate-500">Sala</Label>
              <select
                id="tg108-sala"
                data-testid="tg108-sala"
                className="mt-0.5 h-7 w-full rounded-md border border-input bg-transparent px-2 text-[10px]"
                value={tg.sala}
                onChange={(e) => update({ sala: e.target.value as TG108['sala'] })}
              >
                <option value="captacion">Captación</option>
                <option value="imagen">Imagen</option>
              </select>
            </div>
            {hint && <p data-testid="tg108-hint" className="text-[9px] font-mono text-violet-700">{hint}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
