// Fase 9: desactivado. Antes dibujaba un histograma y una convergencia generados a partir de un JSON que nada asignaba (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function MCResultsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void; resultJson?: string | null }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Resultados Monte Carlo"
      motivo="La app no ejecuta ni importa simulaciones Monte Carlo, así que no hay resultados que mostrar; el histograma y la curva de convergencia eran curvas generadas."
      alternativa="Corra el macro de «Integración Monte Carlo» en el código externo y compare con la referencia de NCRP 151 que muestra ese diálogo."
    />
  );
}
