// Fase 9: desactivado. Antes mostraba métricas simuladas (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function PerformanceDashboardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={onClose}
      titulo="Tablero de rendimiento"
      motivo="La memoria, los tiempos y las calificaciones eran valores simulados (aleatorios o fijos), no mediciones del navegador ni del motor de cálculo."
      alternativa="Para medir el rendimiento real use las herramientas de desarrollo del navegador (pestaña Rendimiento)."
    />
  );
}
