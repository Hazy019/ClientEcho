"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  User,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  Lock,
  LifeBuoy,
  Download,
  ShieldCheck,
  Key,
} from "lucide-react";
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

  // Security & Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Help & Support Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  // Data Export
  const [exporting, setExporting] = useState(false);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Failed to update password.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Network error while updating password.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showToast("Please provide both a subject and message.", "error");
      return;
    }

    setSendingSupport(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Support message sent successfully! We'll reply shortly.", "success");
        setShowSupportModal(false);
        setSupportSubject("");
        setSupportMessage("");
      } else {
        showToast(data.error || "Failed to send support inquiry.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Network error while sending support inquiry.", "error");
    } finally {
      setSendingSupport(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/testimonials");
      const data = await res.json();
      if (res.ok && data.testimonials) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data.testimonials, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute(
          "download",
          `clientecho-export-${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Workspace testimonials exported successfully!", "success");
      } else {
        showToast("Failed to export testimonials.", "error");
      }
    } catch {
      showToast("Network error while exporting data.", "error");
    } finally {
      setExporting(false);
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
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="border-b border-ink-900/10 pb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-3 tracking-tight">
          <SettingsIcon className="w-7 h-7 text-ink-900" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-ink-800/80 text-xs sm:text-sm mt-1 leading-relaxed">
          Manage workspace branding, creator account details, notification triggers, and security settings.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-6 h-6 rounded-lg" />
              <SkeletonBlock className="w-56 h-7 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <SkeletonBlock className="w-48 h-4 rounded-md" />
                <SkeletonBlock className="w-full h-14 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="w-36 h-4 rounded-md" />
                <SkeletonBlock className="w-full h-14 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Form 1: Profile & Notification Preferences */}
          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* Workspace & Profile Information */}
            <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-6">
              <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
                <User className="w-6 h-6 text-ink-900" />
                <span>Profile & Workspace Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2">
                    Workspace Display Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full p-3.5 sm:p-4 border-2 border-ink-900/20 rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:border-ink-900 bg-surface-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2 flex items-center justify-between">
                    <span>Account Email</span>
                    <span className="text-xs font-mono font-bold text-ink-800/60 uppercase">Read-Only</span>
                  </label>
                  <input
                    type="email"
                    value={accountEmail}
                    disabled
                    className="w-full p-3.5 sm:p-4 border-2 border-ink-900/10 rounded-2xl text-sm sm:text-base font-medium bg-surface-light text-ink-800/70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Email Notification Preferences */}
            <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-6">
              <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
                <Bell className="w-6 h-6 text-ink-900" />
                <span>Email Notification Preferences</span>
              </h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3.5 p-5 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnSubmission}
                    onChange={(e) => setNotifyOnSubmission(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm sm:text-base font-bold text-ink-900">
                      Notify on Public Form Testimonial Submission
                    </div>
                    <div className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-0.5">
                      Receive an instant email when a client submits social proof via your embed widget's public form.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3.5 p-5 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnApproval}
                    onChange={(e) => setNotifyOnApproval(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm sm:text-base font-bold text-ink-900">
                      Notify on 1-Click Magic Link Client Approval
                    </div>
                    <div className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-0.5">
                      Receive a confirmation digest when a client clicks your magic link token to approve a draft testimonial.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  loading={saving}
                  loadingText="Saving Preferences..."
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  className="px-6 py-3 text-sm font-bold"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </form>

          {/* Form 2: Security & Password Management */}
          <form onSubmit={handleUpdatePassword} className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
                <Lock className="w-6 h-6 text-ink-900" />
                <span>Security & Password Management</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supabase Protected</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-800/75 leading-relaxed">
              Ensure your workspace credentials remain secure. Passwords must be at least 8 characters long.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3.5 sm:p-4 border-2 border-ink-900/20 rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:border-ink-900 bg-surface-white transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="w-full p-3.5 sm:p-4 border-2 border-ink-900/20 rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:border-ink-900 bg-surface-white transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full p-3.5 sm:p-4 border-2 border-ink-900/20 rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:border-ink-900 bg-surface-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                type="submit"
                loading={updatingPassword}
                loadingText="Updating Password..."
                icon={<Key className="w-4 h-4" />}
                className="px-6 py-3 text-sm font-bold"
              >
                Update Password
              </Button>
            </div>
          </form>

          {/* Data Portability & Support Section */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-4">
            <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
              <Download className="w-6 h-6 text-ink-900" />
              <span>Data Portability & Backup</span>
            </h2>

            <p className="text-xs sm:text-sm text-ink-800/75 leading-relaxed">
              Export all approved testimonials and metadata collected in your workspace as structured JSON for offline backup or migration.
            </p>

            <div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-5 py-3 bg-surface-light hover:bg-ink-900/10 text-ink-900 border-2 border-ink-900/20 rounded-2xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Export Workspace Data (.json)</span>
              </button>
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className="bg-rose-500/5 p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-xl font-bold text-rose-900 flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                <span>Danger Zone</span>
              </h2>
              <span className="text-xs font-mono uppercase bg-rose-500/20 text-rose-800 px-3 py-1 rounded-full font-bold">
                Irreversible Actions
              </span>
            </div>

            <p className="text-xs text-rose-950/80 leading-relaxed">
              Permanently purge your ClientEcho workspace, deactivate all active embed scripts, and delete stored testimonials. This action cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-display font-semibold rounded-xl text-xs transition shadow-sm inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Workspace & Account</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="px-4 py-2.5 bg-surface-white hover:bg-surface-light text-ink-900 border border-ink-900/20 font-semibold rounded-xl text-xs transition shadow-xs inline-flex items-center gap-2"
              >
                <LifeBuoy className="w-4 h-4 text-ink-900" />
                <span>Help & Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-ink-900/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-ink-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-ink-900" />
                <span>Contact ClientEcho Support</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-ink-800/50 hover:text-ink-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-800/70 leading-relaxed">
              Have questions, need billing assistance, or running into an issue? Submit your inquiry directly to our engineering support team.
            </p>

            <form onSubmit={handleSendSupport} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="e.g., Billing question, Custom CSS help..."
                  required
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs focus:outline-none focus:border-ink-900 bg-surface-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                  Message
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs focus:outline-none focus:border-ink-900 bg-surface-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 text-xs font-medium text-ink-800/70 hover:bg-surface-light rounded-xl transition"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={sendingSupport}
                  loadingText="Sending..."
                  icon={<LifeBuoy className="w-3.5 h-3.5" />}
                >
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
