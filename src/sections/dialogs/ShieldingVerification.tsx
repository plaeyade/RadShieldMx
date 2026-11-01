/** Verificación de blindaje: espesor instalado frente al requerido, barrera por barrera. */
import { useMemo } from 'react';
import DialogShell from '@/components/DialogShell';
import { verificarPlano, type EstadoVerificacion } from '@/lib/verificacionBlindaje';
import type { FloorPlan } from '@/types/radshield';

const COLOR: Record<EstadoVerificacion, string> = {
  CUMPLE: 'text-emerald-700',
  NO_CUMPLE: 'text-red-700 font-semibold',
  SIN_CALCULO: 'text-amber-700',
  SIN_ESPESOR: 'text-amber-700',
  REVISAR_MATERIAL: 'text-amber-700',
};

export default function ShieldingVerification({ open = true, onClose, floorPlan }: { open?: boolean; onClose?: () => void; floorPlan?: FloorPlan }) {
  const r = useMemo(() => (floorPlan ? verificarPlano(floorPlan) : null), [floorPlan]);
  if (!open) return null;
  return (
    <DialogShell title="Verificación de blindaje" subtitle="Espesor instalado frente al requerido por barrera" gradientFrom="from-emerald-600" gradientTo="to-teal-700" maxWidth="max-w-4xl" onClose={() => onClose?.()}>
      <div className="space-y-3 p-4 text-sm" data-testid="shielding-verification">
        {!r || r.filas.length === 0 ? (
          <p>El plano no tiene barreras.</p>
        ) : (
          <>
            <p className={r.apto ? 'text-emerald-700' : 'text-red-700'}>
              {r.apto ? 'Todas las barreras cumplen.' : `${r.resumen.noCumple} no cumplen y ${r.resumen.pendientes} están pendientes`} · {r.resumen.cumple}/{r.resumen.total} cumplen
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th>Barrera</th><th>Material</th><th>Requerido (mm)</th><th>Instalado (mm)</th><th>Margen (mm)</th><th>P (mSv/sem)</th><th>Estado</th><th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {r.filas.map((f) => (
                  <tr key={f.barreraId} className="border-t">
                    <td>{f.barrera}</td><td>{f.material}</td>
                    <td>{f.requerido_mm?.toFixed(0) ?? '—'}</td><td>{f.instalado_mm?.toFixed(0) ?? '—'}</td>
                    <td>{f.margen_mm?.toFixed(0) ?? '—'}</td><td>{f.objetivo_mSv_sem}</td>
                    <td className={COLOR[f.estado]}>{f.estado.replace('_', ' ')}</td><td>{f.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="text-xs text-slate-500">
          No recalcula el blindaje: compara contra el espesor requerido que ya calculó el motor para el material seleccionado. El resultado es preliminar y no apto para firma hasta la revisión del responsable.
        </p>
      </div>
    </DialogShell>
  );
}
