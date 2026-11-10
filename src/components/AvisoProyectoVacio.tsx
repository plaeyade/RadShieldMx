/** Fase 10: aviso de estado vacío para diálogos que dependen del plano, las fuentes o el cálculo. */
import type { FloorPlan } from '@/types/radshield';
import { faltaEnProyecto, MENSAJE_FALTA } from '@/lib/resumenResultados';
import { useAppStore } from '@/stores/appStore';

interface Props {
  floorPlan: Pick<FloorPlan, 'barriers' | 'sources'> | null | undefined;
  /** Hasta qué requisito avisar: «plano» sólo exige barreras; «calculo» exige también fuentes y cálculo. */
  exige?: 'plano' | 'fuentes' | 'calculo';
  className?: string;
}

const ORDEN = { plano: 0, fuentes: 1, calculo: 2 } as const;

export default function AvisoProyectoVacio({ floorPlan, exige = 'calculo', className = '' }: Props) {
  const falta = faltaEnProyecto(floorPlan);
  if (!falta || ORDEN[falta] > ORDEN[exige]) return null;
  return (
    <div role="status" data-testid="f10-aviso-proyecto-vacio" data-falta={falta} className={`rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 ${className}`}>
      {MENSAJE_FALTA[falta]}
      {falta === 'plano' && (
        <button type="button" className="ml-2 font-medium underline underline-offset-2" onClick={() => { useAppStore.getState().closeAll(); useAppStore.getState().open('dxfViewer'); }}>
          Importar DXF
        </button>
      )}
    </div>
  );
}
