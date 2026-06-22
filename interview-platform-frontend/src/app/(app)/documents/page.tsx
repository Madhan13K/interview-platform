"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { documentService } from "@/services/document.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentResponse, DocumentType } from "@/types";

const DOCUMENT_TYPES: DocumentType[] = [
  "RESUME",
  "COVER_LETTER",
  "PORTFOLIO",
  "CERTIFICATE",
  "OTHER",
];

function getFileIcon(contentType: string) {
  if (contentType.includes("pdf")) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm5-1H6v-1h3v1zm4-3H6v-1h7v1zm0-3H6V9h7v2zm0-4H6V5h7v2z" />
        </svg>
      </div>
    );
  }
  if (contentType.includes("word") || contentType.includes("doc")) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm3-2l1.5-6h1l1 4 1-4h1L14 16h-1l-1.5-5-1.5 5H9z" />
        </svg>
      </div>
    );
  }
  if (contentType.includes("image")) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
      </div>
    );
  }
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm2-9h8v1H6V9zm0 3h8v1H6v-1zm0 3h5v1H6v-1z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 18h12V6h-4V2H4v16z" />
      </svg>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTypeBadgeVariant(type: DocumentType) {
  const variants: Record<DocumentType, string> = {
    RESUME: "bg-indigo-100 text-indigo-700 border-indigo-200",
    COVER_LETTER: "bg-purple-100 text-purple-700 border-purple-200",
    PORTFOLIO: "bg-amber-100 text-amber-700 border-amber-200",
    CERTIFICATE: "bg-teal-100 text-teal-700 border-teal-200",
    OTHER: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return variants[type];
}

export default function DocumentsPage() {
  const { showSuccess, showError } = useActionFeedback();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "ALL">("ALL");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<DocumentType>("RESUME");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentService.getMy();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      showError("Failed to load", "Could not fetch documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || doc.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await documentService.upload(
        selectedFile,
        uploadDocType,
        entityType || undefined,
        entityId || undefined
      );
      showSuccess("Document uploaded");
      setUploadProgress(100);
      setTimeout(() => {
        setUploadDialogOpen(false);
        resetUploadForm();
        fetchDocuments();
      }, 500);
    } catch (error) {
      console.error("Upload failed:", error);
      showError("Upload failed", "Could not upload document");
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentService.delete(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      showSuccess("Document deleted");
    } catch (error) {
      console.error("Failed to delete document:", error);
      showError("Delete failed", "Could not delete document");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await documentService.getDownloadUrl(id);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get download URL:", error);
      showError("Download failed", "Could not get download URL");
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadDocType("RESUME");
    setEntityType("");
    setEntityId("");
    setUploadProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and organize your uploaded documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : selectedFile
                      ? "border-green-300 bg-green-50"
                      : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <svg
                      className="mx-auto h-8 w-8 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-10 w-10 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-slate-400">
                      or click to browse files
                    </p>
                  </div>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type</Label>
                <Select
                  value={uploadDocType}
                  onValueChange={(val) => setUploadDocType(val as DocumentType)}
                >
                  <SelectTrigger id="doc-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Type (optional) */}
              <div className="space-y-2">
                <Label htmlFor="entity-type">
                  Entity Type{" "}
                  <span className="text-slate-400">(optional)</span>
                </Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger id="entity-type">
                    <SelectValue placeholder="Link to entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERVIEW">Interview</SelectItem>
                    <SelectItem value="CANDIDATE">Candidate</SelectItem>
                    <SelectItem value="JOB">Job</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entity ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="entity-id">
                  Entity ID <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="entity-id"
                  placeholder="Enter entity ID"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Uploading...</span>
                    <span className="font-medium text-indigo-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(val) =>
              setTypeFilter(val as DocumentType | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-16">
          <svg
            className="h-16 w-16 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-700">
            No documents found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || typeFilter !== "ALL"
              ? "Try adjusting your filters"
              : "Upload your first document to get started"}
          </p>
          {!searchQuery && typeFilter === "ALL" && (
            <Button
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Document
            </Button>
          )}
        </div>
      )}

      {/* Documents Grid */}
      {!loading && filteredDocuments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="group transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getFileIcon(doc.contentType)}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-slate-900"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getTypeBadgeVariant(doc.documentType)}
                      >
                        {doc.documentType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="text-slate-300">|</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      Uploaded by {doc.uploadedBy}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1 text-xs text-slate-600 hover:text-indigo-600"
                    onClick={() => handleDownload(doc.id)}
                  >
                    <svg
                      className="mr-1 h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1 text-xs text-slate-600 hover:text-red-600"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <svg
                      className="mr-1 h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
