"use client";

import { useState, useCallback } from "react";
import { securityService, AccountLockout, IpBlockEntry, LoginAttempt, BlockIpRequest } from "@/services/security.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";

type ActiveTab = "lockout" | "ip-blocking" | "login-attempts";

export default function SecuritySettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("lockout");
  const { withFeedback } = useActionFeedback();

  // Lockout state
  const [lockoutEmail, setLockoutEmail] = useState("");
  const [lockoutData, setLockoutData] = useState<AccountLockout | null>(null);
  const [lockoutLoading, setLockoutLoading] = useState(false);
  const [lockoutError, setLockoutError] = useState("");

  // IP Blocking state
  const [blockedIps, setBlockedIps] = useState<IpBlockEntry[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockIpRequest>({
    ipAddress: "",
    reason: "",
    expiresAt: "",
  });

  // Login Attempts state
  const [attemptsEmail, setAttemptsEmail] = useState("");
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Lockout handlers
  const checkLockout = useCallback(async () => {
    if (!lockoutEmail.trim()) return;
    setLockoutLoading(true);
    setLockoutError("");
    try {
      const data = await securityService.getLockoutStatus(lockoutEmail.trim());
      setLockoutData(data);
    } catch (err: unknown) {
      setLockoutError("Account not found or no lockout data available");
      setLockoutData(null);
    } finally {
      setLockoutLoading(false);
    }
  }, [lockoutEmail]);

  const handleUnlock = async (email: string) => {
    await withFeedback(
      async () => {
        await securityService.unlockAccount(email);
        setLockoutData(null);
        setLockoutEmail("");
      },
      { successTitle: `Account ${email} unlocked successfully` }
    );
  };

  // IP Blocking handlers
  const fetchBlockedIps = useCallback(async () => {
    setIpsLoading(true);
    try {
      const data = await securityService.getBlockedIps();
      setBlockedIps(data);
    } catch {
      setBlockedIps([]);
    } finally {
      setIpsLoading(false);
    }
  }, []);

  const handleBlockIp = async () => {
    if (!blockForm.ipAddress || !blockForm.reason) return;
    await withFeedback(
      async () => {
        await securityService.blockIp(blockForm);
        setShowBlockForm(false);
        setBlockForm({ ipAddress: "", reason: "", expiresAt: "" });
        await fetchBlockedIps();
      },
      { successTitle: `IP ${blockForm.ipAddress} blocked successfully` }
    );
  };

  const handleUnblockIp = async (ipAddress: string) => {
    if (!confirm(`Unblock IP ${ipAddress}?`)) return;
    await withFeedback(
      async () => {
        await securityService.unblockIp(ipAddress);
        await fetchBlockedIps();
      },
      { successTitle: `IP ${ipAddress} unblocked successfully` }
    );
  };

  // Login Attempts handlers
  const fetchLoginAttempts = useCallback(async () => {
    if (!attemptsEmail.trim()) return;
    setAttemptsLoading(true);
    try {
      const data = await securityService.getLoginAttempts(attemptsEmail.trim());
      setLoginAttempts(data);
    } catch {
      setLoginAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  }, [attemptsEmail]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Security</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage account lockouts, IP blocking, and monitor login activity
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-1 mb-6 w-fit">
          {([
            { key: "lockout" as ActiveTab, label: "Account Lockout" },
            { key: "ip-blocking" as ActiveTab, label: "IP Blocking" },
            { key: "login-attempts" as ActiveTab, label: "Login Attempts" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "ip-blocking") fetchBlockedIps();
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Account Lockout Tab */}
        {activeTab === "lockout" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Check Account Lockout Status</h2>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={lockoutEmail}
                  onChange={(e) => setLockoutEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkLockout()}
                  placeholder="Enter user email address"
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  onClick={checkLockout}
                  disabled={!lockoutEmail.trim() || lockoutLoading}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lockoutLoading ? "Checking..." : "Check Status"}
                </button>
              </div>

              {lockoutError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{lockoutError}</p>
              )}

              {lockoutData && (
                <div className="mt-6 p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">{lockoutData.email}</h3>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        lockoutData.locked
                          ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {lockoutData.locked ? "Locked" : "Active"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Failed Attempts</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{lockoutData.failedAttempts}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Locked At</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {lockoutData.lockedAt ? new Date(lockoutData.lockedAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Lock Expires</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {lockoutData.lockExpiresAt ? new Date(lockoutData.lockExpiresAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-end">
                      {lockoutData.locked && (
                        <button
                          onClick={() => handleUnlock(lockoutData.email)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          Unlock Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IP Blocking Tab */}
        {activeTab === "ip-blocking" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Blocked IP Addresses</h2>
                <div className="flex gap-3">
                  <button
                    onClick={fetchBlockedIps}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowBlockForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    + Block IP
                  </button>
                </div>
              </div>

              {/* Block IP Form */}
              {showBlockForm && (
                <div className="mb-6 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-medium text-red-900 dark:text-red-300 mb-3">Block an IP Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={blockForm.ipAddress}
                      onChange={(e) => setBlockForm({ ...blockForm, ipAddress: e.target.value })}
                      placeholder="IP Address (e.g., 192.168.1.1)"
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                      placeholder="Reason for blocking"
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <input
                      type="datetime-local"
                      value={blockForm.expiresAt}
                      onChange={(e) => setBlockForm({ ...blockForm, expiresAt: e.target.value })}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-3">
                    <button
                      onClick={() => setShowBlockForm(false)}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBlockIp}
                      disabled={!blockForm.ipAddress || !blockForm.reason}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      Block IP
                    </button>
                  </div>
                </div>
              )}

              {/* Blocked IPs Table */}
              {ipsLoading ? (
                <div className="text-center py-8 text-slate-500">Loading blocked IPs...</div>
              ) : blockedIps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">No blocked IP addresses</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Click &quot;Refresh&quot; to load or &quot;Block IP&quot; to add one
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">IP Address</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Reason</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Blocked By</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Blocked At</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Expires</th>
                        <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedIps.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-3 px-3 font-mono text-slate-900 dark:text-white">{entry.ipAddress}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{entry.reason}</td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{entry.blockedBy}</td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                            {new Date(entry.blockedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                            {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "Never"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleUnblockIp(entry.ipAddress)}
                              className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Attempts Tab */}
        {activeTab === "login-attempts" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Login Attempt History</h2>
              <div className="flex gap-3 mb-6">
                <input
                  type="email"
                  value={attemptsEmail}
                  onChange={(e) => setAttemptsEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLoginAttempts()}
                  placeholder="Enter user email to view login attempts"
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  onClick={fetchLoginAttempts}
                  disabled={!attemptsEmail.trim() || attemptsLoading}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {attemptsLoading ? "Loading..." : "Search"}
                </button>
              </div>

              {loginAttempts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Time</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">IP Address</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">User Agent</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-3 px-3 text-slate-900 dark:text-white whitespace-nowrap">
                            {new Date(attempt.attemptedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                attempt.successful
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {attempt.successful ? "Success" : "Failed"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 text-xs">
                            {attempt.ipAddress}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                            {attempt.userAgent}
                          </td>
                          <td className="py-3 px-3 text-red-600 dark:text-red-400 text-xs">
                            {attempt.failureReason || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {loginAttempts.length === 0 && attemptsEmail && !attemptsLoading && (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">No login attempts found for this email</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
