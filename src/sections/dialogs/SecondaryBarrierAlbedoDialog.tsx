/**
 * SecondaryBarrierAlbedoDialog — Fase 8c: se retiró el modelo H·Πα(dᵢ/dᵢ₊₁)², que omitía el área de reflexión A
 * (las ecuaciones de NCRP 151 §2.4 usan α·A/(dᵢ²·dⱼ²)) y usaba albedos sin fuente. Las reflexiones múltiples se calculan
 * en la calculadora de laberinto (`ncrp151Laberinto`, Tablas B.8a/B.8b).
 */
import RedireccionDialogo from '@/components/RedireccionDialogo';
interface Props { open: boolean; onClose: () => void; }

export default function SecondaryBarrierAlbedoDialog({ open, onClose }: Props) {
  return (
    <RedireccionDialogo open={open} onClose={onClose} titulo="Reflexiones (albedo)"
      motivo="Las reflexiones en paredes se calculan con NCRP 151 §2.4 (α·A/(dᵢ·dⱼ)², albedos de las Tablas B.8a/B.8b) en la calculadora de laberinto y puerta. El modelo anterior omitía el área reflectora."
      destino="maze" etiquetaDestino="Abrir laberinto y puerta (NCRP 151)" />
  );
}
