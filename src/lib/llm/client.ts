/**
 * ═══════════════════════════════════════════════════════════
 * Universal LLM Client — OpenAI / Ollama / LM Studio
 * Chat completions + embeddings + streaming
 * ═══════════════════════════════════════════════════════════
 */

import { getActiveProvider, getProviderApiKey, EMBEDDING_CONFIG, LOCAL_EMBEDDING_CONFIG, LLM_PROVIDERS, isProviderConfigured } from "./providers";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  sources?: string[];
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
}

function fallbackEmbedding(dimensions = EMBEDDING_CONFIG.dimensions): EmbeddingResponse {
  return { embedding: new Array(dimensions).fill(0), model: "fallback-offline" };
}

// ─── OpenAI API ───
async function openaiChat(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number,
  stream?: boolean,
  onChunk?: (chunk: string) => void
): Promise<ChatCompletionResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: !!stream,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  // Streaming
  if (stream && onChunk) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(l => l.trim().startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch { /* skip malformed */ }
      }
    }
    return { content: fullContent, model };
  }

  // Non-streaming
  const data: any = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model || model,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

async function openaiEmbedding(text: string, apiKey: string): Promise<EmbeddingResponse> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_CONFIG.model,
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error ${res.status}: ${err}`);
  }

  const data: any = await res.json();
  return {
    embedding: data.data?.[0]?.embedding || [],
    model: EMBEDDING_CONFIG.model,
  };
}

// ─── Ollama API ───
async function ollamaChat(
  messages: ChatMessage[],
  model: string,
  baseUrl: string,
  temperature: number,
  maxTokens: number,
  stream?: boolean,
  onChunk?: (chunk: string) => void
): Promise<ChatCompletionResponse> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      options: { temperature, num_predict: maxTokens },
      stream: !!stream,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  if (stream && onChunk) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const delta = parsed.message?.content || "";
          if (delta && !parsed.done) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch { /* skip */ }
      }
    }
    return { content: fullContent, model };
  }

  const data: any = await res.json();
  return {
    content: data.message?.content || "",
    model,
  };
}

async function ollamaEmbedding(text: string, baseUrl: string): Promise<EmbeddingResponse> {
  const res = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOCAL_EMBEDDING_CONFIG.model,
      prompt: text,
    }),
  });

  if (!res.ok) {
    // Fallback: return zero embedding
    return { embedding: new Array(LOCAL_EMBEDDING_CONFIG.dimensions).fill(0), model: "fallback" };
  }

  const data: any = await res.json();
  return {
    embedding: data.embedding || [],
    model: LOCAL_EMBEDDING_CONFIG.model,
  };
}

// ─── LM Studio (OpenAI-compatible) ───
async function lmstudioChat(
  messages: ChatMessage[],
  model: string,
  baseUrl: string,
  temperature: number,
  maxTokens: number,
  stream?: boolean,
  onChunk?: (chunk: string) => void
): Promise<ChatCompletionResponse> {
  // LM Studio is OpenAI-compatible
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "local-model",
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: !!stream,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LM Studio error ${res.status}: ${err}`);
  }

  if (stream && onChunk) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(l => l.trim().startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch { /* skip */ }
      }
    }
    return { content: fullContent, model };
  }

  const data: any = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model || model,
  };
}

// ═══════════════════════════════════════════════════════════
// UNIVERSAL CLIENT
// ═══════════════════════════════════════════════════════════

export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const provider = getActiveProvider();
  const apiKey = getProviderApiKey(provider.name.toLowerCase().split(" ")[0]);
  const model = options.model || provider.defaultModel;

  if (provider.name === "Ollama (Local)") {
    if (!provider.baseUrl) throw new Error("Ollama no configurado. Configure VITE_OLLAMA_BASE_URL para habilitar proveedor local.");
    return ollamaChat(
      options.messages, model, provider.baseUrl,
      options.temperature ?? 0.7,
      options.maxTokens ?? 2048,
      options.stream,
      options.onChunk
    );
  }

  if (provider.name === "LM Studio (Local)") {
    if (!provider.baseUrl) throw new Error("LM Studio no configurado. Configure VITE_LMSTUDIO_BASE_URL para habilitar proveedor local.");
    return lmstudioChat(
      options.messages, model, provider.baseUrl,
      options.temperature ?? 0.7,
      options.maxTokens ?? 2048,
      options.stream,
      options.onChunk
    );
  }

  // Default: OpenAI
  return openaiChat(
    options.messages, model, apiKey,
    options.temperature ?? 0.7,
    options.maxTokens ?? 2048,
    options.stream,
    options.onChunk
  );
}

export async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  const provider = getActiveProvider();
  const apiKey = getProviderApiKey(provider.name.toLowerCase().split(" ")[0]);

  // Try OpenAI first for embeddings (best quality)
  if (apiKey) {
    return openaiEmbedding(text, apiKey);
  }

  if (LLM_PROVIDERS.ollama.baseUrl) {
    return ollamaEmbedding(text, LLM_PROVIDERS.ollama.baseUrl);
  }

  return fallbackEmbedding();
}

// Batch embeddings for ingesting documents
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResponse[]> {
  const results: EmbeddingResponse[] = [];
  // Process in batches of 10 to avoid rate limits
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map(t => generateEmbedding(t).catch(() => fallbackEmbedding()))
    );
    results.push(...batchResults);
  }
  return results;
}

// Health check for LLM providers
export async function checkLLMHealth(providerName?: string): Promise<{ ok: boolean; provider: string; model?: string; error?: string }> {
  const name = providerName || getActiveProvider().name.toLowerCase().split(" ")[0];
  try {
    if (name === "openai") {
      const apiKey = getProviderApiKey("openai");
      if (!apiKey) return { ok: false, provider: "openai", error: "No API key" };
      const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      return { ok: res.ok, provider: "openai", model: EMBEDDING_CONFIG.model };
    }
    if (name === "ollama") {
      if (!isProviderConfigured("ollama")) return { ok: false, provider: "ollama", error: "VITE_OLLAMA_BASE_URL not configured" };
      const res = await fetch(`${LLM_PROVIDERS.ollama.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return { ok: res.ok, provider: "ollama" };
    }
    if (name === "lmstudio") {
      if (!isProviderConfigured("lmstudio")) return { ok: false, provider: "lmstudio", error: "VITE_LMSTUDIO_BASE_URL not configured" };
      const res = await fetch(`${LLM_PROVIDERS.lmstudio.baseUrl}/v1/models`, { signal: AbortSignal.timeout(3000) });
      return { ok: res.ok, provider: "lmstudio" };
    }
    return { ok: false, provider: name, error: "Unknown provider" };
  } catch (e) {
    return { ok: false, provider: name, error: (e as Error).message };
  }
}
