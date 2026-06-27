"use client";

import { useState, useEffect } from "react";
import { webauthnService, WebAuthnCredential } from "@/services/webauthn.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SecuritySettingsPage() {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    webauthnService
      .getCredentials()
      .then((res) => setCredentials(res.data))
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (type: "platform" | "cross-platform") => {
    try {
      const label = type === "platform" ? "This Device" : "Security Key";
      await webauthnService.startRegistration({ credentialName: label, authenticatorType: type });
      // In production, the WebAuthn browser API would handle the rest
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await webauthnService.deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security - Passkeys & WebAuthn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage passwordless authentication credentials for your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Register New Credential</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => handleRegister("platform")}>
            Register This Device
          </Button>
          <Button variant="outline" onClick={() => handleRegister("cross-platform")}>
            Register Security Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className="text-sm text-slate-500">No credentials registered yet.</p>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{cred.name}</p>
                    <p className="text-xs text-slate-500">
                      {cred.authenticatorType} | Created {cred.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cred.enabled ? "default" : "secondary"}>
                      {cred.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cred.id)}>
                      Remove
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
