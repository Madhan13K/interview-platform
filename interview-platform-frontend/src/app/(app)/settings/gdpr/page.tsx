"use client";

import { useEffect, useState, useCallback } from "react";
import { gdprService } from "@/services/gdpr.service";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { ConsentResponse, ErasureRequest } from "@/types";

const CONSENT_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  analytics: {
    label: "Analytics & Performance",
    description: "Allow collection of usage data to improve the platform experience.",
  },
  marketing: {
    label: "Marketing Communications",
    description: "Receive product updates, tips, and promotional content via email.",
  },
  third_party_sharing: {
    label: "Third-Party Data Sharing",
    description: "Allow sharing anonymized data with trusted partners for research.",
  },
  cookies: {
    label: "Non-Essential Cookies",
    description: "Enable cookies for personalization and improved functionality.",
  },
  profiling: {
    label: "Candidate Profiling",
    description: "Allow AI-assisted candidate profile matching and recommendations.",
  },
};

export default function GDPRPage() {
  const [consents, setConsents] = useState<ConsentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Data export
  const [exporting, setExporting] = useState(false);

  // Erasure request
  const [erasureDialogOpen, setErasureDialogOpen] = useState(false);
  const [erasureReason, setErasureReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Admin: Erasure requests
  const [erasureRequests, setErasureRequests] = useState<ErasureRequest[]>([]);
  const [erasureRequestsLoading, setErasureRequestsLoading] = useState(false);
  const [isAdmin] = useState(true); // Would normally come from auth context
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchConsents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await gdprService.getConsents();
      setConsents(data);
    } catch (error) {
      console.error("Failed to fetch consents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchErasureRequests = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setErasureRequestsLoading(true);
      const data = await gdprService.getErasureRequests();
      setErasureRequests(data);
    } catch (error) {
      console.error("Failed to fetch erasure requests:", error);
    } finally {
      setErasureRequestsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchConsents();
    fetchErasureRequests();
  }, [fetchConsents, fetchErasureRequests]);

  // ─── Toggle Consent ─────────────────────────────────────────────────────────

  const handleToggleConsent = async (consent: ConsentResponse) => {
    const consentType = consent.consentType;
    setToggling(consentType);

    try {
      if (consent.granted) {
        await gdprService.revokeConsent(consentType);
        setConsents((prev) =>
          prev.map((c) =>
            c.consentType === consentType
              ? { ...c, granted: false, revokedAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        const updated = await gdprService.recordConsent(consentType, true);
        setConsents((prev) =>
          prev.map((c) => (c.consentType === consentType ? updated : c))
        );
      }
    } catch (error) {
      console.error("Failed to toggle consent:", error);
    } finally {
      setToggling(null);
    }
  };

  // ─── Data Export ────────────────────────────────────────────────────────────

  const handleExportData = async () => {
    try {
      setExporting(true);
      const blob = await gdprService.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setExporting(false);
    }
  };

  // ─── Request Erasure ────────────────────────────────────────────────────────

  const handleRequestErasure = async () => {
    try {
      setRequesting(true);
      await gdprService.requestErasure(erasureReason.trim() || undefined);
      setErasureDialogOpen(false);
      setErasureReason("");
    } catch (error) {
      console.error("Failed to request erasure:", error);
    } finally {
      setRequesting(false);
    }
  };

  // ─── Process Erasure (Admin) ────────────────────────────────────────────────

  const handleProcessErasure = async (requestId: string, approved: boolean) => {
    try {
      setProcessing(requestId);
      await gdprService.processErasure(requestId, approved);
      setErasureRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: approved ? "COMPLETED" : "REJECTED",
                processedAt: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (error) {
      console.error("Failed to process erasure request:", error);
    } finally {
      setProcessing(null);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-64 bg-slate-200" />
        <Skeleton className="h-4 w-96 bg-slate-100" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy & Data Protection</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your data privacy preferences and exercise your GDPR rights.
        </p>
      </div>

      {/* ─── Consent Management ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Consent Management</h2>
        <div className="space-y-3">
          {consents.map((consent) => {
            const meta = CONSENT_TYPE_LABELS[consent.consentType] || {
              label: consent.consentType,
              description: "",
            };
            return (
              <Card key={consent.id} className="border-slate-200">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                    {meta.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                    )}
                    {consent.granted && consent.grantedAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        Granted: {new Date(consent.grantedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleConsent(consent)}
                    disabled={toggling === consent.consentType}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 disabled:opacity-50 ${
                      consent.granted ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        consent.granted ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator className="bg-slate-200" />

      {/* ─── Data Export ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Data Export</h2>
        <Card className="border-slate-200">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Export My Data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a copy of all your personal data stored on our platform.
              </p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export My Data"}
            </Button>
          </div>
        </Card>
      </section>

      <Separator className="bg-slate-200" />

      {/* ─── Data Erasure ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Data Erasure</h2>
        <Card className="border-red-200 bg-red-50">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Request Account Deletion</p>
              <p className="text-xs text-red-700 mt-0.5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              onClick={() => setErasureDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Request Deletion
            </Button>
          </div>
        </Card>
      </section>

      {/* ─── Admin: Pending Erasure Requests ───────────────────────────────────── */}
      {isAdmin && (
        <>
          <Separator className="bg-slate-200" />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Pending Erasure Requests</h2>
            <p className="text-sm text-slate-500">
              Review and process data erasure requests from users.
            </p>

            {erasureRequestsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : erasureRequests.length === 0 ? (
              <Card className="p-8 text-center border-slate-200">
                <p className="text-sm text-slate-400">No pending erasure requests.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {erasureRequests.map((request) => (
                  <Card key={request.id} className="border-slate-200">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {request.userEmail}
                          </p>
                          <Badge
                            className={`text-xs border ${
                              request.status === "PENDING"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : request.status === "COMPLETED"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : request.status === "REJECTED"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.reason && (
                          <p className="text-xs text-slate-500 mt-1">
                            Reason: {request.reason}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Requested: {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>

                      {request.status === "PENDING" && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Button
                            onClick={() => handleProcessErasure(request.id, true)}
                            disabled={processing === request.id}
                            className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 disabled:opacity-50"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleProcessErasure(request.id, false)}
                            disabled={processing === request.id}
                            className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ─── Erasure Request Dialog ──────────────────────────────────────────── */}
      <Dialog open={erasureDialogOpen} onOpenChange={setErasureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Account Deletion</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Card className="border-red-200 bg-red-50">
              <div className="p-3">
                <p className="text-sm text-red-700">
                  Warning: All your interviews, feedback, documents, and personal data will be permanently erased.
                </p>
              </div>
            </Card>

            <div className="space-y-1.5">
              <Label htmlFor="erasure-reason">Reason (optional)</Label>
              <Textarea
                id="erasure-reason"
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                placeholder="Why do you want to delete your account?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setErasureDialogOpen(false);
                setErasureReason("");
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestErasure}
              disabled={requesting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {requesting ? "Submitting..." : "Confirm Deletion Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
