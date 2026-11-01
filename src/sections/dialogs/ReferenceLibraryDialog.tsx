/**
 * Biblioteca de referencias: evidencia citada por GAMMA-AI (`gamma/evidencia@1`).
 *
 * Carga el JSON que entrega GAMMA, verifica cada cita (SHA-256 del texto, identidad de la fuente)
 * y permite copiarla a la memoria con su identificador verificable. Sustituye al antiguo Stub.
 */
import { useState, type ChangeEvent } from 'react';
import DialogShell from '@/components/DialogShell';
import {
  formatearCitaParaMemoria,
  verificarEvidenciaGamma,
  type ResultadoEvidencia,
} from '@/lib/gammaEvidence';

interface ReferenceLibraryDialogProps {
  open?: boolean;
  onClose?: () => void;
  onOpenEPA?: () => void;
  onOpenShleien?: () => void;
  onOpenICRU57?: () => void;
  onOpenICRU96?: () => void;
}

export default function ReferenceLibraryDialog({
  open = true,
  onClose,
  onOpenEPA,
  onOpenShleien,
  onOpenICRU57,
  onOpenICRU96,
}: ReferenceLibraryDialogProps) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvidencia | null>(null);
  const [copiada, setCopiada] = useState<number | null>(null);

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
