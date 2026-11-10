/**
 * Fase 10 — Asistente «Guíame»: panel flotante no modal (el lienzo sigue usable) que recorre el flujo
 * crear proyecto → plano → fuentes → ocupación → cálculo → cumplimiento → reporte.
 * El ejemplo PET/CT se aplica sólo cuando el usuario pulsa «Usar el ejemplo» en un paso.
 */
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, RotateCcw, SkipForward, X } from 'lucide-react';
import type { FloorPlan } from '@/types/radshield';
import { PASOS_GUIA, pasoCumplido, type AccionGuia, type IdPaso, type ProgresoGuia } from '@/lib/guiaPasos';

export interface AccionesGuia {
  crearProyecto: () => void;
  abrirProyecto: () => void;
  importarDXF: () => void;
  cargarImagen: () => void;
  herramienta: (t: 'barrier' | 'source' | 'region') => void;
  ejemploParedes: () => void;
  ejemploFuentes: () => void;
  ejemploOcupacion: () => void;
  calcular: () => void;
  validarPlano: () => void;
  exportarPDF: () => void;
  exportarCSV: () => void;
}

interface Props {
  progreso: ProgresoGuia;
  despachar: (a: AccionGuia) => void;
  floorPlan: FloorPlan;
  acciones: AccionesGuia;
}

interface Boton { etiqueta: string; accion: () => void; principal?: boolean; testId: string }

function botonesDelPaso(id: IdPaso, a: AccionesGuia, visitar: (id: IdPaso) => void, ejemplo: () => void): { propios: Boton[]; ejemplo?: Boton } {
  switch (id) {
    case 'proyecto': return { propios: [
      { etiqueta: 'Crear proyecto vacío', accion: () => { a.crearProyecto(); visitar('proyecto'); }, principal: true, testId: 'guia-crear-proyecto' },
      { etiqueta: 'Abrir proyecto', accion: a.abrirProyecto, testId: 'guia-abrir-proyecto' },
    ] };
    case 'plano': return {
      propios: [
        { etiqueta: 'Importar DXF', accion: a.importarDXF, testId: 'guia-importar-dxf' },
        { etiqueta: 'Cargar imagen', accion: a.cargarImagen, testId: 'guia-cargar-imagen' },
        { etiqueta: 'Dibujar muros', accion: () => a.herramienta('barrier'), testId: 'guia-dibujar-muros' },
      ],
      ejemplo: { etiqueta: 'Usar el plano de ejemplo (PET/CT)', accion: () => { ejemplo(); a.ejemploParedes(); }, testId: 'guia-ejemplo-plano' },
    };
    case 'fuentes': return {
      propios: [{ etiqueta: 'Colocar una fuente', accion: () => a.herramienta('source'), testId: 'guia-colocar-fuente' }],
      ejemplo: { etiqueta: 'Usar las fuentes del ejemplo', accion: () => { ejemplo(); a.ejemploFuentes(); }, testId: 'guia-ejemplo-fuentes' },
    };
    case 'ocupacion': return {
      propios: [{ etiqueta: 'Dibujar región ocupada', accion: () => a.herramienta('region'), testId: 'guia-dibujar-region' }],
      ejemplo: { etiqueta: 'Aplicar la ocupación del ejemplo', accion: () => { ejemplo(); a.ejemploOcupacion(); }, testId: 'guia-ejemplo-ocupacion' },
    };
    case 'calculo': return { propios: [{ etiqueta: 'Calcular espesores', accion: a.calcular, principal: true, testId: 'guia-calcular' }] };
    case 'cumplimiento': return { propios: [{ etiqueta: 'Abrir validador del plano', accion: () => { a.validarPlano(); visitar('cumplimiento'); }, principal: true, testId: 'guia-validar' }] };
    case 'reporte': return { propios: [
      { etiqueta: 'Exportar PDF', accion: () => { a.exportarPDF(); visitar('reporte'); }, principal: true, testId: 'guia-exportar-pdf' },
      { etiqueta: 'Exportar CSV', accion: () => { a.exportarCSV(); visitar('reporte'); }, testId: 'guia-exportar-csv' },
    ] };
  }
}

