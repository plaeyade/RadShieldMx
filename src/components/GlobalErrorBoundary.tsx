/**
 * GlobalErrorBoundary — v50.4: ErrorBoundary de nivel superior (top-level)
 * Captura TODOS los errores de la aplicación sin necesitar EB por dialog.
 * Ref: react.dev/reference/react/Component#catching-rendering-errors
 */
import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: any; }

export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, errorInfo.componentStack);
    this.setState({ errorInfo });
    // En producción: enviar a servicio de monitoreo (Sentry, etc.)
    if (typeof (window as any).analytics?.track === 'function') {
      (window as any).analytics.track('error_boundary_triggered', {
        error: error.message,
        stack: error.stack?.slice(0, 500),
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" role="alert" aria-live="assertive">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Error en RadShield-MX</h1>
            <p className="text-sm text-slate-500 mb-4">
              Se produjo un error inesperado. No se ha perdido ningún dato.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-semibold mb-1">
                  <Bug className="w-3 h-3" /> {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <pre className="text-[8px] text-slate-400 overflow-auto max-h-24 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Recargar app
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" size="sm">
                <Home className="w-3.5 h-3.5 mr-1.5" /> Inicio
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">
              Si el error persiste, contacte soporte técnico con el mensaje de error.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
