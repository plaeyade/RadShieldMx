/**
 * ═══════════════════════════════════════════════════════════
 * Sentry Integration — Full Error Tracking
 * ═══════════════════════════════════════════════════════════
 */
import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;
let sentryInitialized = false;

export function initSentry(dsn?: string): void {
  if (sentryInitialized) return;
  
  const actualDsn = dsn || import.meta.env.VITE_SENTRY_DSN;
  
  if (!actualDsn) {
    if (isDev) console.log('[Sentry] No DSN configured — error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: actualDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ 
          maskAllText: false, 
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: isDev ? 1.0 : 0.2,
      replaysSessionSampleRate: isDev ? 0.1 : 0.01,
      replaysOnErrorSampleRate: 1.0,
      environment: isDev ? 'development' : 'production',
      release: `radshield-mx@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
      beforeSend(event) {
        // Sanitize sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
        return event;
      },
    });
    sentryInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (err) {
    console.warn('[Sentry] Failed to initialize:', err);
  }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    if (isDev) console.error('[Sentry Stub]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!sentryInitialized) {
    if (isDev) console.log(`[Sentry Stub] ${level}: ${message}`);
    return;
  }
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!sentryInitialized) return;
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  if (!sentryInitialized) return;
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

// Re-export ErrorBoundary for convenience
export const SentryErrorBoundary = Sentry.ErrorBoundary;
