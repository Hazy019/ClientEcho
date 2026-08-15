"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Bell, User, AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(true);
  const [notifyOnApproval, setNotifyOnApproval] = useState(true);
  const [saving, setSaving] = useState(false);

  // Danger Zone Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.creator) {
          setWorkspaceName(data.creator.name || "Workspace Creator");
          setAccountEmail(data.creator.email || "");
          const settings = data.creator.settings || {};
          setNotifyOnSubmission(settings.notifyOnSubmission !== false);
          setNotifyOnApproval(settings.notifyOnApproval !== false);
        } else {
          showToast(data.error || "Failed to load creator settings.", "error");
        }
      } catch (err) {
        showToast("Network error while loading settings.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
          notifyOnSubmission,
          notifyOnApproval,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Workspace preferences saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("Network error while saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirmInput.trim() !== "DELETE MY ACCOUNT") return;
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setShowDeleteModal(false);
      showToast("Account deletion request logged. Redirecting...", "info");
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Page Header */}
      <div className="border-b border-ink-900/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-ink-900 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-ink-900" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-ink-800/70 text-sm mt-1">
          Manage workspace branding, creator account details, notification triggers, and security settings.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Profile & Workspace Identity Skeleton */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-5 h-5 rounded-lg" />
              <SkeletonBlock className="w-48 h-6 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <SkeletonBlock className="w-40 h-3 rounded-md" />
                <SkeletonBlock className="w-full h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="w-28 h-3 rounded-md" />
                  <SkeletonBlock className="w-16 h-3 rounded-md" />
                </div>
                <SkeletonBlock className="w-full h-11 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Email Notification Preferences Skeleton */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-5 h-5 rounded-lg" />
              <SkeletonBlock className="w-56 h-6 rounded-lg" />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-ink-900/10 flex items-start gap-3">
                <SkeletonBlock className="w-4 h-4 rounded mt-0.5" />
                <div className="space-y-2 flex-1">
                  <SkeletonBlock className="w-64 h-4 rounded-md" />
                  <SkeletonBlock className="w-full h-3 rounded-md" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-ink-900/10 flex items-start gap-3">
                <SkeletonBlock className="w-4 h-4 rounded mt-0.5" />
                <div className="space-y-2 flex-1">
                  <SkeletonBlock className="w-60 h-4 rounded-md" />
                  <SkeletonBlock className="w-full h-3 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <SkeletonBlock className="w-36 h-11 rounded-xl" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Workspace & Profile Information */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <User className="w-5 h-5 text-ink-900" />
              <span>Profile & Workspace Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-2">
                  Workspace Display Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900 bg-surface-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-2 flex items-center justify-between">
                  <span>Account Email</span>
                  <span className="text-[10px] font-mono text-ink-800/50 uppercase">Read-Only</span>
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-ink-900/10 rounded-xl text-sm bg-surface-light text-ink-800/60 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Email Notification Preferences */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-ink-900" />
              <span>Email Notification Preferences</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnSubmission}
                  onChange={(e) => setNotifyOnSubmission(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900"
                />
                <div>
                  <div className="text-sm font-semibold text-ink-900">
                    Notify on Public Form Testimonial Submission
                  </div>
                  <div className="text-xs text-ink-800/70 leading-relaxed mt-0.5">
                    Receive an instant email when a client submits social proof via your embed widget's public form.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnApproval}
                  onChange={(e) => setNotifyOnApproval(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900"
                />
                <div>
                  <div className="text-sm font-semibold text-ink-900">
                    Notify on 1-Click Magic Link Client Approval
                  </div>
                  <div className="text-xs text-ink-800/70 leading-relaxed mt-0.5">
                    Receive a confirmation digest when a client clicks your magic link token to approve a draft testimonial.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              loading={saving}
              loadingText="Saving Changes..."
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      )}

      {/* Danger Zone Section */}
      <div className="bg-rose-500/5 p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Danger Zone</span>
          </h2>
          <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-800 px-2.5 py-0.5 rounded font-bold">
            Irreversible Actions
          </span>
        </div>

        <p className="text-xs text-rose-950/80 leading-relaxed">
          Permanently purge your ClientEcho workspace, deactivate all active embed scripts, and delete stored testimonials. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-display font-semibold rounded-xl text-xs transition shadow-sm inline-flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Workspace & Account</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-ink-900/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-display font-bold text-xl text-ink-900">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-xs text-ink-800/80 leading-relaxed">
              This will permanently delete all your widgets, magic links, and approved testimonials. Type <strong className="font-mono text-ink-900">DELETE MY ACCOUNT</strong> below to confirm.
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-rose-600"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput("");
                }}
                className="px-4 py-2 text-xs font-medium text-ink-800/70 hover:bg-surface-light rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || confirmInput.trim() !== "DELETE MY ACCOUNT"}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-40"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
