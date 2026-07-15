/**
 * ═══════════════════════════════════════════════════════════
 * Structured Logger — C.13 Reemplaza console.* con logging controlado
 * ═══════════════════════════════════════════════════════════
 */
const IS_DEV = import.meta.env.DEV;
const LOG_LEVEL = (import.meta.env.VITE_LOG_LEVEL || (IS_DEV ? 'debug' : 'warn')) as LogLevel;

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

interface LogMeta {
  [key: string]: unknown;
}

/** Send to external service (Sentry/analytics) if available */
function sendToExternal(level: LogLevel, message: string, meta?: LogMeta) {
  if (level === 'error') {
    try {
      const { captureException } = require('@/lib/sentry');
      captureException(new Error(message), meta);
    } catch { /* sentry not available */ }
  }
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    if (!shouldLog('debug')) return;
    if (IS_DEV) console.debug(`[DEBUG] ${message}`, meta || '');
  },

  info(message: string, meta?: LogMeta) {
    if (!shouldLog('info')) return;
    if (IS_DEV) console.info(`[INFO] ${message}`, meta || '');
  },

  warn(message: string, meta?: LogMeta) {
    if (!shouldLog('warn')) return;
    console.warn(`[WARN] ${message}`, meta || '');
    sendToExternal('warn', message, meta);
  },

  error(message: string, meta?: LogMeta) {
    if (!shouldLog('error')) return;
    console.error(`[ERROR] ${message}`, meta || '');
    sendToExternal('error', message, meta);
  },

  /** Log performance timing */
  perf(label: string, startMs: number) {
    const duration = Math.round(performance.now() - startMs);
    this.debug(`${label}: ${duration}ms`, { duration });
  },

  /** Log state changes for debugging */
  stateChange(component: string, key: string, from: unknown, to: unknown) {
    this.debug(`[${component}] ${key} changed`, { from, to });
  },
};

/** Replace global console in production */
export function installLogger() {
  if (!IS_DEV) {
    (window as any).__originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    console.debug = () => {};
    console.log = () => {};
  }
}

export default logger;
