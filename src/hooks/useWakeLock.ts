/**
 * ═══════════════════════════════════════════════════════════
 * useWakeLock — Screen Wake Lock API (D.1)
 * Keeps screen awake during long calculations
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from "react";

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [supported, setSupported] = useState(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    setSupported("wakeLock" in navigator);
  }, []);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) return false;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      setIsLocked(true);
      wakeLockRef.current.addEventListener("release", () => {
        setIsLocked(false);
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  // Auto-release on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && isLocked) {
        request();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [isLocked, request]);

  return { isLocked, supported, request, release };
}
