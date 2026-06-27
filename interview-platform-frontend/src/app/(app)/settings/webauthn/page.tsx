"use client";

import { useState, useEffect } from "react";
import { webauthnService, WebAuthnCredential } from "@/services/webauthn.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WebAuthnSettingsPage() {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newCredentialName, setNewCredentialName] = useState("");
  const [authenticatorType, setAuthenticatorType] = useState<"platform" | "cross-platform">("platform");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const res = await webauthnService.getCredentials();
      setCredentials(res.data || []);
    } catch (err) {
      console.error("Failed to load credentials:", err);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!newCredentialName.trim()) return;
    try {
      setRegistering(true);
      setError(null);

      // Start registration
      const startRes = await webauthnService.startRegistration({
        credentialName: newCredentialName.trim(),
        authenticatorType,
      });

      // In a real implementation, we'd use the Web Authentication API here
      // navigator.credentials.create(startRes.data.options)
      // For now, simulate the finish step
      await webauthnService.finishRegistration({
        credentialName: newCredentialName.trim(),
        response: startRes.data,
      });

      setSuccess("Passkey registered successfully!");
      setShowRegisterForm(false);
      setNewCredentialName("");
      await loadCredentials();
    } catch (err: any) {
      setError(err?.message || "Failed to register passkey. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await webauthnService.deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      setSuccess("Credential deleted successfully.");
    } catch (err) {
      setError("Failed to delete credential.");
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await webauthnService.toggleCredential(id, enabled);
      setCredentials((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled } : c))
      );
    } catch (err) {
      setError("Failed to update credential.");
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isWebAuthnAvailable = typeof window !== "undefined" && !!window.PublicKeyCredential;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading passkey settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Passkeys & WebAuthn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage passwordless authentication with passkeys and security keys
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">×</button>
        </div>
      )}

      {/* WebAuthn Support Check */}
      {!isWebAuthnAvailable && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-amber-600 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">WebAuthn Not Supported</p>
              <p className="text-xs text-amber-600">Your browser does not support WebAuthn/FIDO2. Please use a modern browser.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-indigo-600 text-lg">🔐</span>
            <div>
              <p className="text-sm font-medium text-indigo-800">What are Passkeys?</p>
              <p className="text-xs text-indigo-600 mt-1">
                Passkeys are a more secure and convenient replacement for passwords. They use biometrics
                (fingerprint, face) or security keys to authenticate you. Passkeys are phishing-resistant
                and cannot be reused across sites.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Register New Passkey */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Register New Passkey</CardTitle>
          {!showRegisterForm && (
            <Button
              onClick={() => setShowRegisterForm(true)}
              disabled={!isWebAuthnAvailable}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              + Register Passkey
            </Button>
          )}
        </CardHeader>
        {showRegisterForm && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Credential Name</Label>
              <Input
                value={newCredentialName}
                onChange={(e) => setNewCredentialName(e.target.value)}
                placeholder="e.g., MacBook Touch ID, YubiKey 5"
              />
            </div>
            <div className="space-y-2">
              <Label>Authenticator Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAuthenticatorType("platform")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    authenticatorType === "platform"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-700">Platform Authenticator</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Built-in (Touch ID, Face ID, Windows Hello)
                  </p>
                </button>
                <button
                  onClick={() => setAuthenticatorType("cross-platform")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    authenticatorType === "cross-platform"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-700">Security Key</p>
                  <p className="text-xs text-slate-500 mt-1">
                    External (YubiKey, Titan Key, etc.)
                  </p>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRegisterForm(false);
                  setNewCredentialName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegister}
                disabled={registering || !newCredentialName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {registering ? "Registering..." : "Register"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Credentials List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registered Credentials ({credentials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No passkeys registered yet</p>
              <p className="text-xs text-slate-300 mt-1">Register a passkey for passwordless sign-in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    credential.enabled
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-lg">
                        {credential.authenticatorType === "platform" ? "🖥️" : "🔑"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">{credential.name}</p>
                        <Badge
                          className={
                            credential.enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }
                        >
                          {credential.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500">
                          Created: {formatDate(credential.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Last used: {formatDate(credential.lastUsedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(credential.id, !credential.enabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        credential.enabled ? "bg-green-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          credential.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(credential.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
