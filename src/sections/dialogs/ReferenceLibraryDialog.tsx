/**
 * Biblioteca de referencias: evidencia citada por GAMMA-AI (`gamma/evidencia@1`).
 *
 * Dos caminos, la misma verificación (SHA-256 del texto, identidad de la fuente):
 * - En vivo: consulta `GET /v1/ecosistema/evidencia` del servicio de GAMMA (`VITE_GAMMA_URL`).
 * - Archivo: el JSON que entrega GAMMA.
 * Cada cita verificada se puede copiar a la memoria con su identificador verificable.
 */
import { useState, type ChangeEvent, type FormEvent } from 'react';
import DialogShell from '@/components/DialogShell';
import {
  formatearCitaParaMemoria,
  verificarEvidenciaGamma,
  type ResultadoEvidencia,
} from '@/lib/gammaEvidence';
import { consultarGamma, urlGamma } from '@/lib/gammaCliente';

interface ReferenceLibraryDialogProps {
  open?: boolean;
  onClose?: () => void;
  onOpenEPA?: () => void;
  onOpenShleien?: () => void;
  onOpenICRU57?: () => void;
  onOpenICRU96?: () => void;
  /** Para pruebas: URL y fetch del servicio de GAMMA. */
  gammaUrl?: string;
  fetchFn?: typeof fetch;
}

export default function ReferenceLibraryDialog({
  open = true,
  onClose,
  onOpenEPA,
  onOpenShleien,
  onOpenICRU57,
  onOpenICRU96,
  gammaUrl,
  fetchFn,
}: ReferenceLibraryDialogProps) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvidencia | null>(null);
  const [copiada, setCopiada] = useState<number | null>(null);
  const [consulta, setConsulta] = useState('');
  const [enRevision, setEnRevision] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const servicio = gammaUrl ?? urlGamma();

  if (!open) return null;

  const cargar = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f.name);
    setCopiada(null);
    try {
      setResultado(await verificarEvidenciaGamma(JSON.parse(await f.text())));
    } catch {
      setResultado({ valida: false, errores: ['El archivo no es JSON válido.'], citas: [] });
    }
  };

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    const q = consulta.trim();
    if (!q || consultando) return;
    setConsultando(true);
    setCopiada(null);
    setArchivo(`GAMMA en vivo`);
    setResultado(await consultarGamma(q, { url: servicio ?? '', k: 5, revision: enRevision, fetchFn }));
    setConsultando(false);
  };

  const copiar = async (i: number) => {
    const cita = resultado?.citas[i];
    if (!cita?.verificada) return;
    await navigator.clipboard?.writeText(formatearCitaParaMemoria(cita));
    setCopiada(i);
  };

  const enlaces: Array<[string, (() => void) | undefined]> = [
    ['EPA', onOpenEPA],
    ['Shleien', onOpenShleien],
    ['ICRU 57', onOpenICRU57],
    ['ICRU 96', onOpenICRU96],
  ];

  return (
    <DialogShell
      title="Biblioteca de referencias"
      subtitle="Evidencia citada por GAMMA-AI · gamma/evidencia@1"
      gradientFrom="from-indigo-600"
      gradientTo="to-violet-700"
      maxWidth="max-w-3xl"
      onClose={() => onClose?.()}
    >
      <div className="space-y-4 p-4 text-sm" data-testid="reference-library">
        <p className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-900">
          La evidencia de GAMMA es experimental y no apta para firma. Cada cita se verifica contra su
          hash; una cita alterada se marca y no se puede copiar.
        </p>
        <form onSubmit={buscar} className="space-y-1" data-testid="gamma-live-form">
          <span className="font-medium">Consultar GAMMA en vivo</span>
          <div className="flex gap-2">
            <input
              type="search"
              aria-label="Consulta a GAMMA"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="p. ej. factor de uso NCRP 151"
              className="flex-1 rounded border px-2 py-1"
              disabled={!servicio}
            />
            <button type="submit" disabled={!servicio || consultando || !consulta.trim()} className="rounded border px-3 py-1 disabled:opacity-40">
              {consultando ? 'Consultando…' : 'Consultar'}
            </button>
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={enRevision} onChange={(e) => setEnRevision(e.target.checked)} />
            Incluir documentos en revisión (se declara en la evidencia)
          </label>
          {!servicio && (
            <p className="text-xs text-slate-500" data-testid="gamma-live-off">
              Servicio de GAMMA no configurado (VITE_GAMMA_URL). Use el archivo de evidencia.
            </p>
          )}
        </form>
        <label className="block">
          <span className="font-medium">Archivo de evidencia de GAMMA (.json)</span>
          <input type="file" accept="application/json,.json" onChange={cargar} className="mt-1 block" data-testid="gamma-evidence-input" />
        </label>

        {resultado && (
          <div className="space-y-2">
            <div className={resultado.valida ? 'text-emerald-700' : 'text-red-700'} data-testid="gamma-evidence-status">
              {archivo}: {resultado.valida ? `${resultado.citas.length} citas verificadas` : 'evidencia rechazada'}
              {resultado.evidencia ? ` · consulta «${resultado.evidencia.consulta}» (${resultado.evidencia.perfil})` : ''}
            </div>
            {!resultado.valida && (
              <ul className="list-disc pl-5 text-red-700">
                {resultado.errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <ol className="space-y-2">
              {resultado.citas.map((c, i) => (
                <li key={`${c.fragmento_sha256}-${i}`} className="rounded border p-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {c.verificada ? '✓ verificada' : `✗ ${c.motivo}`} · {c.source_id}
                      {c.pagina ? ` · p. ${c.pagina}` : ''}
                    </span>
                    <button
                      type="button"
                      disabled={!c.verificada}
                      onClick={() => copiar(i)}
                      className="rounded border px-2 py-0.5 disabled:opacity-40"
                    >
                      {copiada === i ? 'Copiada' : 'Copiar para memoria'}
                    </button>
                  </div>
                  <p className="mt-1 text-slate-800">{c.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3 text-xs">
          <span className="text-slate-500">Referencias integradas:</span>
          {enlaces.map(([nombre, abrir]) =>
            abrir ? (
              <button key={nombre} type="button" onClick={abrir} className="rounded border px-2 py-0.5">
                {nombre}
              </button>
            ) : null,
          )}
        </div>
      </div>
    </DialogShell>
  );
}
