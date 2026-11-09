/**
 * NeutronShieldingDialog — Fase 8c: se retiró el modelo propio (Gy/h × Gy/semana, rendimientos y TVL fijos). Los
 * neutrones se calculan en el diálogo `neutron` (H₀ de la Tabla B.9 de NCRP 151 y puerta de BPE, §7.1.13) y el
 * laberinto en `maze`.
 */
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import RedireccionDialogo from '@/components/RedireccionDialogo';
export default function NeutronShieldingDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.neutronShielding));
  const close = () => useAppStore.getState().close('neutronShielding');
  return (
    <RedireccionDialogo open={open} onClose={close} titulo="Blindaje de neutrones"
      motivo="El blindaje de neutrones se calcula en el diálogo de neutrones (H₀ por Gy de NCRP 151 Tabla B.9 y puerta con polietileno borado, §7.1.13). El modelo anterior mezclaba Gy/h con Gy/semana."
      destino="neutron" etiquetaDestino="Abrir neutrones (NCRP 151)" />
  );
}
