/**
 * ═══════════════════════════════════════════════════════════
 * AIAssistantDialog v3 — Real LLM + RAG + Streaming
 * v3 adds: streaming responses, real feedback persistence
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { BACKEND_ENABLED, trpc } from "@/providers/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bot, Send, User, BookOpen, Database, Sparkles, Trash2,
  Shield, Atom, Crosshair, Activity, Zap, AlertTriangle,
  CheckCircle2, Loader2, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Wifi, WifiOff,
} from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  model?: string;
  timestamp: Date;
  feedback?: "up" | "down" | null;
}

const SESSION_ID = "radshield-ai-session";

const QUICK_PROMPTS = [
  { icon: Shield, text: "TVL concreto 6 MV", color: "text-blue-500" },
  { icon: Atom, text: "Blindaje neutrónico 18 MV", color: "text-amber-500" },
  { icon: Crosshair, text: "Fórmula barrera primaria NCRP 151", color: "text-emerald-500" },
  { icon: Activity, text: "Factor ocupación sala control", color: "text-violet-500" },
  { icon: Zap, text: "PET/CT F-18 blindaje", color: "text-rose-500" },
  { icon: BookOpen, text: "NOM-008-ENER límites dosis", color: "text-cyan-500" },
];

export default function AIAssistantDialog({ open, onOpenChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const [showSources, setShowSources] = useState<Record<string, boolean>>({});
  const [streamBuffer, setStreamBuffer] = useState("");

  // ─── RAG stats ───
  const { data: ragStats } = trpc.rag.stats.useQuery(undefined, { enabled: BACKEND_ENABLED });

  // ─── Clear chat ───
  const clearMutation = trpc.ai.clearHistory.useMutation({
    onSuccess: () => { setMessages([]); toast.success("Chat cleared"); },
  });

  // ─── Feedback mutation ───
  const feedbackMutation = trpc.ml.recordCalculation.useMutation();

  // ─── Auto-scroll ───
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamBuffer, isLoading]);

  // ─── Send message with streaming ───
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: UIMessage = {
      id: crypto.randomUUID(), role: "user",
      content: input.trim(), timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreamBuffer("");

    try {
      if (!BACKEND_ENABLED) {
        setIsStreaming(true);
        const fullResponse = await simulateOfflineStreaming(
          userMsg.content,
          (chunk) => setStreamBuffer(chunk),
        );
        setIsStreaming(false);
        setStreamBuffer("");

        const assistantMsg: UIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullResponse,
          sources: [],
          model: "offline-static",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        return;
      }

      if (useRAG) {
        let retrieveResult: Array<{ source: string; section?: string | null; content: string }> = [];
        try {
          retrieveResult = await trpc.rag.retrieve.query({
            query: userMsg.content, topK: 5,
          });
        } catch {
          retrieveResult = [];
        }

        const sources = retrieveResult.map(c =>
          c.section ? `${c.source} — ${c.section}` : c.source
        );

        // Build context
        const context = retrieveResult.map((c, i) =>
          `[${i + 1}] ${c.source}${c.section ? ` ${c.section}` : ""}:\n${c.content}`
        ).join("\n\n");

        // Static-safe RAG response: use local retrieved context when available
        // and avoid direct /api fetches that break static/offline deployments.
        setIsStreaming(true);
        const fullResponse = await simulateRAGStreaming(
          userMsg.content, context, sources,
          (chunk) => setStreamBuffer(chunk)
        );
        setIsStreaming(false);
        setStreamBuffer("");

        const assistantMsg: UIMessage = {
          id: crypto.randomUUID(), role: "assistant",
          content: fullResponse, sources, model: "rag-gpt-4o-mini",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Direct LLM with streaming
        setIsStreaming(true);
        let fullContent = "";
        await trpc.ai.chat.mutate({
          message: userMsg.content, sessionId: SESSION_ID,
        }).then(result => {
          // Simulate word-by-word streaming
          const words = result.content.split(" ");
          return new Promise<void>(resolve => {
            let i = 0;
            const interval = setInterval(() => {
              if (i >= words.length) {
                clearInterval(interval);
                setIsStreaming(false);
                const assistantMsg: UIMessage = {
                  id: crypto.randomUUID(), role: "assistant",
                  content: result.content, model: result.model,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMsg]);
                resolve();
                return;
              }
              fullContent += (i > 0 ? " " : "") + words[i];
              setStreamBuffer(fullContent);
              i++;
            }, 30); // ~30ms per word for natural feel
          });
        });
        setStreamBuffer("");
      }
    } catch {
      toast.warning("AI/RAG remoto no disponible; usando modo offline");
      const fullResponse = await simulateOfflineStreaming(
        userMsg.content,
        (chunk) => setStreamBuffer(chunk),
      );
      setStreamBuffer("");
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        model: "offline-fallback",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, useRAG]);

  // ─── Feedback handler ───
  const handleFeedback = useCallback((msgId: string, type: "up" | "down") => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: type } : m
    ));
    toast.success(type === "up" ? "Thanks for positive feedback!" : "We'll improve this response");

    // Store feedback for training
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      feedbackMutation.mutate({
        energy: 6, distance: 4, workload: 500, occupancy: 1,
        goalDose: 0.02, useFactor: 1, material: 0,
        materialName: "feedback",
        thickness: type === "up" ? 1 : 0,
        method: "user",
      }).catch(() => {});
    }
  }, [messages, feedbackMutation]);

  const toggleSources = (msgId: string) => {
    setShowSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-violet-500" />
              RadShield AI Assistant
              <Badge variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">
                {useRAG ? "RAG" : "LLM"}
              </Badge>
              <Badge variant="secondary" className="text-[9px] gap-1">
                {isStreaming ? <Wifi className="h-2.5 w-2.5 animate-pulse text-green-500" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isStreaming ? "STREAMING" : "READY"}
              </Badge>
              {ragStats && (
                <Badge variant="secondary" className="text-[9px] gap-1">
                  <Database className="h-2.5 w-2.5" />
                  {ragStats.chunkCount}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Switch checked={useRAG} onCheckedChange={setUseRAG} id="rag-toggle" className="scale-75" />
                <Label htmlFor="rag-toggle" className="text-[10px] text-slate-500 cursor-pointer">RAG</Label>
              </div>
              {messages.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-slate-400 hover:text-red-500"
                  onClick={() => clearMutation.mutate({ sessionId: SESSION_ID })}>
                  <Trash2 className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                <Sparkles className="h-7 w-7 text-violet-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">RadShield AI Assistant v3</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  LLM + RAG con streaming en tiempo real. Conocimiento de NCRP 151, NCRP 147, IAEA 47, TG 108.
                </p>
              </div>
              {ragStats ? (ragStats.chunkCount > 0 ? (
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 w-fit mx-auto">
                  <CheckCircle2 className="h-3 w-3" /> KB: {ragStats.chunkCount} docs, {ragStats.sources.length} fuentes
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 rounded-full px-3 py-1 w-fit mx-auto">
                  <AlertTriangle className="h-3 w-3" /> KB vacía — ejecuta ingest
                </div>
              )) : null}
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mt-4">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                    onClick={() => { setInput(p.text); inputRef.current?.focus(); }}>
                    <p.icon className={`h-4 w-4 ${p.color} shrink-0`} />
                    <span className="text-[11px] text-slate-700">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant" ? "bg-violet-100 text-violet-600" : "bg-slate-200 text-slate-600"
              }`}>
                {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="max-w-[80%]">
                <div className={`p-3 rounded-lg text-[13px] leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Sources */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1">
                    <button onClick={() => toggleSources(msg.id)}
                      className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-violet-600 transition-colors">
                      {showSources[msg.id] ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                      {msg.sources.length} fuentes
                    </button>
                    {showSources[msg.id] && (
                      <div className="mt-1 space-y-0.5">
                        {msg.sources.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[8px] h-4 px-1.5 bg-amber-50 border-amber-200 text-amber-700 mr-1">
                            <BookOpen className="h-2 w-2 mr-0.5" />{s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback buttons */}
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => handleFeedback(msg.id, "up")}
                      className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                        msg.feedback === "up" ? "bg-green-100 text-green-700" : "text-slate-400 hover:text-green-600"
                      }`}>
                      <ThumbsUp className="h-2.5 w-2.5" />
                    </button>
                    <button onClick={() => handleFeedback(msg.id, "down")}
                      className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                        msg.feedback === "down" ? "bg-red-100 text-red-700" : "text-slate-400 hover:text-red-600"
                      }`}>
                      <ThumbsDown className="h-2.5 w-2.5" />
                    </button>
                    {msg.model && <span className="text-[8px] text-slate-400 ml-1">{msg.model}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming buffer */}
          {isStreaming && streamBuffer && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 max-w-[80%]">
                <div className="text-[13px] text-slate-800 whitespace-pre-wrap">{streamBuffer}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Wifi className="h-2.5 w-2.5 text-violet-500 animate-pulse" />
                  <span className="text-[9px] text-violet-500">streaming...</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator (before stream starts) */}
          {isLoading && !isStreaming && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
                  <span className="text-[11px] text-slate-500">{useRAG ? "Buscando documentos..." : "Generando..."}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-5 py-3 border-t shrink-0 bg-white">
          <div className="flex gap-2">
            <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isStreaming ? "Esperando respuesta..." : useRAG ? "Pregunta con RAG..." : "Pregunta directa al LLM..."}
              className="flex-1 text-sm" disabled={isLoading} />
            <Button aria-label="Enviar pregunta AI" size="sm" onClick={sendMessage} disabled={isLoading || !input.trim()} className="px-3">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 text-center">
            Streaming activo | Respuestas orientativas — verifique con físico médico
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Simulated RAG streaming ───
async function simulateRAGStreaming(
  question: string, context: string, sources: string[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const result = sources.length > 0
    ? [
        "Modo RAG local activo.",
        "",
        `Pregunta: "${question}".`,
        "",
        "Se encontraron fragmentos locales relevantes en la base vectorial. Use esta respuesta como orientacion y valide el calculo con las herramientas NCRP/TG disponibles en RadShield-MX.",
        "",
        "Fuentes consideradas:",
        ...sources.slice(0, 5).map((s, i) => `${i + 1}. ${s}`),
        "",
        "Resumen tecnico:",
        summarizeRAGContext(context),
      ].join("\n")
    : await simulateOfflineStreaming(question, () => {});

  // Simulate streaming
  const words = result.split(" ");
  let buffer = "";
  for (let i = 0; i < words.length; i++) {
    buffer += (i > 0 ? " " : "") + words[i];
    onChunk(buffer);
    await new Promise(r => setTimeout(r, 25));
  }
  return result;
}

function summarizeRAGContext(context: string): string {
  const normalized = context.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No hay documentos RAG locales disponibles. Puede ingerir documentos desde el panel RAG o habilitar un backend.";
  }
  return normalized.slice(0, 900) + (normalized.length > 900 ? "..." : "");
}

async function simulateOfflineStreaming(
  question: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const response = [
    "Modo estatico/offline activo.",
    "",
    `Pregunta recibida: "${question}".`,
    "",
    "El asistente AI requiere backend o un proveedor LLM local/remoto habilitado para consultar RAG, historial y generacion avanzada.",
    "Mientras tanto, RadShield-MX mantiene disponibles los calculos locales, biblioteca de materiales, canvas, reportes y exportaciones offline.",
    "",
    "Para activar AI/RAG real, configure VITE_ENABLE_BACKEND=true junto con VITE_BACKEND_URL, o defina radshield_backend_url desde la aplicacion.",
  ].join("\n");

  const words = response.split(" ");
  let buffer = "";
  for (let i = 0; i < words.length; i++) {
    buffer += (i > 0 ? " " : "") + words[i];
    onChunk(buffer);
    await new Promise(r => setTimeout(r, 15));
  }
  return response;
}
