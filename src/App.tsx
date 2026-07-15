import { Routes, Route } from 'react-router';
import ShieldingDesigner from '@/pages/ShieldingDesigner';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { useWebVitals } from '@/hooks/useWebVitals';
import { SentryErrorBoundary, captureException } from '@/lib/sentry';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function FallbackError({ error, resetError }: { error: unknown; resetError: () => void }) {
  const normalizedError = toError(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8">
      <div className="max-w-lg w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-xl font-bold">Error en la aplicación</h1>
        <p className="text-sm text-slate-400">El error ha sido reportado automáticamente. Puedes intentar recargar.</p>
        <div className="bg-slate-800 rounded p-3 text-left">
          <code className="text-xs text-red-300 break-all">{normalizedError.message}</code>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={resetError} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors">Reintentar</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors">Recargar página</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useWebVitals();
  return (
    <SentryErrorBoundary
      fallback={FallbackError}
      onError={(error) => captureException(toError(error), { location: 'App.tsx root boundary' })}
    >
      <Routes>
        <Route path="/" element={<ShieldingDesigner />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SentryErrorBoundary>
  );
}
