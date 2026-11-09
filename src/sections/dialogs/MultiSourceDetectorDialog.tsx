// Fase 9: desactivado. Antes mostraba resultados de un modelo propio sin validar (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function MultiSourceDetectorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Multi-fuente / multi-detector"
      motivo="El modelo de lib/multiSourceDetector no está validado contra el motor de dosis (dosisEnPunto) y sus incertidumbres son simuladas."
      alternativa="La dosis de varias fuentes en puntos del plano la calcula el motor: coloque las fuentes y los puntos críticos en el plano y ejecute el cálculo."
    />
  );
}
