"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Trash2, X, RotateCcw, CheckCircle2 } from "lucide-react";

export type ModalVariant = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
}

interface AlertOptions {
  title: string;
  description?: string;
  variant?: ModalVariant;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface AlertState extends AlertOptions {
  resolve: () => void;
}

interface UndoToast {
  id: string;
  message: string;
  countdown: number;
  onUndo: () => void;
  onCommit: () => void;
}

// ink-900=#2D2D2D ink-800=#33363B surface-light=#EFF3F6 surface-white=#FFFFFF
const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    iconRing: "ring-1 ring-rose-200",
    confirmBg: "bg-rose-500 hover:bg-rose-600 text-white shadow-sm",
    accent: "#f43f5e",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    iconRing: "ring-1 ring-amber-200",
    confirmBg: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
    accent: "#f59e0b",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    iconRing: "ring-1 ring-blue-200",
    confirmBg: "bg-[#2D2D2D] hover:bg-[#33363B] text-white shadow-sm",
    accent: "#3b82f6",
  },
} as const;

function UndoToastItem({ toast, onRemove }: { toast: UndoToast; onRemove: (id: string) => void }) {
  const [count, setCount] = useState(toast.countdown);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const committed = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          if (!committed.current) { committed.current = true; toast.onCommit(); }
          setTimeout(() => onRemove(toast.id), 300);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!committed.current) { committed.current = true; toast.onUndo(); }
    onRemove(toast.id);
  };

  const TOTAL = toast.countdown;
  const circumference = 2 * Math.PI * 13;
  const dashOffset = circumference * (1 - count / TOTAL);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto relative overflow-hidden rounded-2xl border border-white/10 bg-[#2D2D2D] shadow-[0_8px_32px_rgba(45,45,45,0.32)] w-full"
    >
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
        <div className="h-full bg-rose-400 transition-[width] duration-1000 ease-linear" style={{ width: `${(count / TOTAL) * 100}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex-shrink-0 w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2.5" />
            <circle cx="15" cy="15" r="13" fill="none" stroke="#f87171" strokeWidth="2.5"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.95s linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{count}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{toast.message}</p>
          <p className="text-[11px] text-white/50 mt-0.5">Permanent in {count}s</p>
        </div>
        <button onClick={handleUndo}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/18 text-white text-xs font-semibold transition-all duration-150 active:scale-95 border border-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Undo
        </button>
      </div>
    </motion.div>
  );
}

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const cfg = variantConfig[state.variant ?? "danger"];
  const Icon = cfg.icon;
  const handleConfirm = () => { state.resolve(true); onClose(); };
  const handleCancel = () => { state.resolve(false); onClose(); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      key="confirm-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(45,45,45,0.38)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <motion.div
        key="confirm-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] rounded-2xl border border-black/8 bg-white shadow-[0_20px_60px_rgba(45,45,45,0.16),0_2px_8px_rgba(45,45,45,0.08)] overflow-hidden"
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,transparent,${cfg.accent}70,transparent)` }} />
        <button onClick={handleCancel}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#2D2D2D]/30 hover:text-[#2D2D2D]/70 hover:bg-[#EFF3F6] transition-all duration-150"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-6 pt-5">
          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${cfg.iconBg} ${cfg.iconRing}`}>
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <h2 className="font-display text-[17px] font-bold text-[#2D2D2D] leading-snug mb-1.5">{state.title}</h2>
          {state.description && (
            <p className="text-sm text-[#2D2D2D]/55 leading-relaxed">{state.description}</p>
          )}
          <div className="mt-5 border-t border-black/6" />
          <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2.5">
            <button onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#EFF3F6] text-[#2D2D2D]/70 hover:text-[#2D2D2D] text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              {state.cancelLabel ?? "Cancel"}
            </button>
            <button onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98] ${cfg.confirmBg}`}
            >
              {state.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AlertDialog({ state, onClose }: { state: AlertState; onClose: () => void }) {
  const cfg = variantConfig[state.variant ?? "info"];
  const Icon = state.variant === "danger" ? Trash2 : state.variant === "warning" ? AlertTriangle : CheckCircle2;
  const handleOk = () => { state.resolve(); onClose(); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") handleOk(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      key="alert-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(45,45,45,0.38)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && handleOk()}
    >
      <motion.div
        key="alert-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-2xl border border-black/8 bg-white shadow-[0_16px_48px_rgba(45,45,45,0.14),0_2px_8px_rgba(45,45,45,0.07)] overflow-hidden"
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,transparent,${cfg.accent}70,transparent)` }} />
        <div className="p-5">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3.5 ${cfg.iconBg} ${cfg.iconRing}`}>
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <h2 className="font-display text-base font-bold text-[#2D2D2D] leading-tight mb-1">{state.title}</h2>
          {state.description && (
            <p className="text-sm text-[#2D2D2D]/55 leading-relaxed">{state.description}</p>
          )}
          <div className="mt-4 border-t border-black/6" />
          <button onClick={handleOk}
            className={`mt-3.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98] ${cfg.confirmBg}`}
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [undoToasts, setUndoToasts] = useState<UndoToast[]>([]);

  const removeUndoToast = useCallback((id: string) => {
    setUndoToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { id, message, onUndo, onCommit } = e.detail as UndoToast;
      setUndoToasts((prev) => [...prev, { id, message, countdown: 5, onUndo, onCommit }]);
    };
    window.addEventListener("ce:undo-action", handler as EventListener);
    return () => window.removeEventListener("ce:undo-action", handler as EventListener);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => { setConfirmState({ ...options, resolve }); });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => { setAlertState({ ...options, resolve }); });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      <AnimatePresence>
        {confirmState && <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {alertState && <AlertDialog state={alertState} onClose={() => setAlertState(null)} />}
      </AnimatePresence>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2.5 items-center w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {undoToasts.map((t) => (
            <UndoToastItem key={t.id} toast={t} onRemove={removeUndoToast} />
          ))}
        </AnimatePresence>
      </div>
    </ModalContext.Provider>
  );
}