/**
 * WithErrorBoundary — Wrapper HOC para aplicar ErrorBoundary a cada dialog
 * Fase 1.1: Aplicar ErrorBoundary alrededor de cada dialog lazy-loaded
 */
import { Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface DialogProps {
  open: boolean;
  onClose?: () => void;
  [key: string]: unknown;
}

function DialogFallback() {
  return (
    <div className="p-6 flex items-center justify-center" role="status" aria-live="polite">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-red-700 rounded-full animate-spin" />
      <span className="sr-only">Cargando diálogo...</span>
    </div>
  );
}

export function withErrorBoundary<P extends DialogProps>(
  Component: LazyExoticComponent<ComponentType<P>>,
  dialogName: string
) {
  return function WrappedDialog(props: P) {
    if (!props.open) return null;
    return (
      <ErrorBoundary dialogName={dialogName} onReset={() => props.onClose?.()}>
        <Suspense fallback={<DialogFallback />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}
