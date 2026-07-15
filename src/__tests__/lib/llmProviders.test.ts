import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadProviders() {
  vi.resetModules();
  return import('@/lib/llm/providers');
}

async function loadClient() {
  vi.resetModules();
  return import('@/lib/llm/client');
}

describe('LLM providers static mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not default local browser providers to localhost', async () => {
    const { LLM_PROVIDERS, isProviderConfigured } = await loadProviders();

    expect(LLM_PROVIDERS.ollama.baseUrl).toBe('');
    expect(LLM_PROVIDERS.lmstudio.baseUrl).toBe('');
    expect(isProviderConfigured('ollama')).toBe(false);
    expect(isProviderConfigured('lmstudio')).toBe(false);
  });

  it('uses explicit VITE local provider URLs', async () => {
    vi.stubEnv('VITE_OLLAMA_BASE_URL', 'http://127.0.0.1:11434');
    vi.stubEnv('VITE_LMSTUDIO_BASE_URL', 'http://127.0.0.1:1234');

    const { LLM_PROVIDERS, isProviderConfigured } = await loadProviders();

    expect(LLM_PROVIDERS.ollama.baseUrl).toBe('http://127.0.0.1:11434');
    expect(LLM_PROVIDERS.lmstudio.baseUrl).toBe('http://127.0.0.1:1234');
    expect(isProviderConfigured('ollama')).toBe(true);
    expect(isProviderConfigured('lmstudio')).toBe(true);
  });

  it('returns offline fallback embeddings without calling Ollama by default', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { generateEmbedding } = await loadClient();

    const result = await generateEmbedding('blindaje');

    expect(fetch).not.toHaveBeenCalled();
    expect(result.model).toBe('fallback-offline');
    expect(result.embedding).toHaveLength(1536);
  });

  it('health check for local provider fails closed without network', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { checkLLMHealth } = await loadClient();

    const health = await checkLLMHealth('ollama');

    expect(fetch).not.toHaveBeenCalled();
    expect(health.ok).toBe(false);
    expect(health.error).toContain('VITE_OLLAMA_BASE_URL');
  });
});
