"use client";

import { useEffect, useState, useCallback } from "react";
import { apiKeyService } from "@/services/api-key.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiKeyResponse, ApiKeyCreatedResponse } from "@/types";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  // Created key dialog (shows full key once)
  const [createdKeyDialogOpen, setCreatedKeyDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiKeyService.getAll();
      setKeys(data);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // ─── Create Key ─────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formName.trim()) return;

    try {
      setCreating(true);
      const result = await apiKeyService.create({
        name: formName.trim(),
        expiresAt: formExpiresAt || undefined,
      });
      setCreatedKey(result);
      setKeys((prev) => [...prev, result]);
      resetCreateForm();
      setCreateDialogOpen(false);
      setCreatedKeyDialogOpen(true);
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setFormName("");
    setFormExpiresAt("");
  };

  // ─── Revoke Key ─────────────────────────────────────────────────────────────

  const handleRevoke = async (key: ApiKeyResponse) => {
    if (!confirm(`Revoke API key "${key.name}"? This action cannot be undone.`)) return;

    try {
      await apiKeyService.revoke(key.id);
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  // ─── Copy Key ──────────────────────────────────────────────────────────────

  const handleCopyKey = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32 bg-slate-200" />
          <Skeleton className="h-10 w-32 bg-slate-200" />
        </div>
        <Skeleton className="h-20 w-full bg-amber-50 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Key
        </Button>
      </div>

      {/* Security Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <div className="p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Keep your API keys secure</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Do not share your API keys in publicly accessible areas such as GitHub, client-side code, or public repositories.
              API keys grant full access to your account resources.
            </p>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {keys.length === 0 && (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No API keys</p>
            <p className="text-sm text-slate-400">Create an API key to integrate with external services.</p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Key
            </Button>
          </div>
        </Card>
      )}

      {/* Keys List */}
      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id} className="border-slate-200">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{key.name}</p>
                    <p className="text-xs font-mono text-slate-500">{key.prefix}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-slate-400">
                        Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {key.expiresAt && (
                    <Badge
                      className={`text-xs border ${
                        new Date(key.expiresAt) < new Date()
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {new Date(key.expiresAt) < new Date()
                        ? "Expired"
                        : `Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                    </Badge>
                  )}

                  <Button
                    onClick={() => handleRevoke(key)}
                    className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create Key Dialog ───────────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Production API Key"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="key-expires">Expiration Date (optional)</Label>
              <Input
                id="key-expires"
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-slate-400">Leave empty for a non-expiring key.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetCreateForm();
                setCreateDialogOpen(false);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Created Key Dialog (shown once) ─────────────────────────────────── */}
      <Dialog open={createdKeyDialogOpen} onOpenChange={setCreatedKeyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between gap-3">
              <code className="text-sm text-green-400 break-all flex-1">
                {createdKey?.key}
              </code>
              <Button
                onClick={handleCopyKey}
                className="h-8 px-3 text-xs bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex-shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <Card className="border-red-200 bg-red-50">
              <div className="p-3 flex items-start gap-2">
                <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-700">
                  This is the only time you will see this key. Store it securely.
                  If you lose it, you will need to create a new one.
                </p>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setCreatedKeyDialogOpen(false);
                setCreatedKey(null);
                setCopied(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
