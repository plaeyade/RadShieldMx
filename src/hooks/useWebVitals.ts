/**
 * useWebVitals — C.10: Web Vitals Performance Monitoring
 * Google Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1, TTFB, FCP, INP
 * https://web.dev/vitals/
 */
import { useEffect, useState, useCallback } from 'react';

interface WebVitalsReport {
  lcp: number | null;      // Largest Contentful Paint (ms)
  fid: number | null;      // First Input Delay (ms)
  cls: number | null;      // Cumulative Layout Shift
  fcp: number | null;      // First Contentful Paint (ms)
  ttfb: number | null;     // Time to First Byte (ms)
  inp: number | null;      // Interaction to Next Paint (ms)
}

export function useWebVitals(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<WebVitalsReport>({
    lcp: null, fid: null, cls: null, fcp: null, ttfb: null, inp: null,
  });
  const [sent, setSent] = useState(false);

  const isGood = useCallback((m: WebVitalsReport) => ({
    lcp: (m.lcp || 9999) < 2500,
    fid: (m.fid || 9999) < 100,
    cls: (m.cls || 9999) < 0.1,
    fcp: (m.fcp || 9999) < 1800,
    ttfb: (m.ttfb || 9999) < 600,
    inp: (m.inp || 9999) < 200,
  }), []);

  useEffect(() => {
    if (!enabled) return;
    const nav = performance as any;

    // TTFB + FCP from Navigation Timing
    const onLoad = () => {
      const t = nav.timing;
      if (t) {
        setMetrics(prev => ({
          ...prev,
          ttfb: t.responseStart - t.navigationStart,
          fcp: t.domContentLoadedEventEnd - t.navigationStart,
        }));
      }
    };
    window.addEventListener('load', onLoad);

    // LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry?.startTime) {
        setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }));
      }
    });
    try { lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] }); } catch { /* */ }

    // CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
    });
    try { clsObserver.observe({ entryTypes: ['layout-shift'] }); } catch { /* */ }

    // FID
    const fidObserver = new PerformanceObserver((list) => {
      const firstEntry = list.getEntries()[0] as any;
      if (firstEntry?.processingStart && firstEntry?.startTime) {
        setMetrics(prev => ({ ...prev, fid: Math.round(firstEntry.processingStart - firstEntry.startTime) }));
      }
    });
    try { fidObserver.observe({ type: 'first-input', buffered: true } as any); } catch { /* */ }

    // INP
    let inpValue = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const dur = (entry as any).duration;
        if (dur > inpValue) inpValue = dur;
      }
      setMetrics(prev => ({ ...prev, inp: Math.round(inpValue) }));
    });
    try { inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 0 } as any); } catch { /* */ }

    return () => {
      window.removeEventListener('load', onLoad);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
      inpObserver.disconnect();
    };
  }, [enabled]);

  const sendAnalytics = useCallback(() => {
    if (sent) return;
    setSent(true);
    // Send to console (replace with actual analytics endpoint)
    console.log('[WebVitals]', metrics, isGood(metrics));
  }, [metrics, sent, isGood]);

  return { metrics, isGood: isGood(metrics), sendAnalytics };
}
