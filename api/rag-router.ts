/**
 * ═══════════════════════════════════════════════════════════
 * RAG Router — Retrieval-Augmented Generation
 * Vector search + LLM generation with document context
 * ═══════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { adminQuery, authedQuery, createRouter } from "./middleware";
import {
  retrieveChunks,
  keywordSearch,
  insertChunk,
  countChunks,
  incrementUsage,
  getDocumentSources,
  deleteAllChunks,
} from "./lib/vectorStore";
import { chatCompletion } from "@/lib/llm/client";
import { buildChatMessages } from "@/lib/llm/prompts";
import { getDb } from "./queries/connection";
import { chatMessages } from "@db/schema";
import { eq } from "drizzle-orm";

export const ragRouter = createRouter({
  // ─── Vector Search (retrieve chunks) ───
  retrieve: authedQuery
    .input(
      z.object({
        query: z.string().min(1),
        topK: z.number().min(1).max(20).default(5),
        source: z.string().optional(),
        modality: z.string().optional(),
        energyMin: z.number().optional(),
        energyMax: z.number().optional(),
        tags: z.array(z.string()).optional(),
        useKeywordFallback: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      let chunks = await retrieveChunks({
        query: input.query,
        topK: input.topK,
        source: input.source,
        modality: input.modality,
        energyMin: input.energyMin,
        energyMax: input.energyMax,
        tags: input.tags,
      });

      // Fallback to keyword search if no vector results
      if (chunks.length === 0 && input.useKeywordFallback) {
        chunks = await keywordSearch(input.query, input.topK, input.source);
      }

      // Track usage for analytics
      for (const chunk of chunks) {
        try { await incrementUsage(chunk.id); } catch { /* silent */ }
      }

      return chunks;
    }),

  // ─── RAG Generate (retrieve + generate answer) ───
  generate: authedQuery
    .input(
      z.object({
        question: z.string().min(1),
        topK: z.number().min(1).max(10).default(5),
        source: z.string().optional(),
        modality: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().min(1).max(4096).default(2048),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Retrieve relevant chunks
      const chunks = await retrieveChunks({
        query: input.question,
        topK: input.topK,
        source: input.source,
        modality: input.modality,
      });

      // 2. Build messages with RAG context
      const messages = buildChatMessages(
        input.question,
        chunks.map(c => ({ content: c.content, source: c.source, section: c.section }))
      );

      // 3. Generate answer
      const response = await chatCompletion({
        messages,
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      // 4. Save to history
      if (input.sessionId) {
        try {
          const db = getDb();
          const sources = chunks.map(c => c.section ? `${c.source} ${c.section}` : c.source);
          await db.insert(chatMessages).values([
            { sessionId: input.sessionId, role: "user", content: input.question },
            { sessionId: input.sessionId, role: "assistant", content: response.content, modelUsed: response.model, sources: JSON.stringify(sources) },
          ]);
        } catch { /* silent */ }
      }

      return {
        answer: response.content,
        sources: chunks.map(c => ({
          source: c.source,
          section: c.section,
          similarity: Math.round(c.similarity * 100) / 100,
          content: c.content.substring(0, 200) + (c.content.length > 200 ? "..." : ""),
        })),
        model: response.model,
      };
    }),

  // ─── Ingest Document Chunk ───
  ingest: adminQuery
    .input(
      z.object({
        source: z.string().min(1),
        section: z.string().optional(),
        modality: z.string().optional(),
        content: z.string().min(1),
        tags: z.array(z.string()).optional(),
        energyMin: z.number().optional(),
        energyMax: z.number().optional(),
        pageRef: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await insertChunk(input);
      return { id, success: true };
    }),

  // ─── Batch Ingest ───
  ingestBatch: adminQuery
    .input(
      z.array(
        z.object({
          source: z.string().min(1),
          section: z.string().optional(),
          modality: z.string().optional(),
          content: z.string().min(1),
          tags: z.array(z.string()).optional(),
          energyMin: z.number().optional(),
          energyMax: z.number().optional(),
          pageRef: z.string().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const ids: number[] = [];
      for (const chunk of input) {
        try {
          const id = await insertChunk(chunk);
          ids.push(id);
        } catch (e) {
          console.error("Ingest failed:", e);
        }
      }
      return { count: ids.length, ids };
    }),

  // ─── Stats ───
  stats: authedQuery.query(async () => {
    const [chunkCount, sources] = await Promise.all([
      countChunks(),
      getDocumentSources(),
    ]);
    return { chunkCount, sources };
  }),

  // ─── List Sources ───
  sources: authedQuery.query(async () => {
    return getDocumentSources();
  }),

  // ─── Reset (delete all chunks) ───
  reset: adminQuery
    .input(z.object({ source: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const count = await deleteAllChunks(input?.source);
      return { deleted: count };
    }),
});
