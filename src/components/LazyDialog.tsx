/**
 * ═══════════════════════════════════════════════════════════
 * LazyDialog — Zustand + ErrorBoundary + Suspense wrapper
 * Replaces individual dialog state + error boundary + lazy loading
 * ═══════════════════════════════════════════════════════════
 */

import { Suspense, type ComponentType } from "react";
import { useAppStore, type DialogName } from "@/stores/appStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

interface LazyDialogProps {
  name: DialogName;
  component: ComponentType<any>;
  [key: string]: any;
}

export default function LazyDialog({ name, component: DialogComponent, ...props }: LazyDialogProps) {
  const isOpen = useAppStore((s) => s.dialogs[name] || false);
  const close = useAppStore((s) => s.close);

  if (!isOpen) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            <span className="text-sm text-slate-600">Cargando...</span>
          </div>
        </div>
      }
    >
      <ErrorBoundary dialogName={name} onReset={() => close(name)}>
        <DialogComponent
          open={isOpen}
          onClose={() => close(name)}
          onOpenChange={(v: boolean) => {
            if (!v) close(name);
          }}
          {...props}
        />
      </ErrorBoundary>
    </Suspense>
  );
}
