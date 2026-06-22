"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { mfaService } from "@/services/mfa.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MFASetupResponse } from "@/types";

type SetupStep = "idle" | "qr" | "verify" | "backup";

export default function MFAPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [step, setStep] = useState<SetupStep>("idle");
  const [setupData, setSetupData] = useState<MFASetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OTP input state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Disable dialog
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);

  // Regenerate
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[]>([]);
  const [showRegeneratedCodes, setShowRegeneratedCodes] = useState(false);

  // ─── Setup Flow ──────────────────────────────────────────────────────────────

  const handleEnableMFA = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const data = await mfaService.setup();
      setSetupData(data);
      setStep("qr");
    } catch (err) {
      console.error("MFA setup failed:", err);
      setError("Failed to initialize MFA setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await mfaService.verify(code);
      setBackupCodes(result.backupCodes);
      setMfaEnabled(true);
      setStep("backup");
      setSuccessMessage("Two-factor authentication has been enabled successfully!");
    } catch (err) {
      console.error("MFA verification failed:", err);
      setError("Invalid verification code. Please check your authenticator app and try again.");
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── Disable MFA ─────────────────────────────────────────────────────────────

  const handleDisableMFA = async () => {
    try {
      setDisabling(true);
      await mfaService.disable();
      setMfaEnabled(false);
      setStep("idle");
      setSetupData(null);
      setBackupCodes([]);
      setOtpDigits(["", "", "", "", "", ""]);
      setDisableDialogOpen(false);
      setSuccessMessage("Two-factor authentication has been disabled.");
    } catch (err) {
      console.error("Failed to disable MFA:", err);
      setError("Failed to disable MFA. Please try again.");
    } finally {
      setDisabling(false);
    }
  };

  // ─── Regenerate Backup Codes ─────────────────────────────────────────────────

  const handleRegenerateBackupCodes = async () => {
    try {
      setRegenerating(true);
      setError("");
      const result = await mfaService.regenerateBackupCodes();
      setRegeneratedCodes(result.backupCodes);
      setBackupCodes(result.backupCodes);
      setShowRegeneratedCodes(true);
    } catch (err) {
      console.error("Failed to regenerate backup codes:", err);
      setError("Failed to regenerate backup codes. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  // ─── OTP Input Handlers ──────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyCode();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasteData.length; i++) {
        newDigits[i] = pasteData[i];
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasteData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  // ─── Utility Functions ────────────────────────────────────────────────────────

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const copyAllCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join("\n"));
    setSuccessMessage("All backup codes copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const downloadCodes = (codes: string[]) => {
    const content = [
      "Interview Platform - MFA Backup Codes",
      "=" .repeat(40),
      "",
      "Generated: " + new Date().toLocaleString(),
      "",
      "IMPORTANT: Store these codes securely.",
      "Each code can only be used once.",
      "",
      ...codes.map((code, i) => `${i + 1}. ${code}`),
      "",
      "If you lose access to your authenticator,",
      "use one of these codes to sign in.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetFlow = () => {
    setStep("idle");
    setSetupData(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setError("");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
        <p className="text-sm text-slate-500 mt-1">
          Secure your account with an additional layer of verification.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <svg className="h-4 w-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ─── Status Card ────────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Shield Icon */}
            <div
              className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${
                mfaEnabled
                  ? "bg-gradient-to-br from-green-100 to-emerald-100"
                  : "bg-gradient-to-br from-slate-100 to-slate-200"
              }`}
            >
              <svg
                className={`h-7 w-7 ${mfaEnabled ? "text-green-600" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Status Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h2>
                <Badge
                  className={`text-xs ${
                    mfaEnabled
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {mfaEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {mfaEnabled
                  ? "Your account is protected with two-factor authentication."
                  : "Enable 2FA to add an extra layer of security when signing in."}
              </p>
            </div>

            {/* Action Button */}
            <div className="shrink-0">
              {!mfaEnabled && step === "idle" && (
                <Button
                  onClick={handleEnableMFA}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Setting up...
                    </span>
                  ) : (
                    "Enable Two-Factor Authentication"
                  )}
                </Button>
              )}
              {mfaEnabled && (
                <Button
                  onClick={() => setDisableDialogOpen(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                >
                  Disable MFA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Step 1: QR Code ────────────────────────────────────────────────────── */}
      {step === "qr" && setupData && (
        <Card className="border-indigo-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <CardTitle className="text-base">Scan QR Code</CardTitle>
            </div>
            <CardDescription>
              Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan the QR code below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-6 bg-white border border-slate-200 rounded-xl">
              <img
                src={setupData.qrCodeUrl}
                alt="MFA Setup QR Code"
                className="h-52 w-52"
              />
            </div>

            <Separator />

            {/* Secret Key */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Can&apos;t scan? Enter this secret key manually:
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-slate-900 rounded-lg">
                  <code className="text-sm text-green-400 font-mono break-all tracking-wider">
                    {setupData.secret}
                  </code>
                </div>
                <Button
                  onClick={() => copyToClipboard(setupData.secret)}
                  className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shrink-0"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                onClick={resetFlow}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep("verify")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next: Enter Verification Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 2: Verify Code ────────────────────────────────────────────────── */}
      {step === "verify" && (
        <Card className="border-indigo-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <CardTitle className="text-base">Enter Verification Code</CardTitle>
            </div>
            <CardDescription>
              Enter the 6-digit code displayed in your authenticator app to verify setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-mono font-bold text-slate-900 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <p className="text-center text-xs text-slate-500">
              The code refreshes every 30 seconds
            </p>

            <div className="flex justify-between items-center pt-2">
              <Button
                onClick={() => {
                  setStep("qr");
                  setOtpDigits(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || otpDigits.some((d) => !d)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 3: Backup Codes ───────────────────────────────────────────────── */}
      {step === "backup" && backupCodes.length > 0 && (
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <CardTitle className="text-base">Save Your Backup Codes</CardTitle>
            </div>
            <CardDescription>
              Store these codes in a safe place. If you lose access to your authenticator app, you can use one of these codes to sign in. Each code can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Codes Grid */}
            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-sm text-slate-800 tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => copyAllCodes(backupCodes)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </Button>
              <Button
                onClick={() => downloadCodes(backupCodes)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download as .txt
              </Button>
            </div>

            <Separator />

            <Button
              onClick={() => setStep("idle")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              I&apos;ve saved my backup codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Backup Codes Management (when MFA enabled) ─────────────────────────── */}
      {mfaEnabled && step === "idle" && (
        <>
          <Separator />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Backup Codes</CardTitle>
              <CardDescription>
                Generate new backup codes if you&apos;ve used most of them or suspect they&apos;ve been compromised. This will invalidate all previous codes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRegenerateBackupCodes}
                disabled={regenerating}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-50"
              >
                {regenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Regenerating...
                  </span>
                ) : (
                  "Regenerate Backup Codes"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Regenerated Codes Display */}
          {showRegeneratedCodes && regeneratedCodes.length > 0 && (
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-amber-800">New Backup Codes</CardTitle>
                <CardDescription>
                  Your previous backup codes have been invalidated. Save these new codes immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  {regeneratedCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center p-2.5 bg-white border border-amber-200 rounded-lg font-mono text-sm text-slate-800 tracking-wider"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyAllCodes(regeneratedCodes)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Copy All
                  </Button>
                  <Button
                    onClick={() => downloadCodes(regeneratedCodes)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  >
                    Download as .txt
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRegeneratedCodes(false);
                      setRegeneratedCodes([]);
                    }}
                    className="ml-auto bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── Disable Confirmation Dialog ─────────────────────────────────────────── */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable two-factor authentication? This will make your account less secure and remove all backup codes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
            <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-700">
              This action cannot be undone. You will need to set up MFA again if you change your mind.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setDisableDialogOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisableMFA}
              disabled={disabling}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {disabling ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Disabling...
                </span>
              ) : (
                "Yes, Disable MFA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
