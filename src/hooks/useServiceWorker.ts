/**
 * useServiceWorker - optional service worker registration.
 *
 * Disabled by default during static stabilization to avoid stale cached bundles.
 * Enable with VITE_ENABLE_SERVICE_WORKER=true when shipping a PWA build.
 */
import { rutaPublica } from '@/lib/rutaPublica';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function isServiceWorkerEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true';
}

/**
 * Fase 9: en GitHub Pages el origen (<usuario>.github.io) lo comparten otros sitios del mismo usuario. La limpieza sólo
 * toca los registros cuyo alcance cae dentro de la base de RadShield-MX y las cachés con su prefijo (ver sw-v50.js).
 */
export async function clearRadShieldServiceWorkerState(base: string = import.meta.env.BASE_URL ?? '/'): Promise<void> {
  const basePath = new URL(base, window.location.href).pathname;
  if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => new URL(registration.scope).pathname.startsWith(basePath))
        .map((registration) => registration.unregister()),
    );
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const propio = `radshield-${basePath}:`;
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(propio) || (basePath === '/' && /^radshield-(calcs-)?v\d+$/.test(name)))
        .map((name) => caches.delete(name)),
    );
  }
}

export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!isServiceWorkerEnabled()) {
      clearRadShieldServiceWorkerState().catch((err) => {
        console.warn('Service Worker cleanup failed:', err);
      });
      return;
    }

    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        toast.success('Calculo diferido completado');
      }
    };

    navigator.serviceWorker
      .register(rutaPublica('sw-v50.js'), { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        setSwRegistration(registration);
        setIsRegistered(true);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
              toast.info('Nueva version disponible', {
                description: 'Recarga para actualizar',
                action: { label: 'Recargar', onClick: () => window.location.reload() },
              });
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const requestSync = useCallback(async (tag: string = 'deferred-calculation') => {
    if (!isServiceWorkerEnabled()) return;
    if (!('serviceWorker' in navigator) || !swRegistration) return;
    try {
      await swRegistration.sync?.register(tag);
    } catch {
      // Background Sync not supported.
    }
  }, [swRegistration]);

  return { isRegistered, hasUpdate, requestSync };
}
