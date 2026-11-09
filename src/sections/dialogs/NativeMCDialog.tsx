// Fase 9: desactivado. Antes simulaba con lib/nativeMCEngine sin validación (Fase 8c sólo lo rotuló).
import HerramientaDesactivada from '@/components/HerramientaDesactivada';

export default function NativeMCDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <HerramientaDesactivada
      open={open}
      onClose={() => onOpenChange(false)}
      titulo="Motor Monte Carlo nativo"
      motivo="El transporte de fotones en el navegador (lib/nativeMCEngine) usa un generador aleatorio propio y no tiene caso de validación contra una transmisión de banda ancha conocida; sus dosis e incertidumbres no son resultados."
      alternativa="Para diseño use las calculadoras normativas (NCRP 147/151, TG-108). Para Monte Carlo, genere el macro en «Integración Monte Carlo» y córralo en Geant4, MCNP6 o FLUKA."
    />
  );
}
