// Fase 9: desactivado. Antes animaba un campo A·½^(t/T½)/d² en unidades arbitrarias (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function AnimatedDoseMapsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Mapas de dosis animados"
      motivo="El mapa era ilustrativo, en unidades arbitrarias, con F-18 fijo: no usaba el plano ni el motor de dosis."
      alternativa="Los visores de dosis del plano (mapa de calor, isodosis) siguen en revisión visual y se activarán con sus banderas; mientras tanto use los resultados por barrera del panel de resultados."
    />
  );
}
