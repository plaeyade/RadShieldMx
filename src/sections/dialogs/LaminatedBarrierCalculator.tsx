/**
 * LaminatedBarrierCalculator — barrera laminada (p. ej. plomo + concreto).
 * Fase 8c: antes usaba un solo TVL por capa (tabla propia) y textos en inglés. Ahora es el mismo cálculo multicapa
 * de la Fase 7 (`blindajeMulticapa`: B_total = Π Bᵢ con TVL₁/TVLₑ de NCRP 151 o Archer de NCRP 147, y la dosis
 * detrás con K¹ o W·U/d²).
 */
import MultiLayerShieldDialog from './MultiLayerShieldDialog';

interface LaminatedBarrierCalculatorProps {
  open: boolean;
  onClose: () => void;
}

export default function LaminatedBarrierCalculator({ open, onClose }: LaminatedBarrierCalculatorProps) {
  return <MultiLayerShieldDialog open={open} onClose={onClose} />;
}
