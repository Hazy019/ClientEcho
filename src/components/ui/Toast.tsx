"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss success and info toasts after 4 seconds
    if (type !== "error") {
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Fixed Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 text-xs font-sans ${
                toast.type === "success"
                  ? "bg-ink-900 text-surface-white border-surface-white/20"
                  : toast.type === "error"
                  ? "bg-rose-950 text-rose-100 border-rose-800"
                  : "bg-ink-800 text-surface-white border-surface-white/20"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
              </div>

              <div className="flex-1 space-y-0.5">
                {toast.title && (
                  <h4 className="font-display font-bold text-xs leading-tight">
                    {toast.title}
                  </h4>
                )}
                <p className="leading-relaxed opacity-90">{toast.message}</p>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="text-surface-white/50 hover:text-surface-white transition p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
