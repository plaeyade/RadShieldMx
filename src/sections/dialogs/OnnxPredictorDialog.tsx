// OnnxPredictorDialog (clave `onnxPredictor`) — espesor de blindaje para una sala PET con AAPM TG-108.
// Fase 7: antes se anunciaba como «ONNX Runtime» y usaba W = GBq × 1000 sin constante gamma y un TVL heurístico con
// confianza fija. Ahora: dosis semanal con Γ, absorción del paciente y decaimiento (TG-108 Ec. 2–3 y 9–10) y
// transmisión de banda ancha a 511 keV (Tabla V), con `blindajePET`. No hay modelo de aprendizaje automático.
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Brain, Info } from 'lucide-react';
import EntradaFuentePET from '@/components/EntradaFuentePET';
import { PET_INICIAL } from '@/lib/calculadorasNormativas';
import { MATERIALES_PET, NOMBRE_MATERIAL, blindajePET, type EntradaPET } from '@/lib/calculadorasNormativas';

export default function OnnxPredictorDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.onnxPredictor));
  const close = () => useAppStore.getState().close('onnxPredictor');
  const [e, setE] = useState<EntradaPET>(PET_INICIAL);
  const { r, error } = useMemo(() => {
    try { return { r: blindajePET({ ...e, T: Math.min(1, e.T) }), error: null }; } catch (err) { return { r: null, error: (err as Error).message }; }
  }, [e]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-purple-500" /> Espesor de blindaje PET — AAPM TG-108
            <Badge variant="outline" className="text-[9px]">Tabla V, 511 keV</Badge>
          </DialogTitle>
          <DialogDescription className="text-[10px]">Cálculo analítico con TG-108 (no es un modelo de aprendizaje automático). Valores iniciales: Ejemplo 1 de TG-108 (1.2 cm de plomo o 15 cm de concreto).</DialogDescription>
        </DialogHeader>
        <EntradaFuentePET v={e} onChange={setE} prefijo="onnx" />
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        {r && (
          <div className="border rounded-md p-3 bg-slate-50 space-y-2 mt-3 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div>Dosis semanal sin blindaje: <strong>{(r.D_mSv_semana * 1000).toFixed(1)} μSv/semana</strong></div>
              <div>Transmisión requerida B = P/(T·D): <strong data-testid="onnx-B">{r.B_requerida.toFixed(3)}</strong></div>
            </div>
            <table className="w-full">
              <thead><tr className="text-left text-slate-500"><th>Material</th><th>Espesor requerido</th></tr></thead>
              <tbody>
                {MATERIALES_PET.map(m => (
                  <tr key={m} className="border-t"><td>{NOMBRE_MATERIAL[m]}</td>
                    <td className="font-mono" data-testid={`onnx-${m}`}>{r.espesores_mm[m].toFixed(1)} mm</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-400 flex items-start gap-1"><Info className="w-3 h-3 shrink-0" />{r.referencia}. B ≥ 1: no se requiere blindaje. Para nucleidos no PET use Medicina Nuclear Avanzada.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
