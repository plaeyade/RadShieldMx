/**
 * NeutronMazeDialog — Fase 8c: se retiró el modelo propio (atenuación 10^(−L/TVL) por tramo con TVL de 450 mm y un
 * «factor de captura» sin fuente), que duplicaba la calculadora de laberinto. La calculadora validada (`maze`) usa
 * NCRP 151 §2.4: Kersey y Wu–McGinley para neutrones, captura gamma (Ec. 2.16–2.19) y fotones en la puerta.
 */
import RedireccionDialogo from '@/components/RedireccionDialogo';
interface Props { open: boolean; onClose: () => void; }

export default function NeutronMazeDialog({ open, onClose }: Props) {
  return (
    <RedireccionDialogo open={open} onClose={onClose} titulo="Laberinto con neutrones"
      motivo="Este cálculo se hace en la calculadora de laberinto y puerta (NCRP 151 §2.4: Kersey / Wu–McGinley, captura gamma y fotones), validada contra los ejemplos del §7.1. El modelo anterior por TVL de tramo no tenía referencia."
      destino="maze" etiquetaDestino="Abrir laberinto y puerta (NCRP 151)" />
  );
}
