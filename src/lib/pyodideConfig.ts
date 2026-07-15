const PYODIDE_CDN_MODULE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs';

export function getPyodideModuleUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_PYODIDE_URL;
  if (configuredUrl) return configuredUrl;
  if (import.meta.env.VITE_ENABLE_PYODIDE_CDN === 'true') return PYODIDE_CDN_MODULE_URL;
  return null;
}

export function isPyodideConfigured(): boolean {
  return getPyodideModuleUrl() !== null;
}

export function getPyodideIndexUrl(moduleUrl: string): string {
  const lastSlash = moduleUrl.lastIndexOf('/');
  if (lastSlash === -1) return './';
  return moduleUrl.slice(0, lastSlash + 1);
}
