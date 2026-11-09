// Fase 9: desactivado. Antes reconstruía contornos aleatorios (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function ShapesReconstructionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Reconstrucción de formas (RTSTRUCT)"
      motivo="Los contornos se generaban al azar: la app no tiene un lector de RTSTRUCT conectado a esta herramienta, así que la superficie, el volumen y las métricas no correspondían a ningún estudio."
      alternativa="Para importar estructuras use «Importar RTSTRUCT» (DICOMRTSTRUCTDialog)."
    />
  );
}
