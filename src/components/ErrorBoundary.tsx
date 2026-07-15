/**
 * ErrorBoundary — Fase 1.1: React Error Boundaries para cada dialog
 * Captura errores en componentes hijos, previene crash total de la app
 * Ref: react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  dialogName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.dialogName ? `:${this.props.dialogName}` : ''}]`, error, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center" role="alert" aria-live="assertive">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-700 mb-1">
            Error en {this.props.dialogName || 'el componente'}
          </h3>
          <p className="text-xs text-red-600 mb-1 max-w-md">
            {this.state.error?.message || 'Error desconocido'}
          </p>
          {this.state.errorInfo && (
            <pre className="text-[9px] text-slate-400 bg-slate-50 p-2 rounded max-w-md overflow-auto max-h-24 mb-3">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reintentar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
