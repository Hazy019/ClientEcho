"use client";

import React, { useState } from "react";
import { Users, AlertTriangle, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminSuspensionControl() {
  const [targetEmail, setTargetEmail] = useState("");
  const [reason, setReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    setStatusMessage(null);
    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleExecuteSuspension = async () => {
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || `Account ${targetEmail} suspended successfully.`);
        setTargetEmail("");
        setReason("");
        setShowConfirmModal(false);
      } else {
        setErrorMessage(data.error || "Failed to execute suspension.");
      }
    } catch (err: any) {
      setErrorMessage("Network error during suspension request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-surface-white flex items-center gap-2">
          <Users className="w-5 h-5 text-surface-white" />
          <span>Account Suspension Interface</span>
        </h2>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold">
          LIVE ACTION
        </span>
      </div>

      <p className="text-xs text-surface-white/70 leading-relaxed">
        Search a creator account by email to trigger a formal suspension and record an immutable audit entry.
      </p>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleOpenConfirm} className="space-y-3">
        <div>
          <label className="block text-[11px] font-mono uppercase text-surface-white/60 mb-1">
            Creator Target Email
          </label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="creator@company.com"
            required
            className="w-full px-3.5 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-xs text-surface-white placeholder:text-surface-white/30 focus:outline-none focus:border-surface-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-surface-white/60 mb-1">
            Suspension Reason / Audit Note
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Terms violation or spam abuse"
            className="w-full px-3.5 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-xs text-surface-white placeholder:text-surface-white/30 focus:outline-none focus:border-surface-white"
          />
        </div>

        <Button
          type="submit"
          variant="danger"
          className="w-full py-2.5"
          icon={<ShieldAlert className="w-4 h-4" />}
        >
          Trigger Account Suspension
        </Button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-ink-900 border border-surface-white/20 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-display font-bold text-lg text-surface-white">
                Confirm Account Suspension
              </h3>
            </div>

            <p className="text-xs text-surface-white/80 leading-relaxed">
              Are you sure you want to suspend account <strong className="text-surface-white">{targetEmail}</strong>? This action will disable their active widgets and write an immutable audit log entry.
            </p>

            {reason && (
              <div className="p-3 bg-ink-800 rounded-xl text-[11px] font-mono text-surface-white/70 border border-surface-white/10">
                Reason: {reason}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                className="text-surface-white/70 hover:text-surface-white"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={loading}
                loadingText="Executing Suspension..."
                onClick={handleExecuteSuspension}
              >
                Confirm & Suspend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
