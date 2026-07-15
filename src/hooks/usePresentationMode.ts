/** usePresentationMode — A.12: Fullscreen presentation mode for training */
import { useState, useCallback } from 'react';
export function usePresentationMode() {
  const [isPresentation, setIsPresentation] = useState(false);
  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsPresentation(true);
    } catch { /* silent */ }
  }, []);
  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsPresentation(false);
  }, []);
  const toggle = useCallback(() => {
    isPresentation ? exit() : enter();
  }, [isPresentation, enter, exit]);
  return { isPresentation, enter, exit, toggle };
}
