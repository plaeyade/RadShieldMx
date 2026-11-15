/**
 * CapaModal — capa `role="dialog" aria-modal` de las ventanas propias (DialogShell, FullscreenShell y las ventanas a
 * pantalla completa que no usan Radix). Cierra con Escape sólo si es la capa más alta, pide confirmación si hay cambios
 * sin guardar, y lleva el foco a la ventana al abrir y de vuelta al disparador al cerrar (ver `useCierreConEscape`).
 */
import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useCierreConEscape } from '@/hooks/useCierreConEscape';

export interface CapaModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Cierra la ventana (la misma acción que el botón X). */
  onCerrar: () => void;
  /** Devuelve `false` para cancelar el cierre con Escape (p. ej. «¿Descartar los cambios?»). */
  confirmarCierre?: () => boolean;
  /** Sólo cierra con Escape si el foco está dentro (ventana minimizada que deja pasar el puntero). */
  exigirFocoDentro?: boolean;
  children: ReactNode;
}

export default function CapaModal({ onCerrar, confirmarCierre, exigirFocoDentro, className, children, ...resto }: CapaModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useCierreConEscape(ref, { onCerrar, confirmarCierre, exigirFocoDentro });
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`outline-none ${className ?? ''}`}
      data-cierre-escape="true"
      {...resto}
    >
      {children}
    </div>
  );
}
