// =============================================================================
// cloudSync.ts — Backend API & Cloud Sync Service
// RESTful API client for project synchronization, backup, and collaboration
// =============================================================================

// ── Types ──
export interface CloudProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  sizeBytes: number;
  checksum: string;
}

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'conflict' | 'offline' | 'error';
  lastSyncAt: string | null;
  pendingChanges: number;
  serverProjects: number;
  localProjects: number;
  message: string;
}

export interface CloudUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  institution: string;
  license: 'free' | 'pro' | 'enterprise';
}

// ── Configuration ──
const CLOUD_SYNC_DISABLED_MESSAGE = 'Cloud Sync is offline. Configure radshield_api_url or VITE_CLOUD_API_URL to enable remote sync.';

let authToken: string | null = null;

function getApiBase(): string {
  if (import.meta.env.VITE_CLOUD_API_URL) return import.meta.env.VITE_CLOUD_API_URL;
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('radshield_api_url') || '';
}

export function isCloudSyncEnabled(): boolean {
  return Boolean(getApiBase());
}

export function setApiBase(url: string) {
  localStorage.setItem('radshield_api_url', url);
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('radshield_auth_token', token);
  else localStorage.removeItem('radshield_auth_token');
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Version': '17.0.0',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

// ── API Functions ──

/** Health check */
export async function apiHealthCheck(): Promise<{ status: string; version: string; timestamp: string }> {
  const apiBase = getApiBase();
  if (!apiBase) return { status: 'offline', version: 'static', timestamp: new Date().toISOString() };
  try {
    const resp = await fetch(`${apiBase}/health`, { headers: getHeaders(), signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch {
    return { status: 'offline', version: 'unknown', timestamp: new Date().toISOString() };
  }
}

/** Login */
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: CloudUser }> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) throw new Error(`Login failed: ${resp.status}`);
  const data = await resp.json();
  setAuthToken(data.token);
  return data;
}

/** Register */
export async function apiRegister(name: string, email: string, password: string, institution: string): Promise<{ token: string; user: CloudUser }> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, institution }),
  });
  if (!resp.ok) throw new Error(`Registration failed: ${resp.status}`);
  const data = await resp.json();
  setAuthToken(data.token);
  return data;
}

/** List cloud projects */
export async function apiListProjects(): Promise<CloudProject[]> {
  const apiBase = getApiBase();
  if (!apiBase) return [];
  const resp = await fetch(`${apiBase}/projects`, { headers: getHeaders() });
  if (!resp.ok) throw new Error(`Failed to list projects: ${resp.status}`);
  return await resp.json();
}

/** Get project by ID */
export async function apiGetProject(projectId: string): Promise<CloudProject & { data: any }> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/projects/${projectId}`, { headers: getHeaders() });
  if (!resp.ok) throw new Error(`Failed to get project: ${resp.status}`);
  return await resp.json();
}

/** Upload (save) project to cloud */
export async function apiUploadProject(projectId: string, projectData: any): Promise<CloudProject> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const jsonStr = JSON.stringify(projectData);
  const checksum = await sha256(jsonStr);
  const resp = await fetch(`${apiBase}/projects/${projectId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      data: projectData,
      checksum,
      sizeBytes: new Blob([jsonStr]).size,
      updatedAt: new Date().toISOString(),
    }),
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return await resp.json();
}

/** Create new cloud project */
export async function apiCreateProject(name: string, description: string, projectData: any): Promise<CloudProject> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/projects`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, description, data: projectData, isPublic: false }),
  });
  if (!resp.ok) throw new Error(`Create failed: ${resp.status}`);
  return await resp.json();
}

/** Delete cloud project */
export async function apiDeleteProject(projectId: string): Promise<void> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}

/** Share project with user */
export async function apiShareProject(projectId: string, email: string, role: 'editor' | 'viewer'): Promise<void> {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error(CLOUD_SYNC_DISABLED_MESSAGE);
  const resp = await fetch(`${apiBase}/projects/${projectId}/share`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, role }),
  });
  if (!resp.ok) throw new Error(`Share failed: ${resp.status}`);
}

/** Get sync status */
export async function apiGetSyncStatus(): Promise<SyncStatus> {
  const apiBase = getApiBase();
  if (!apiBase) return getOfflineSyncStatus();
  try {
    const resp = await fetch(`${apiBase}/sync/status`, { headers: getHeaders(), signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch {
    return getOfflineSyncStatus();
  }
}

/** Sync all projects */
export async function apiSyncAll(): Promise<SyncStatus> {
  const apiBase = getApiBase();
  if (!apiBase) return getOfflineSyncStatus();
  const resp = await fetch(`${apiBase}/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ localProjects: getLocalProjects() }),
  });
  if (!resp.ok) throw new Error(`Sync failed: ${resp.status}`);
  const status = await resp.json();
  localStorage.setItem('radshield_last_sync', new Date().toISOString());
  localStorage.setItem('radshield_pending_changes', '0');
  return status;
}

/** Get audit log */
export async function apiGetAuditLog(projectId: string, limit = 50): Promise<any[]> {
  const apiBase = getApiBase();
  if (!apiBase) return [];
  const resp = await fetch(`${apiBase}/projects/${projectId}/audit?limit=${limit}`, { headers: getHeaders() });
  if (!resp.ok) throw new Error(`Failed to get audit log: ${resp.status}`);
  return await resp.json();
}

/** Get current user */
export async function apiGetCurrentUser(): Promise<CloudUser | null> {
  if (!isCloudSyncEnabled()) return null;
  const token = localStorage.getItem('radshield_auth_token');
  if (!token) return null;
  authToken = token;
  try {
    const resp = await fetch(`${getApiBase()}/auth/me`, { headers: getHeaders(), signal: AbortSignal.timeout(5000) });
    if (!resp.ok) { setAuthToken(null); return null; }
    return await resp.json();
  } catch { return null; }
}

// ── Local Storage Helpers ──

function getLocalProjects(): any[] {
  try {
    const data = localStorage.getItem('radshield_projects');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function getOfflineSyncStatus(): SyncStatus {
  return {
    status: 'offline',
    lastSyncAt: localStorage.getItem('radshield_last_sync'),
    pendingChanges: parseInt(localStorage.getItem('radshield_pending_changes') || '0'),
    serverProjects: 0,
    localProjects: getLocalProjects().length,
    message: 'Cloud Sync is disabled. Working in offline mode.',
  };
}

function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-256', data).then(buf =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  );
}

// ── Offline Sync Queue ──

interface QueuedChange {
  id: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete';
  projectId: string;
  data: any;
}

export function queueChange(change: Omit<QueuedChange, 'id' | 'timestamp'>): void {
  const queue: QueuedChange[] = JSON.parse(localStorage.getItem('radshield_sync_queue') || '[]');
  queue.push({ ...change, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
  localStorage.setItem('radshield_sync_queue', JSON.stringify(queue));
  localStorage.setItem('radshield_pending_changes', String(queue.length));
}

export function getSyncQueue(): QueuedChange[] {
  return JSON.parse(localStorage.getItem('radshield_sync_queue') || '[]');
}

export function clearSyncQueue(): void {
  localStorage.setItem('radshield_sync_queue', '[]');
  localStorage.setItem('radshield_pending_changes', '0');
}

// ── Export utilities ──
export function exportProjectJSON(projectData: any, filename?: string): void {
  const jsonStr = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `radshield_project_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(JSON.parse(e.target?.result as string)); }
      catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
