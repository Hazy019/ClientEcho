"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Ban,
  RotateCcw,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface CreatorItem {
  id: string;
  email: string;
  name: string | null;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminSuspensionControl({
  initialCreators = [],
}: {
  initialCreators?: CreatorItem[];
}) {
  const router = useRouter();
  const [creatorsList, setCreatorsList] = useState<CreatorItem[]>(initialCreators);
  const [targetEmail, setTargetEmail] = useState("");
  const [actionType, setActionType] = useState<"suspend" | "unsuspend">("suspend");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "free">("all");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLatestData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/suspend");
      if (res.ok) {
        const data = await res.json();
        if (data.creators) {
          setCreatorsList(data.creators);
        }
      }
    } catch {} finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialCreators.length === 0) {
      fetchLatestData();
    }
  }, []);

  const handleOpenConfirm = (
    email: string,
    action: "suspend" | "unsuspend",
    defaultReason?: string
  ) => {
    setTargetEmail(email);
    setActionType(action);
    if (defaultReason) setReason(defaultReason);
    setStatusMessage(null);
    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleExecuteAction = async () => {
    if (!targetEmail.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          reason: reason.trim(),
          action: actionType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(
          data.message ||
            (actionType === "suspend"
              ? `Account ${targetEmail} suspended.`
              : `Account ${targetEmail} reactivated.`)
        );
        if (data.creators) {
          setCreatorsList(data.creators);
        }
        setTargetEmail("");
        setReason("");
        setShowConfirmModal(false);
        router.refresh();
      } else {
        setErrorMessage(data.error || "Failed to execute administrative action.");
      }
    } catch (err: any) {
      setErrorMessage("Network error during administrative request.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creatorsList.filter((c) => {
    const matchesSearch =
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "suspended") return c.subscriptionStatus === "suspended";
    if (statusFilter === "active") return c.subscriptionStatus === "active";
    if (statusFilter === "free") return !c.subscriptionStatus || c.subscriptionStatus === "free";
    return true;
  });

  const suspendedCount = creatorsList.filter((c) => c.subscriptionStatus === "suspended").length;
  const activeCount = creatorsList.filter((c) => c.subscriptionStatus === "active").length;
  const freeCount = creatorsList.filter((c) => !c.subscriptionStatus || c.subscriptionStatus === "free").length;

  return (
    <div className="bg-ink-800 p-6 md:p-7 rounded-3xl border border-surface-white/10 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base md:text-lg font-bold text-surface-white flex items-center gap-2.5">
          <Users className="w-5 h-5 text-surface-white" />
          <span>Account Moderation & Controls</span>
        </h2>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLatestData}
            title="Refresh creator list"
            disabled={refreshing}
            className="p-1.5 rounded-xl bg-surface-white/8 hover:bg-surface-white/15 text-surface-white/70 hover:text-surface-white transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wide">
            LIVE CONTROL
          </span>
        </div>
      </div>

      <p className="text-sm text-surface-white/75 leading-relaxed">
        Suspend or reinstate creator accounts. Actions immediately update PostgreSQL and append an immutable event entry to the audit log below.
      </p>

      {/* Status / Error feedback */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs sm:text-sm text-emerald-300 flex items-center gap-2.5 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs sm:text-sm text-rose-300 flex items-center gap-2.5 font-mono">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Direct Action Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (targetEmail.trim()) {
            handleOpenConfirm(targetEmail, actionType);
          }
        }}
        className="space-y-4 p-5 bg-ink-900/80 rounded-2xl border border-surface-white/10 shadow-inner"
      >
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-mono uppercase text-surface-white/80 font-bold tracking-wider">
            Direct Action:
          </label>
          <div className="flex items-center bg-ink-800 p-1 rounded-xl border border-surface-white/10">
            <button
              type="button"
              onClick={() => setActionType("suspend")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                actionType === "suspend"
                  ? "bg-rose-500/25 text-rose-200 border border-rose-500/40 shadow-xs"
                  : "text-surface-white/60 hover:text-surface-white"
              }`}
            >
              Suspend
            </button>
            <button
              type="button"
              onClick={() => setActionType("unsuspend")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                actionType === "unsuspend"
                  ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 shadow-xs"
                  : "text-surface-white/60 hover:text-surface-white"
              }`}
            >
              Unsuspend
            </button>
          </div>
        </div>

        <div>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="Enter target creator email (e.g. creator@example.com)"
            required
            className="w-full px-4 py-3 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white placeholder:text-surface-white/35 focus:outline-none focus:border-surface-white font-mono"
          />
        </div>

        <div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              actionType === "suspend"
                ? "Reason (e.g. Terms violation, spam abuse, fraudulent reviews)"
                : "Audit note (e.g. Reinstated after support appeal review)"
            }
            className="w-full px-4 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white placeholder:text-surface-white/35 focus:outline-none focus:border-surface-white"
          />
        </div>

        <Button
          type="submit"
          variant={actionType === "suspend" ? "danger" : "primary"}
          className={`w-full py-3 font-mono text-sm font-semibold ${
            actionType === "unsuspend"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : ""
          }`}
          icon={
            actionType === "suspend" ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )
          }
        >
          {actionType === "suspend"
            ? "Trigger Account Suspension"
            : "Reactivate & Unsuspend Account"}
        </Button>
      </form>

      {/* ── Containerized Registered Creators Directory ── */}
      <div className="bg-ink-900/90 rounded-2xl border border-surface-white/10 p-4 space-y-3.5 shadow-inner">
        
        {/* Top Directory Bar: Title + Total Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-mono font-bold text-surface-white flex items-center gap-2">
            <Search className="w-4 h-4 text-surface-white/70" />
            <span>Registered Creators Directory</span>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-surface-white/10 text-surface-white/80 border border-surface-white/15">
            {creatorsList.length} accounts
          </span>
        </div>

        {/* Search input with dark-mode matching */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name or email..."
            className="w-full pl-3.5 pr-8 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-xs sm:text-sm text-surface-white placeholder:text-surface-white/40 focus:outline-none focus:border-surface-white font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-white/40 hover:text-surface-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar custom-scrollbar--dark">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition cursor-pointer whitespace-nowrap border ${
              statusFilter === "all"
                ? "bg-surface-white text-ink-900 border-surface-white shadow-xs"
                : "bg-ink-900 text-surface-white/70 hover:text-surface-white border-surface-white/15"
            }`}
          >
            All ({creatorsList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition cursor-pointer whitespace-nowrap border ${
              statusFilter === "active"
                ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/50 shadow-xs"
                : "bg-ink-900 text-surface-white/70 hover:text-emerald-300 border-surface-white/15"
            }`}
          >
            Pro/Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("free")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition cursor-pointer whitespace-nowrap border ${
              statusFilter === "free"
                ? "bg-sky-500/25 text-sky-200 border-sky-500/50 shadow-xs"
                : "bg-ink-900 text-surface-white/70 hover:text-sky-300 border-surface-white/15"
            }`}
          >
            Free ({freeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("suspended")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase font-bold transition cursor-pointer whitespace-nowrap border ${
              statusFilter === "suspended"
                ? "bg-rose-500/25 text-rose-200 border-rose-500/50 shadow-xs"
                : "bg-ink-900 text-surface-white/70 hover:text-rose-300 border-surface-white/15"
            }`}
          >
            Suspended ({suspendedCount})
          </button>
        </div>

        {/* ── Scrollable Directory Box with Smooth Internal Scrollbar ── */}
        <div className="h-56 overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar custom-scrollbar--dark">
          {filteredCreators.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-1.5">
              <Users className="w-7 h-7 text-surface-white/20" />
              <p className="text-sm text-surface-white/50 italic">
                No matching creator accounts found.
              </p>
            </div>
          ) : (
            filteredCreators.map((creator) => {
              const isSuspended = creator.subscriptionStatus === "suspended";
              const isPro = creator.subscriptionStatus === "active";

              return (
                <div
                  key={creator.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isSuspended
                      ? "bg-rose-950/25 border-rose-500/30 hover:border-rose-500/50"
                      : "bg-ink-900/70 hover:bg-ink-900 border-surface-white/10 hover:border-surface-white/25"
                  }`}
                >
                  {/* Left: Avatar initial + Email + Status Tag */}
                  <div className="min-w-0 flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-surface-white/10 border border-surface-white/15 flex items-center justify-center text-xs font-mono font-bold text-surface-white shrink-0 shadow-sm">
                      {creator.email.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-mono font-bold text-surface-white truncate">
                          {creator.email}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-bold border shrink-0 ${
                            isSuspended
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : isPro
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-surface-white/10 text-surface-white/80 border-surface-white/20"
                          }`}
                        >
                          {isSuspended ? "SUSPENDED" : isPro ? "PRO" : "FREE"}
                        </span>
                      </div>
                      {creator.name && (
                        <div className="text-xs text-surface-white/55 truncate font-sans mt-0.5">
                          {creator.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Button */}
                  <div className="shrink-0 flex items-center">
                    {isSuspended ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenConfirm(
                            creator.email,
                            "unsuspend",
                            "Reinstated by Tech Administrator via quick action"
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Reactivate and unsuspend this creator"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unsuspend</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenConfirm(
                            creator.email,
                            "suspend",
                            "Flagged and suspended via admin directory"
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Suspend this creator account"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Directory Footer info strip */}
        <div className="pt-2.5 border-t border-surface-white/8 flex items-center justify-between text-xs font-mono text-surface-white/50">
          <span>Showing {filteredCreators.length} of {creatorsList.length} accounts</span>
          <span className="flex items-center gap-1.5 text-xs text-surface-white/40">
            <span>Scroll inside box</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-ink-900 border border-surface-white/20 p-6 md:p-8 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <div
              className={`flex items-center gap-3 ${
                actionType === "suspend" ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {actionType === "suspend" ? (
                <AlertTriangle className="w-7 h-7 flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-7 h-7 flex-shrink-0" />
              )}
              <h3 className="font-display font-bold text-lg text-surface-white">
                {actionType === "suspend"
                  ? "Confirm Account Suspension"
                  : "Confirm Account Reactivation"}
              </h3>
            </div>

            <p className="text-sm text-surface-white/85 leading-relaxed">
              {actionType === "suspend" ? (
                <>
                  Are you sure you want to suspend account{" "}
                  <strong className="text-surface-white">{targetEmail}</strong>? This action will disable their active widgets and write an immutable audit log entry.
                </>
              ) : (
                <>
                  Are you sure you want to reinstate and unsuspend account{" "}
                  <strong className="text-surface-white">{targetEmail}</strong>? This action will restore their workspace access, re-enable widgets, and record an audit log entry.
                </>
              )}
            </p>

            {reason && (
              <div className="p-3.5 bg-ink-800 rounded-xl text-xs font-mono text-surface-white/80 border border-surface-white/10">
                Reason / Note: {reason}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                className="text-surface-white/70 hover:text-surface-white text-sm"
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "suspend" ? "danger" : "primary"}
                loading={loading}
                onClick={handleExecuteAction}
                className={`text-sm ${
                  actionType === "unsuspend"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : ""
                }`}
              >
                {actionType === "suspend"
                  ? "Confirm Suspension"
                  : "Confirm Reactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