export default function GuiaPasoAPaso({ progreso, despachar, floorPlan, acciones }: Props) {
  if (progreso.estado !== 'activo') return null;
  const paso = PASOS_GUIA[progreso.paso];
  const visitar = (id: IdPaso) => despachar({ tipo: 'visitar', id });
  const { propios, ejemplo } = botonesDelPaso(paso.id, acciones, visitar, () => despachar({ tipo: 'usarEjemplo' }));
  const hecho = pasoCumplido(paso.id, floorPlan, progreso.visitados);
  const ultimo = progreso.paso === PASOS_GUIA.length - 1;
  const btn = 'text-xs px-2.5 py-1.5 rounded-md border transition-colors';

  return (
    <aside
      role="region"
      aria-label="Asistente Guíame"
      data-testid="guia-paso-a-paso"
      className="fixed right-4 bottom-14 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">Guíame · paso {progreso.paso + 1} de {PASOS_GUIA.length}</p>
          <h2 className="text-sm font-semibold" data-testid="guia-titulo">{paso.titulo}</h2>
        </div>
        <button type="button" aria-label="Cerrar la guía (se puede reanudar desde Ayuda)" title="Cerrar (reanudar desde Ayuda → Guíame)" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => despachar({ tipo: 'pausar' })} data-testid="guia-cerrar">
          <X className="h-4 w-4" />
        </button>
      </header>

      <ol className="flex gap-1 px-4 pt-3" aria-label="Pasos">
        {PASOS_GUIA.map((p, i) => {
          const ok = pasoCumplido(p.id, floorPlan, progreso.visitados);
          const saltado = progreso.saltados.includes(p.id) && !ok;
          return (
            <li key={p.id} className="flex-1">
              <button
                type="button"
                title={`${i + 1}. ${p.titulo}${ok ? ' (hecho)' : saltado ? ' (saltado)' : ''}`}
                aria-label={`Ir al paso ${i + 1}: ${p.titulo}`}
                aria-current={i === progreso.paso ? 'step' : undefined}
                onClick={() => despachar({ tipo: 'ir', paso: i })}
                className={`block h-1.5 w-full rounded-full ${i === progreso.paso ? 'bg-orange-500' : ok ? 'bg-emerald-500' : saltado ? 'bg-amber-300' : 'bg-slate-200'}`}
              />
            </li>
          );
        })}
      </ol>

      <div className="space-y-2 px-4 py-3 text-xs leading-relaxed">
        <p>{paso.explicacion}</p>
        <p className="text-slate-500"><span className="font-medium text-slate-700">Con tu proyecto:</span> {paso.comoHacerlo}</p>
        <div className="flex flex-wrap gap-1.5">
          {propios.map((b) => (
            <button key={b.testId} type="button" data-testid={b.testId} onClick={b.accion}
              className={`${btn} ${b.principal ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600' : 'border-slate-300 hover:bg-slate-50'}`}>
              {b.etiqueta}
            </button>
          ))}
        </div>
        {ejemplo && paso.ejemplo && (
          <div className="rounded-md bg-sky-50 p-2 text-sky-900">
            <p className="mb-1.5"><span className="font-medium">¿Sin plano a mano?</span> {paso.ejemplo}</p>
            <button type="button" data-testid={ejemplo.testId} onClick={ejemplo.accion} className={`${btn} border-sky-300 bg-white hover:bg-sky-100`}>
              {ejemplo.etiqueta}
            </button>
          </div>
        )}
        <p className={`flex items-center gap-1 ${hecho ? 'text-emerald-700' : 'text-slate-400'}`} data-testid="guia-estado-paso">
          {hecho ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {hecho ? 'Paso hecho en el proyecto' : 'Pendiente en el proyecto'}
        </p>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
        <button type="button" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" onClick={() => despachar({ tipo: 'iniciar' })} data-testid="guia-reiniciar" title="Volver al paso 1">
          <RotateCcw className="h-3.5 w-3.5" /> Empezar de nuevo
        </button>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Paso anterior" disabled={progreso.paso === 0} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" onClick={() => despachar({ tipo: 'anterior' })} data-testid="guia-anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {!hecho && (
            <button type="button" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" onClick={() => despachar({ tipo: 'saltar' })} data-testid="guia-saltar">
              <SkipForward className="h-3.5 w-3.5" /> Saltar
            </button>
          )}
          <button type="button" className="flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white hover:bg-slate-700" onClick={() => despachar({ tipo: 'siguiente' })} data-testid="guia-siguiente">
            {ultimo ? 'Terminar' : 'Siguiente'} {!ultimo && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </footer>
    </aside>
  );
}
