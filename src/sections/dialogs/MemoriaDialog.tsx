/**
 * Memoria analítica y CNSNS — flujo único del menú «5. Memoria analítica y CNSNS» (Fase 12, paso 3).
 *
 * Sustituye al asistente «Memoria IA», al asistente paso a paso, al diálogo CNSNS (.docx), a «Exportar PDF», al
 * reporte CNSNS en HTML, al reporte regulatorio y al exportador «batch». Tres pasos:
 *   1. Datos de la instalación: el asistente pide lo que el proyecto no tiene (lo demás sale del plano calculado).
 *   2. Revisión: la memoria `radshield/memoria@1` tal como se exportará (secciones, puntos, conclusiones y sello).
 *   3. Exportar: DOCX, PDF y JSON del MISMO objeto; o importar un JSON `radshield/memoria@1` (validado contra el
 *      esquema y el sello) y volver a exportarlo.
 */
import { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Download, FileJson, FileText, FileUp, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import { useProyectoStore } from '@/stores/proyecto';
import { buildAnalyticMemorySnapshot, createFloorPlanEvidenceSources } from '@/lib/analyticMemoryEvidence';
import { construirMemoria, POR_COMPLETAR, SECCIONES_MEMORIA, type DatosInstalacion, type MemoriaAnalitica } from '@/lib/memoriaAnalitica';
import {
  barrerasCalculadas, camposPorCompletar, importarMemoriaJSON, nombreArchivoMemoria, salidaMemoria, type FormatoMemoria,
} from '@/lib/memoriaFlujo';
import type { FloorPlan } from '@/types/radshield';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  floorPlan?: FloorPlan;
}

type Paso = 'datos' | 'revision' | 'exportar';
const PASOS: { id: Paso; etiqueta: string }[] = [
  { id: 'datos', etiqueta: '1. Datos de la instalación' },
  { id: 'revision', etiqueta: '2. Revisión' },
  { id: 'exportar', etiqueta: '3. Exportar' },
];

const CAMPOS: { clave: keyof DatosInstalacion; etiqueta: string; ayuda: string }[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la instalación', ayuda: 'Si se deja vacío se usa el nombre del proyecto.' },
  { clave: 'razonSocial', etiqueta: 'Razón social', ayuda: 'Titular de la licencia ante la CNSNS.' },
  { clave: 'domicilio', etiqueta: 'Domicilio', ayuda: 'Domicilio de la instalación.' },
  { clave: 'responsableSR', etiqueta: 'Encargado de seguridad radiológica', ayuda: 'Responsable que revisa y firma.' },
  { clave: 'elaboro', etiqueta: 'Elaboró', ayuda: 'Autor del cálculo.' },
  { clave: 'revision', etiqueta: 'Revisión', ayuda: 'Número de revisión del documento (0 si se omite).' },
  { clave: 'clasificacionNOM003', etiqueta: 'Clasificación NOM-003-NUCL', ayuda: 'Medicina nuclear: II-A, II-B o II-C.' },
  { clave: 'nivel', etiqueta: 'Nivel o planta', ayuda: 'Ubicación dentro del inmueble.' },
];

