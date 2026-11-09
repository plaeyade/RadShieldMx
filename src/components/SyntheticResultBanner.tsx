// Etapa 0 (contención): marca resultados que NO provienen de un cálculo validado.
// Los diálogos que la usan generan datos sintéticos (ruido aleatorio o curvas paramétricas); no son Monte Carlo.
export function SyntheticResultBanner({ detalle }: { detalle?: string }) {
  return (
    <div role="alert" className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
      <strong>DEMOSTRACIÓN — resultados sintéticos.</strong> Esta herramienta no ejecuta transporte de partículas ni un
      cálculo validado; los valores incluyen ruido aleatorio o curvas de ejemplo. No usar para diseño ni firma.
      {detalle ? <span className="block mt-1">{detalle}</span> : null}
    </div>
  );
}

export function NotForSignatureNotice() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-[9999] -translate-x-1/2 rounded-t-md bg-amber-500/95 px-3 py-0.5 text-[10px] font-semibold text-black shadow">
      Resultados preliminares — no válidos para firma ni presentación regulatoria (pendiente validación del núcleo de cálculo)
    </div>
  );
}

/** Sella cada página de un jsPDF con la leyenda de etapa 0. */
export function stampNotForSignature(doc: { getNumberOfPages(): number; setPage(n: number): unknown; setFontSize(n: number): unknown;
  setTextColor(r: number, g: number, b: number): unknown; text(t: string, x: number, y: number, o?: unknown): unknown;
  internal: { pageSize: { getWidth(): number; getHeight(): number } } }): void {
  const n = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(180, 0, 0);
    doc.text('PRELIMINAR — no válido para firma ni presentación regulatoria (núcleo de cálculo pendiente de validación)', w / 2, h - 4, { align: 'center' });
  }
}

/**
 * Fase 8c: rotula datos de ejemplo (bitácoras, tableros, comparadores) que no salen del proyecto ni de un registro real.
 */
export function DatosEjemploBanner({ detalle }: { detalle: string }) {
  return (
    <div role="note" data-testid="datos-ejemplo" className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <strong>DATOS DE EJEMPLO.</strong> {detalle}
    </div>
  );
}
