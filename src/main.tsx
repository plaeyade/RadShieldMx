import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from '@/providers/trpc'
import { I18nProvider } from '@/hooks/useI18n'
import { DarkModeProvider } from '@/hooks/useDarkMode'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'
import { initSentry } from '@/lib/sentry'
import App from './App.tsx'

// ═══ Sentry Error Tracking (Recomendacion C.3) ═══
// Set VITE_SENTRY_DSN env var to activate. Stub mode in dev.
initSentry(import.meta.env.VITE_SENTRY_DSN);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <GlobalErrorBoundary>
      <HashRouter>
        <TRPCProvider>
          <I18nProvider>
            <DarkModeProvider>
              <App />
            </DarkModeProvider>
          </I18nProvider>
        </TRPCProvider>
      </HashRouter>
    </GlobalErrorBoundary>
  );
}
