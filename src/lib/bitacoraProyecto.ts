/**
 * Fase 9 — entradas de la bitácora del proyecto (ver `components/BitacoraProyecto`): eventos del plano y registros del
 * servidor (`trpc.audit.list`) en un solo formato.
 */
import { eventosDelPlano, type TipoEventoPlano } from './estadoProyecto';
import type { FloorPlan } from '@/types/radshield';

export type TipoEntrada = TipoEventoPlano | 'edit' | 'export' | 'config' | 'otro';

export interface EntradaBitacora {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  tipo: TipoEntrada;
  detalle: string;
  origen: 'plano' | 'servidor';
}

export type EstadoServidor = 'sin-servidor' | 'cargando' | 'error' | 'ok';

export interface EntradaServidor {
  id: string | number; createdAt: string | Date; userId?: string | null; action: string;
  fieldName?: string | null; oldValue?: string | null; newValue?: string | null;
}

const TIPO_ACCION: Record<string, TipoEntrada> = {
  create: 'edit', update: 'edit', delete: 'edit', calculate: 'calc', export: 'export', generate_report: 'export', login: 'config', logout: 'config',
};

export function entradasDelPlano(plano: FloorPlan): EntradaBitacora[] {
  return eventosDelPlano(plano).map((e) => ({ id: `plano-${e.id}`, fecha: e.fecha, usuario: '—', accion: e.accion, tipo: e.tipo, detalle: e.detalle, origen: 'plano' }));
}

export function entradaDeServidor(e: EntradaServidor): EntradaBitacora {
  const cambio = e.fieldName ? `${e.fieldName}: ${e.oldValue ?? '—'} → ${e.newValue ?? '—'}` : '';
  return {
    id: `srv-${e.id}`,
    fecha: new Date(e.createdAt).toISOString(),
    usuario: e.userId ?? '—',
    accion: e.action,
    tipo: TIPO_ACCION[e.action] ?? 'otro',
    detalle: cambio,
    origen: 'servidor',
  };
}
