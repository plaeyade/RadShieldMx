import { useState, useEffect, useCallback } from 'react';

export interface StorageInfo { usage: number; quota: number; percent: number; isWarning: boolean; isCritical: boolean }

export function useStorageQuota() {
  const [info, setInfo] = useState<StorageInfo>({ usage: 0, quota: 0, percent: 0, isWarning: false, isCritical: false });

  const refresh = useCallback(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        const usage = est.usage || 0;
        const quota = est.quota || 1;
        const percent = Math.round((usage / quota) * 100);
        setInfo({ usage, quota, percent, isWarning: percent > 80, isCritical: percent > 95 });
      }
    } catch { /* unsupported */ }
  }, []);

  useEffect(() => { refresh(); const iv = setInterval(refresh, 60000); return () => clearInterval(iv); }, [refresh]);

  const formatBytes = (b: number) => {
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return { ...info, formatUsage: () => formatBytes(info.usage), formatQuota: () => formatBytes(info.quota), refresh };
}
