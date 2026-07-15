export function getDefaultOrthancUrl(): string {
  return import.meta.env.VITE_ORTHANC_URL || '';
}

export function isPacsRealEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PACS_REAL === 'true';
}

export function isOrthancConfigured(url = getDefaultOrthancUrl()): boolean {
  return isPacsRealEnabled() && url.trim().length > 0;
}
