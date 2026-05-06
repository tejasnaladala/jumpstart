"use client";
import { cn } from "@/lib/utils";
import { Check, X, Info } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "info" | "error";
type ToastEntry = { id: string; message: string; variant: ToastVariant };

type Ctx = {
  push: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, message, variant }]);
    setTimeout(() => {
      setItems((s) => s.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 items-center sm:items-end pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 max-w-sm rounded-lg shadow-hover px-3 py-2.5 text-sm bg-ink text-white animate-fade-up"
            )}
          >
            {t.variant === "success" && <Check className="h-4 w-4 text-success" />}
            {t.variant === "info" && <Info className="h-4 w-4 text-white/70" />}
            {t.variant === "error" && <X className="h-4 w-4 text-error" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
