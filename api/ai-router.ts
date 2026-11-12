/**
 * ═══════════════════════════════════════════════════════════
 * AI Router — tRPC backend for LLM chat completions
 * Streaming + non-streaming chat + embeddings
 * ═══════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { authedQuery, createRouter, publicQuery } from "./middleware";
import { chatCompletion, generateEmbedding, checkLLMHealth } from "@/lib/llm/client";
import { buildChatMessages } from "@/lib/llm/prompts";
import { getDb } from "./queries/connection";
import { chatMessages } from "@db/schema";
import { eq } from "drizzle-orm";

export const aiRouter = createRouter({
  // ─── Chat Completion (non-streaming) ───
  chat: authedQuery
    .input(
      z.object({
        message: z.string().min(1),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().min(1).max(8192).default(2048),
        sessionId: z.string().optional(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const messages = input.systemPrompt
        ? [
            { role: "system" as const, content: input.systemPrompt },
            { role: "user" as const, content: input.message },
          ]
        : [{ role: "user" as const, content: input.message }];

      const response = await chatCompletion({
        messages,
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      // Save to chat history if sessionId provided
      if (input.sessionId) {
        try {
          const db = getDb();
          await db.insert(chatMessages).values([
            { sessionId: `${ctx.user.unionId}:${input.sessionId}`, role: "user", content: input.message },
            { sessionId: `${ctx.user.unionId}:${input.sessionId}`, role: "assistant", content: response.content, modelUsed: response.model },
          ]);
        } catch { /* silent fail for history */ }
      }

      return response;
    }),

  // ─── RAG Chat (with retrieval context) ───
  chatRAG: authedQuery
    .input(
      z.object({
        message: z.string().min(1),
        ragContext: z.array(
          z.object({
            content: z.string(),
            source: z.string(),
            section: z.string().nullable(),
          })
        ),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().min(1).max(8192).default(2048),
        sessionId: z.string().optional(),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const messages = buildChatMessages(
        input.message,
        input.ragContext,
        input.chatHistory
      );

      const response = await chatCompletion({
        messages,
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      // Save to history
      if (input.sessionId) {
        try {
          const db = getDb();
          const sources = input.ragContext.map(c => `${c.source}${c.section ? ` ${c.section}` : ""}`);
          await db.insert(chatMessages).values([
            { sessionId: `${ctx.user.unionId}:${input.sessionId}`, role: "user", content: input.message },
            { sessionId: `${ctx.user.unionId}:${input.sessionId}`, role: "assistant", content: response.content, modelUsed: response.model, sources: JSON.stringify(sources) },
          ]);
        } catch { /* silent */ }
      }

      // Extract sources from response (if model cites them)
      const citedSources = input.ragContext.map(c =>
        c.section ? `${c.source}, ${c.section}` : c.source
      );

      return {
        ...response,
        sources: citedSources,
      };
    }),

  // ─── Generate Embedding ───
  embedding: authedQuery
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return generateEmbedding(input.text);
    }),

  // ─── Health Check ───
  health: publicQuery
    .input(z.object({ provider: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return checkLLMHealth(input?.provider);
    }),

  // ─── Chat History ───
  history: authedQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const sessionId = `${ctx.user.unionId}:${input.sessionId}`;
      return db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(chatMessages.createdAt);
    }),

  clearHistory: authedQuery
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const sessionId = `${ctx.user.unionId}:${input.sessionId}`;
      // Delete all messages for this session
      await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
      return { success: true };
    }),
});
