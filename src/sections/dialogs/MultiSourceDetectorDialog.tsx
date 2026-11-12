// Fase 9: desactivado (el modelo lib/multiSourceDetector se borró en la depuración, etapa 2). Antes mostraba resultados de un modelo propio sin validar (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function MultiSourceDetectorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Multi-fuente / multi-detector"
      motivo="El modelo propio de esta herramienta no estaba validado contra el motor de dosis (dosisEnPunto) y sus incertidumbres eran simuladas; se retiró del código."
      alternativa="La dosis de varias fuentes en puntos del plano la calcula el motor: coloque las fuentes y los puntos críticos en el plano y ejecute el cálculo."
    />
  );
}
