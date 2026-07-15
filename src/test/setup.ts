/**
 * Test setup — Vitest global setup
 * C.2: Integration test configuration
 */
import { vi } from 'vitest';

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock localStorage
const localStorageMock: Storage = {
  getItem: vi.fn((_key: string) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
global.localStorage = localStorageMock;

// Mock indexedDB
global.indexedDB = {
  open: vi.fn(() => ({
    set onsuccess(cb: any) { if (cb) cb({ target: { result: { objectStoreNames: { contains: () => true }, createObjectStore: () => ({ createIndex: () => {} }), transaction: () => ({ objectStore: () => ({ put: () => ({}) }) }) } } }); },
    set onerror(_cb: any) {},
    set onupgradeneeded(_cb: any) {},
  })),
} as any;

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((_callback: any) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
})) as any;

// Mock WebAssembly
global.WebAssembly = {
  instantiateStreaming: vi.fn().mockResolvedValue({
    instance: { exports: {} },
  }),
} as any;

// Mock window.crypto.subtle.digest for WASM integrity
if (!global.crypto?.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: any) => arr,
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        importKey: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateKey: vi.fn(),
        deriveBits: vi.fn(),
        deriveKey: vi.fn(),
        wrapKey: vi.fn(),
        unwrapKey: vi.fn(),
      },
    },
    writable: true,
    configurable: true,
  });
}

// Mock console methods to reduce noise in tests
global.console.warn = vi.fn();
global.console.error = vi.fn();
