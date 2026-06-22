"use client";

import { useState, useEffect, useMemo } from "react";
import { videoService } from "@/services/video.service";
import type { VideoRecordingResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";

function formatDuration(seconds?: number): string {
  if (seconds == null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatFileSize(bytes?: number): string {
  if (bytes == null) return "-- MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: VideoRecordingResponse["status"] }) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Completed</Badge>;
    case "RECORDING":
      return (
        <Badge variant="warning" className="animate-pulse">
          Recording
        </Badge>
      );
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<VideoRecordingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<VideoRecordingResponse | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchRecordings();
  }, []);

  async function fetchRecordings() {
    try {
      setLoading(true);
      setError(null);
      const data = await videoService.getMy();
      setRecordings(data);
    } catch {
      setError("Failed to load recordings.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRecordings = useMemo(() => {
    if (!search.trim()) return recordings;
    const q = search.toLowerCase();
    return recordings.filter((r) => r.interviewId.toLowerCase().includes(q));
  }, [recordings, search]);

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Delete Recording",
      description: "This action cannot be undone. The recording will be permanently deleted.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await videoService.delete(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecording?.id === id) setSelectedRecording(null);
    } catch {
      setError("Failed to delete recording.");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Recordings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-video bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Recordings</h1>
        <EmptyState
          type="error"
          title="Error Loading Recordings"
          description={error}
          action={{ label: "Retry", onClick: fetchRecordings }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
      </div>

      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search by interview ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredRecordings.length === 0 ? (
        <EmptyState
          type="no-data"
          title="No Recordings"
          description={
            search
              ? "No recordings match your search."
              : "You don't have any recorded interview sessions yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <Card
              key={recording.id}
              className="cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all"
              onClick={() => {
                if (recording.status === "COMPLETED" && recording.url) {
                  setSelectedRecording(recording);
                }
              }}
            >
              <div className="p-4">
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={recording.status} />
                  <span className="text-xs text-slate-500">
                    {formatDate(recording.startedAt)}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-900 truncate mb-1">
                  Interview: {recording.interviewId.slice(0, 8)}...
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatDuration(recording.duration)}</span>
                  <span>{formatFileSize(recording.fileSize)}</span>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(recording.id);
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog
        open={selectedRecording !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRecording(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Recording - Interview {selectedRecording?.interviewId.slice(0, 8)}...
            </DialogTitle>
          </DialogHeader>
          {selectedRecording?.url && (
            <div className="mt-4">
              <video
                className="w-full rounded-lg"
                controls
                autoPlay
                src={selectedRecording.url}
              >
                Your browser does not support the video tag.
              </video>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span>Duration: {formatDuration(selectedRecording.duration)}</span>
                <span>Size: {formatFileSize(selectedRecording.fileSize)}</span>
                {selectedRecording.completedAt && (
                  <span>Completed: {formatDate(selectedRecording.completedAt)}</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}