const mm = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const ESTADO_CLASE: Record<string, string> = {
  CUMPLE: 'text-emerald-700', NO_CUMPLE: 'text-red-700', SIN_CALCULO: 'text-slate-500', SIN_ESPESOR: 'text-amber-700', REVISAR_MATERIAL: 'text-amber-700',
};

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MemoriaDialog({ open, onOpenChange, floorPlan: planoProp }: Props) {
  const planoAlmacen = useProyectoStore((s) => s.floorPlan);
  const plano = planoProp ?? planoAlmacen;
  const barrierResults = useProyectoStore((s) => s.barrierResults);
  const sampleLines = useProyectoStore((s) => s.sampleLines);
  // Procedencia del proyecto (sólo en pantalla; no entra en radshield/memoria@1): conteos y revisión CAD/DXF.
  const snapshot = useMemo(() => buildAnalyticMemorySnapshot(plano, barrierResults, sampleLines), [plano, barrierResults, sampleLines]);
  const fuenteDxf = useMemo(
    () => createFloorPlanEvidenceSources(plano, barrierResults, sampleLines).find((f) => f.id === 'ev-dxf-import-review'),
    [plano, barrierResults, sampleLines],
  );
  const [paso, setPaso] = useState<Paso>('datos');
  const [datos, setDatos] = useState<DatosInstalacion>({});
  const [importada, setImportada] = useState<{ memoria: MemoriaAnalitica; selloValido: boolean; archivo: string } | null>(null);
  const [exportando, setExportando] = useState<FormatoMemoria | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  const calculadas = barrerasCalculadas(plano).length;
  // Un solo objeto por estado del proyecto y datos: lo que se revisa es exactamente lo que se exporta.
  const delProyecto = useMemo(() => (calculadas ? construirMemoria(plano, datos) : null), [plano, datos, calculadas]);
  const memoria = importada?.memoria ?? delProyecto;
  const pendientes = memoria ? camposPorCompletar(memoria) : [];

  const exportar = async (formato: FormatoMemoria) => {
    if (!memoria) return;
    setExportando(formato);
    try {
      descargar(await salidaMemoria(memoria, formato), nombreArchivoMemoria(memoria, formato));
      toast.success(`Memoria ${formato.toUpperCase()} generada (sello ${memoria.sha256.slice(0, 12)})`);
    } catch (err) {
      toast.error(`No se pudo generar la memoria: ${(err as Error).message}`);
    } finally {
      setExportando(null);
    }
  };

  const importar = async (archivo: File | undefined) => {
    if (!archivo) return;
    try {
      const r = importarMemoriaJSON(await archivo.text());
      setImportada({ ...r, archivo: archivo.name });
      setPaso('revision');
      if (r.selloValido) toast.success('Memoria importada: esquema y sello válidos');
      else toast.warning('Memoria importada: el sello no coincide con el contenido (el documento fue modificado)');
    } catch (err) {
      toast.error(`No se pudo importar: ${(err as Error).message}`);
    } finally {
      if (archivoRef.current) archivoRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col" data-testid="memoria-unificada">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-orange-600" />
            Memoria analítica y CNSNS
            <Badge variant="outline" className="text-[10px]">radshield/memoria@1</Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {importada
              ? <>Memoria importada de «{importada.archivo}» (proyecto «{importada.memoria.origen.proyecto}»).</>
              : <>Memoria del proyecto «{plano.name}»: DOCX, PDF y JSON se generan del mismo documento. Lo que el proyecto no tiene queda «{POR_COMPLETAR}».</>}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 flex flex-wrap items-center gap-1" role="tablist">
          {PASOS.map((p) => (
            <Button key={p.id} role="tab" aria-selected={paso === p.id} size="sm" variant={paso === p.id ? 'default' : 'outline'}
              className="h-7 text-xs" onClick={() => setPaso(p.id)} data-testid={`memoria-paso-${p.id}`}>
              {p.etiqueta}
            </Button>
          ))}
          {memoria && (
            <span className="ml-auto text-[11px] text-slate-500" data-testid="memoria-sello" data-sha256={memoria.sha256}>
              Sello sha256 {memoria.sha256.slice(0, 12)}…
            </span>
          )}
        </div>

        {!importada && calculadas === 0 && (
          <div className="px-6 pb-2 space-y-1">
            <AvisoProyectoVacio floorPlan={plano} />
            <p className="text-xs text-amber-700" data-testid="memoria-vacio">
              El proyecto no tiene barreras calculadas: pulse «Calcular» antes de generar la memoria, o importe un JSON radshield/memoria@1.
            </p>
          </div>
        )}
        {importada && (
          <div className={`mx-6 mb-2 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${importada.selloValido ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`} data-testid="memoria-importada" data-sello-valido={importada.selloValido}>
            {importada.selloValido ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {importada.selloValido ? 'Esquema y sello válidos.' : 'Esquema válido, pero el sello no coincide: el contenido se modificó después de generarse.'}
            <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs" onClick={() => setImportada(null)} data-testid="memoria-volver-proyecto">Volver al proyecto</Button>
          </div>
        )}

        <ScrollArea className="px-6 pb-4 flex-1 min-h-0 max-h-[60vh]">
          {paso === 'datos' && (
            <div className="space-y-3" data-testid="memoria-datos">
              <p className="text-xs text-slate-600">
                Fuentes, cargas, ocupación, barreras, espesores y conclusiones salen del proyecto calculado. Aquí sólo se capturan los datos
                que el plano no contiene{importada ? ' (deshabilitado: la memoria importada se exporta tal cual)' : ''}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAMPOS.map((c) => (
                  <label key={c.clave} className="space-y-1 text-xs">
                    <span className="font-medium text-slate-700">{c.etiqueta}</span>
                    <Input className="h-8 text-xs" disabled={Boolean(importada)} data-testid={`memoria-campo-${c.clave}`}
                      placeholder={c.clave === 'nombre' ? plano.name : POR_COMPLETAR}
                      value={(datos[c.clave] as string | undefined) ?? ''}
                      onChange={(e) => setDatos((d) => ({ ...d, [c.clave]: e.target.value }))} />
                    <span className="block text-[11px] text-slate-500">{c.ayuda}</span>
                  </label>
                ))}
              </div>
              {!importada && (
                <div className="space-y-1" data-testid="memoria-procedencia">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px]" data-testid="memoria-evidence-snapshot">
                    {([['Barreras', snapshot.barriers], ['Fuentes', snapshot.sources], ['Zonas', snapshot.regions], ['Resultados', snapshot.results],
                      ['Líneas 0.3 m', snapshot.sampleLines], ['Puntos', snapshot.samplePoints]] as const).map(([etiqueta, valor]) => (
                      <div key={etiqueta} className="rounded border border-slate-200 bg-white px-2 py-1"><div className="font-semibold">{valor}</div><div className="truncate text-slate-500">{etiqueta}</div></div>
                    ))}
                  </div>
                  {fuenteDxf && (
                    <div className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] text-blue-900" data-testid="memoria-dxf-evidence-source">
                      <div className="font-semibold">Plano de origen CAD/DXF</div>
                      <div>Estado: {fuenteDxf.verificationStatus} · Hash: {fuenteDxf.excerptHash}</div>
                      <div className="truncate">{fuenteDxf.excerpt}</div>
                    </div>
                  )}
                </div>
              )}
              {memoria && (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" data-testid="memoria-pendientes">
                  <div><b>Tipo de instalación</b> (del proyecto): {memoria.instalacion.tipoInstalacion}</div>
                  <div><b>Actividades</b> (del proyecto): {memoria.instalacion.actividades.join(', ') || '—'}</div>
                  <div className="mt-1">
                    {pendientes.length
                      ? <>Quedan «{POR_COMPLETAR}»: {pendientes.join(', ')}.</>
                      : <>Todos los datos de la instalación están capturados.</>}
                  </div>
                </div>
              )}
            </div>
          )}

          {paso === 'revision' && (
            <div className="space-y-3 text-xs" data-testid="memoria-revision">
              {!memoria ? (
                <p className="text-slate-500">Sin memoria: calcule el proyecto o importe un JSON.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {SECCIONES_MEMORIA.map((s) => <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>)}
                  </div>
                  <div><b>Objetivo.</b> {memoria.objetivo}</div>
                  <div><b>Alcance.</b> {memoria.alcance}</div>
                  <div><b>Marco normativo.</b> {memoria.marcoNormativo.map((m) => m.id).join(' · ')}</div>
                  <table className="w-full border-collapse" data-testid="memoria-tabla-barreras">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-1 pr-2">Punto</th><th className="pr-2">Barrera</th><th className="pr-2">Material</th>
                        <th className="pr-2 text-right">Req. Pb (mm)</th><th className="pr-2 text-right">Req. concreto (mm)</th>
                        <th className="pr-2 text-right">Instalado (mm)</th><th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memoria.barreras.map((b) => (
                        <tr key={b.id} className="border-b border-slate-100" data-barrera={b.id}>
                          <td className="py-1 pr-2 font-mono">{b.punto}</td><td className="pr-2">{b.nombre}</td><td className="pr-2">{b.material}</td>
                          <td className="pr-2 text-right font-mono">{mm(b.requeridoPb_mm)}</td><td className="pr-2 text-right font-mono">{mm(b.requeridoConcreto_mm)}</td>
                          <td className="pr-2 text-right font-mono">{mm(b.instalado_mm)}</td>
                          <td className={ESTADO_CLASE[b.estado] ?? ''}>{b.estado.replace(/_/g, ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div data-testid="memoria-conclusiones">
                    <b>Conclusiones.</b>
                    <ul className="list-disc pl-5">{memoria.conclusiones.textos.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                  {memoria.advertencias.length > 0 && (
                    <div className="text-amber-800"><b>Advertencias.</b><ul className="list-disc pl-5">{memoria.advertencias.map((t) => <li key={t}>{t}</li>)}</ul></div>
                  )}
                </>
              )}
            </div>
          )}

          {paso === 'exportar' && (
            <div className="space-y-3 text-xs" data-testid="memoria-exportar">
              <p className="text-slate-600">
                Los tres formatos contienen el mismo documento (sello sha256 del contenido canónico). El documento es PRELIMINAR hasta que lo
                revise y firme el responsable.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="h-8 text-xs gap-1" disabled={!memoria || exportando !== null} onClick={() => exportar('docx')} data-testid="memoria-docx"><Download className="w-3.5 h-3.5" />DOCX</Button>
                <Button size="sm" className="h-8 text-xs gap-1" disabled={!memoria || exportando !== null} onClick={() => exportar('pdf')} data-testid="memoria-pdf"><Download className="w-3.5 h-3.5" />PDF</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" disabled={!memoria || exportando !== null} onClick={() => exportar('json')} data-testid="memoria-json"><FileJson className="w-3.5 h-3.5" />JSON radshield/memoria@1</Button>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="font-medium text-slate-700">Importar una memoria</div>
                <p className="text-slate-500">Un JSON radshield/memoria@1 se valida contra el esquema y el sello y se exporta a DOCX o PDF sin recalcular.</p>
                <input ref={archivoRef} type="file" accept="application/json,.json" className="hidden" data-testid="memoria-importar-archivo"
                  onChange={(e) => void importar(e.target.files?.[0])} />
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => archivoRef.current?.click()} data-testid="memoria-importar"><FileUp className="w-3.5 h-3.5" />Importar JSON</Button>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-3 border-t flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            {memoria ? `${memoria.conclusiones.cumplen} de ${memoria.conclusiones.total} barreras cumplen` : 'Sin cálculo'}
          </span>
          <div className="ml-auto flex gap-2">
            {paso !== 'datos' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaso(paso === 'exportar' ? 'revision' : 'datos')}>Anterior</Button>}
            {paso !== 'exportar' && <Button size="sm" className="h-7 text-xs" onClick={() => setPaso(paso === 'datos' ? 'revision' : 'exportar')} data-testid="memoria-siguiente">Siguiente</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
