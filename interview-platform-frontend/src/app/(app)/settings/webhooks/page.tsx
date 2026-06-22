"use client";

import { useEffect, useState, useCallback } from "react";
import { webhookService } from "@/services/webhook.service";
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
import type { WebhookResponse, WebhookDelivery, PaginatedResponse } from "@/types";

const WEBHOOK_EVENTS = [
  "interview.created",
  "interview.completed",
  "interview.cancelled",
  "interview.scheduled",
  "candidate.added",
  "candidate.updated",
  "feedback.submitted",
  "feedback.updated",
  "job_position.opened",
  "job_position.closed",
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookResponse | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Delivery history dialog
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [deliveryWebhookId, setDeliveryWebhookId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveryPage, setDeliveryPage] = useState(0);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(0);

  // Secret dialog
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [newSecret, setNewSecret] = useState("");

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await webhookService.getAll();
      setWebhooks(data);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // ─── Create Webhook ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formUrl.trim() || formEvents.length === 0) return;

    try {
      setCreating(true);
      const newWebhook = await webhookService.create({
        url: formUrl.trim(),
        events: formEvents,
      });
      setWebhooks((prev) => [...prev, newWebhook]);
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create webhook:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setFormUrl("");
    setFormEvents([]);
  };

  const toggleEvent = (event: string, list: string[], setter: (events: string[]) => void) => {
    if (list.includes(event)) {
      setter(list.filter((e) => e !== event));
    } else {
      setter([...list, event]);
    }
  };

  // ─── Edit Webhook ───────────────────────────────────────────────────────────

  const handleOpenEdit = (webhook: WebhookResponse) => {
    setEditWebhook(webhook);
    setEditUrl(webhook.url);
    setEditEvents([...webhook.events]);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editWebhook || !editUrl.trim() || editEvents.length === 0) return;

    try {
      setSaving(true);
      const updated = await webhookService.update(editWebhook.id, {
        url: editUrl.trim(),
        events: editEvents,
      });
      setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setEditDialogOpen(false);
      setEditWebhook(null);
    } catch (error) {
      console.error("Failed to update webhook:", error);
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Active ──────────────────────────────────────────────────────────

  const handleToggleActive = async (webhook: WebhookResponse) => {
    try {
      const updated = await webhookService.update(webhook.id, {
        active: !webhook.active,
      });
      setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
    }
  };

  // ─── Delete Webhook ─────────────────────────────────────────────────────────

  const handleDelete = async (webhook: WebhookResponse) => {
    if (!confirm(`Delete webhook for "${webhook.url}"? This cannot be undone.`)) return;

    try {
      await webhookService.delete(webhook.id);
      setWebhooks((prev) => prev.filter((w) => w.id !== webhook.id));
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  // ─── Regenerate Secret ──────────────────────────────────────────────────────

  const handleRegenerateSecret = async (webhookId: string) => {
    if (!confirm("Regenerate webhook secret? The old secret will stop working immediately.")) return;

    try {
      const { secret } = await webhookService.regenerateSecret(webhookId);
      setNewSecret(secret);
      setSecretDialogOpen(true);
    } catch (error) {
      console.error("Failed to regenerate secret:", error);
    }
  };

  // ─── Delivery History ───────────────────────────────────────────────────────

  const handleViewDeliveries = async (webhookId: string) => {
    setDeliveryWebhookId(webhookId);
    setDeliveryDialogOpen(true);
    setDeliveriesLoading(true);
    setDeliveryPage(0);

    try {
      const data: PaginatedResponse<WebhookDelivery> = await webhookService.getDeliveries(webhookId, 0);
      setDeliveries(data.content);
      setDeliveryTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleDeliveryPageChange = async (page: number) => {
    if (!deliveryWebhookId) return;
    setDeliveriesLoading(true);
    setDeliveryPage(page);

    try {
      const data = await webhookService.getDeliveries(deliveryWebhookId, page);
      setDeliveries(data.content);
      setDeliveryTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      await webhookService.retryDelivery(deliveryId);
      if (deliveryWebhookId) {
        const data = await webhookService.getDeliveries(deliveryWebhookId, deliveryPage);
        setDeliveries(data.content);
      }
    } catch (error) {
      console.error("Failed to retry delivery:", error);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40 bg-slate-200" />
          <Skeleton className="h-10 w-40 bg-slate-200" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full bg-slate-100 rounded-lg" />
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
        <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Webhook
        </Button>
      </div>

      {/* Empty State */}
      {webhooks.length === 0 && (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No webhooks configured</p>
            <p className="text-sm text-slate-400">Create a webhook to receive real-time event notifications.</p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Webhook
            </Button>
          </div>
        </Card>
      )}

      {/* Webhooks List */}
      {webhooks.length > 0 && (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="border-slate-200 hover:border-indigo-200 transition-colors">
              <div className="p-5 space-y-3">
                {/* URL & Status Row */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-mono text-slate-900 truncate">{webhook.url}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {webhook.events.map((event) => (
                        <Badge
                          key={event}
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                      webhook.active ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        webhook.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Meta & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Created: {new Date(webhook.createdAt).toLocaleDateString()}</span>
                    {webhook.lastDeliveryAt && (
                      <span>Last delivery: {new Date(webhook.lastDeliveryAt).toLocaleDateString()}</span>
                    )}
                    <Badge
                      className={`text-xs border ${
                        webhook.active
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenEdit(webhook)}
                      className="h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleViewDeliveries(webhook.id)}
                      className="h-8 px-3 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                    >
                      Deliveries
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSecret(webhook.id)}
                      className="h-8 px-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                    >
                      Regenerate Secret
                    </Button>
                    <Button
                      onClick={() => handleDelete(webhook)}
                      className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create Webhook Dialog ───────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a URL to receive event notifications via HTTP POST.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="webhook-url">Payload URL</Label>
              <Input
                id="webhook-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Events to subscribe</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formEvents.includes(event)}
                      onChange={() => toggleEvent(event, formEvents, setFormEvents)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{event}</span>
                  </label>
                ))}
              </div>
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
              disabled={creating || !formUrl.trim() || formEvents.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Webhook Dialog ─────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update the webhook URL and subscribed events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-webhook-url">Payload URL</Label>
              <Input
                id="edit-webhook-url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Events to subscribe</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={editEvents.includes(event)}
                      onChange={() => toggleEvent(event, editEvents, setEditEvents)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditWebhook(null);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editUrl.trim() || editEvents.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delivery History Dialog ─────────────────────────────────────────── */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              View past webhook deliveries and their status.
            </DialogDescription>
          </DialogHeader>

          {deliveriesLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-slate-100" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No deliveries recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge
                      className={`text-xs border ${
                        delivery.success
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {delivery.success ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">{delivery.event}</span>
                    {delivery.statusCode && (
                      <span className="text-xs text-slate-500">HTTP {delivery.statusCode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {new Date(delivery.deliveredAt).toLocaleString()}
                    </span>
                    {!delivery.success && (
                      <Button
                        onClick={() => handleRetryDelivery(delivery.id)}
                        className="h-7 px-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {deliveryTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <Button
                    onClick={() => handleDeliveryPageChange(deliveryPage - 1)}
                    disabled={deliveryPage === 0}
                    className="h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-500">
                    Page {deliveryPage + 1} of {deliveryTotalPages}
                  </span>
                  <Button
                    onClick={() => handleDeliveryPageChange(deliveryPage + 1)}
                    disabled={deliveryPage >= deliveryTotalPages - 1}
                    className="h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Secret Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Webhook Secret</DialogTitle>
            <DialogDescription>
              Copy this secret now. It will not be displayed again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 p-3 bg-slate-900 rounded-lg">
            <code className="text-sm text-green-400 break-all">{newSecret}</code>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(newSecret);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Copy to Clipboard
            </Button>
            <Button
              onClick={() => {
                setSecretDialogOpen(false);
                setNewSecret("");
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
