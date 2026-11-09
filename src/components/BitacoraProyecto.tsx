/**
 * Fase 9 — bitácora real del proyecto para AuditLog y AuditDashboard.
 *
 * Junta dos fuentes, sin inventar nada:
 * - los eventos con fecha que guarda el plano (`eventosDelPlano`: importación, confirmación, cálculo, advertencias);
 * - la bitácora del servidor (`trpc.audit.list`, la misma de AuditTrailDialog) cuando hay backend configurado.
 * Sin backend no hay registro de usuarios, sesiones ni exportaciones: el estado lo dice.
 */
import type { ReactNode } from 'react';
import { BACKEND_ENABLED, trpc } from '@/providers/trpc';
import { entradaDeServidor, entradasDelPlano, type EntradaBitacora, type EntradaServidor, type EstadoServidor } from '@/lib/bitacoraProyecto';
import type { FloorPlan } from '@/types/radshield';

export type { EntradaBitacora, EstadoServidor, TipoEntrada } from '@/lib/bitacoraProyecto';

type Render = (entradas: EntradaBitacora[], estado: EstadoServidor) => ReactNode;

function ConsultaServidor({ plano, children }: { plano: FloorPlan; children: Render }) {
  const { data, isLoading, error } = trpc.audit.list.useQuery({ projectId: plano.id, limit: 200 }, { enabled: !!plano.id });
  const servidor = ((data ?? []) as EntradaServidor[]).map(entradaDeServidor);
  const estado: EstadoServidor = isLoading ? 'cargando' : error ? 'error' : 'ok';
  const todas = [...entradasDelPlano(plano), ...servidor].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return <>{children(todas, estado)}</>;
}

export function BitacoraProyecto({ plano, children }: { plano: FloorPlan; children: Render }) {
  if (!BACKEND_ENABLED) return <>{children(entradasDelPlano(plano), 'sin-servidor')}</>;
  return <ConsultaServidor plano={plano}>{children}</ConsultaServidor>;
}

export function AvisoBitacora({ estado, total }: { estado: EstadoServidor; total: number }) {
  const texto = estado === 'sin-servidor'
    ? 'Sin servidor configurado no hay bitácora de usuarios ni sesiones: se muestran sólo los eventos con fecha que guarda el plano (importación, confirmación y cálculo).'
    : estado === 'cargando' ? 'Cargando la bitácora del servidor…'
      : estado === 'error' ? 'No se pudo leer la bitácora del servidor; se muestran sólo los eventos del plano.'
        : 'Eventos del plano y de la bitácora del servidor.';
  return (
    <p data-testid="bitacora-estado" className="mb-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {texto} {total === 0 && estado !== 'cargando' ? 'Aún no hay eventos registrados.' : null}
    </p>
  );
}
