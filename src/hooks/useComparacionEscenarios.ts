/** Fase 9 — selección de escenarios A/B para los comparadores (`components/ComparadorEscenarios`). */
import { useMemo, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEscenariosStore } from '@/stores/escenariosStore';
import { compararPlanos } from '@/lib/estadoProyecto';

/** Identificador del plano actual en los selectores. */
export const ACTUAL = 'actual';

export function useComparacion() {
  const actual = useCanvasStore((s) => s.floorPlan);
  const escenarios = useEscenariosStore((s) => s.escenarios);
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>(ACTUAL);
  const plano = (id: string) => (id === ACTUAL ? actual : escenarios.find((e) => e.id === id)?.plano ?? null);
  const efectivoA = idA && plano(idA) ? idA : escenarios[0]?.id ?? '';
  const pa = efectivoA ? plano(efectivoA) : null;
  const pb = plano(idB) ?? actual;
  const comparacion = useMemo(() => (pa ? compararPlanos(pa, pb) : null), [pa, pb]);
  const nombre = (id: string) => (id === ACTUAL ? 'Plano actual' : escenarios.find((e) => e.id === id)?.nombre ?? '—');
  return { actual, escenarios, idA: efectivoA, setIdA, idB, setIdB, comparacion, nombreA: nombre(efectivoA), nombreB: nombre(idB) };
}
