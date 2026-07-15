/**
 * ═══════════════════════════════════════════════════════════
 * LLM Provider Configuration — Multi-provider support
 * OpenAI (cloud) | Ollama (local) | LM Studio (local)
 * ═══════════════════════════════════════════════════════════
 */

export interface LLMProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: LLMModel[];
  defaultModel: string;
  privacy: "cloud" | "local";
  costTier: "free" | "$" | "$$" | "$$$";
}

function getEnvValue(key: string): string {
  const viteValue = ((import.meta as any).env?.[key] || "") as string;
  const processValue = typeof process !== "undefined" ? (((process as any).env?.[key] || "") as string) : "";
  if (typeof (globalThis as any).window !== "undefined") {
    return viteValue || processValue;
  }
  return processValue || viteValue;
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsFunctions: boolean;
  maxTokens: number;
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: typeof (globalThis as any).window !== "undefined" ? "" : ((process as any).env?.OPENAI_API_KEY || ""),
    privacy: "cloud",
    costTier: "$$",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: true, maxTokens: 16_384 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: true, maxTokens: 16_384 },
    ],
  },
  ollama: {
    name: "Ollama (Local)",
    get baseUrl() {
      return getEnvValue("VITE_OLLAMA_BASE_URL") || getEnvValue("OLLAMA_BASE_URL");
    },
    privacy: "local",
    costTier: "free",
    defaultModel: "llama3.2",
    models: [
      { id: "llama3.2", name: "Llama 3.2 (3B)", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: false, maxTokens: 8192 },
      { id: "llama3.3", name: "Llama 3.3 (70B)", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: false, maxTokens: 8192 },
      { id: "qwen2.5:14b", name: "Qwen 2.5 (14B)", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: false, maxTokens: 8192 },
      { id: "mistral:7b", name: "Mistral 7B", contextWindow: 32_000, supportsStreaming: true, supportsFunctions: false, maxTokens: 8192 },
    ],
  },
  lmstudio: {
    name: "LM Studio (Local)",
    get baseUrl() {
      return getEnvValue("VITE_LMSTUDIO_BASE_URL") || getEnvValue("LMSTUDIO_BASE_URL");
    },
    privacy: "local",
    costTier: "free",
    defaultModel: "local-model",
    models: [
      { id: "local-model", name: "Loaded Model", contextWindow: 128_000, supportsStreaming: true, supportsFunctions: false, maxTokens: 8192 },
    ],
  },
};

export const DEFAULT_PROVIDER = "openai";
export const DEFAULT_MODEL = "gpt-4o-mini";

// Embedding configuration
export const EMBEDDING_CONFIG = {
  provider: "openai" as const,
  model: "text-embedding-3-small",
  dimensions: 1536,
  maxInputTokens: 8192,
};

// Local embedding fallback (if OpenAI key not available)
export const LOCAL_EMBEDDING_CONFIG = {
  provider: "ollama" as const,
  model: "nomic-embed-text",
  dimensions: 768,
  maxInputTokens: 2048,
};

export function getActiveProvider(): LLMProvider {
  const providerKey = getEnvValue("VITE_LLM_PROVIDER") || getEnvValue("LLM_PROVIDER") || DEFAULT_PROVIDER;
  return LLM_PROVIDERS[providerKey] || LLM_PROVIDERS[DEFAULT_PROVIDER];
}

export function getProviderApiKey(providerName: string): string {
  if (providerName === "openai") return getEnvValue("VITE_OPENAI_API_KEY") || getEnvValue("OPENAI_API_KEY");
  return "";
}

export function isLocalProvider(providerName: string): boolean {
  return LLM_PROVIDERS[providerName]?.privacy === "local";
}

export function isProviderConfigured(providerName: string): boolean {
  const provider = LLM_PROVIDERS[providerName];
  if (!provider) return false;
  if (provider.privacy === "local") return provider.baseUrl.trim().length > 0;
  if (providerName === "openai") return getProviderApiKey("openai").trim().length > 0;
  return true;
}
