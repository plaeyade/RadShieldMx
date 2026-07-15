import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// tRPC Provider — Frontend
// NOTA: No importamos AppRouter desde @api/router porque eso incluiría
// código del servidor (Hono, Drizzle, MySQL) en el bundle del frontend.
// En su lugar, usamos un stub tipo que se alinea con las rutas del backend.
// ═══════════════════════════════════════════════════════════════════════════════

function getStoredBackendURL() {
  try {
    return localStorage.getItem("radshield_backend_url") || "";
  } catch {
    return "";
  }
}

// Backend URL: configurable via env / localStorage / auto-detect.
// Production builds are static/offline-first unless backend is explicitly enabled.
const STORED_BACKEND_URL = getStoredBackendURL();
export const BACKEND_ENABLED =
  import.meta.env.VITE_ENABLE_BACKEND === "true" ||
  !!STORED_BACKEND_URL;

function normalizeTrpcURL(url: string) {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/api/trpc") ? trimmed : `${trimmed}/api/trpc`;
}

export const BACKEND_URL = BACKEND_ENABLED
  ? normalizeTrpcURL(
      STORED_BACKEND_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        (import.meta.env.PROD
          ? `${window.location.origin}/api/trpc`
          : "http://localhost:3000/api/trpc"),
    )
  : `${window.location.origin}/api/trpc`;

export const trpc: any = createTRPCReact<any>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: BACKEND_URL,
      transformer: superjson,
      headers() {
        const token = localStorage.getItem("radshield_session_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        if (!BACKEND_ENABLED) {
          return Promise.resolve(
            new Response(JSON.stringify([{ result: { data: { json: null } } }]), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          );
        }
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export function setBackendURL(url: string) {
  localStorage.setItem("radshield_backend_url", url);
  window.location.reload();
}
