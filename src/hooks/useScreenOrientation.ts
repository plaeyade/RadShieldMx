/** useScreenOrientation — D.7: Lock to landscape on tablets */
import { useState, useEffect, useCallback } from 'react';
export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<ScreenOrientation | null>(null);
  const [supported] = useState(() => 'orientation' in screen);
  useEffect(() => {
    if (!supported) return;
    const o = screen.orientation as ScreenOrientation;
    setOrientation(o);
    const handler = () => setOrientation({ ...o } as ScreenOrientation);
    o.addEventListener('change', handler);
    return () => o.removeEventListener('change', handler);
  }, [supported]);
  const lock = useCallback(async (type: OrientationLockType = 'landscape') => {
    try { await (screen.orientation as any).lock(type); } catch { /* silent */ }
  }, []);
  const unlock = useCallback(() => { screen.orientation?.unlock?.(); }, []);
  return { orientation, supported, lock, unlock };
}
