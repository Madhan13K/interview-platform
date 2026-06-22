"use client";

import { useEffect, useState, useCallback } from "react";
import { tagService } from "@/services/tag.service";
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
import type { TagResponse, CreateTagRequest } from "@/types";

const PRESET_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#84cc16", label: "Lime" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Slate" },
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tagService.getAll();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.category && tag.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group tags by category
  const groupedTags = filteredTags.reduce<Record<string, TagResponse[]>>((acc, tag) => {
    const category = tag.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {});

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setFormColor("#3b82f6");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;

    try {
      setCreating(true);
      const request: CreateTagRequest = {
        name: formName.trim(),
        category: formCategory.trim() || undefined,
        color: formColor,
      };
      const newTag = await tagService.create(request);
      setTags((prev) => [...prev, newTag]);
      resetForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await tagService.delete(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 bg-slate-200" />
            <Skeleton className="h-4 w-64 bg-slate-200 mt-2" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-64 bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 bg-slate-100 rounded-lg" />
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tags</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage tags to categorize and organize your content.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Tag
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search tags by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        {searchQuery && (
          <Button
            onClick={() => setSearchQuery("")}
            className="h-10 px-3 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
          >
            Clear
          </Button>
        )}
        <span className="text-sm text-slate-500 ml-auto">
          {filteredTags.length} tag{filteredTags.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty State */}
      {filteredTags.length === 0 && (
        <Card className="p-12 text-center border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No tags found</p>
            <p className="text-sm text-slate-400">
              {tags.length === 0
                ? "Create your first tag to get started."
                : "Try adjusting your search."}
            </p>
            {tags.length === 0 && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Tag
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Tags grouped by category */}
      {Object.keys(groupedTags).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedTags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryTags]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryTags.map((tag) => (
                    <Card
                      key={tag.id}
                      className="border-slate-200 hover:border-slate-300 transition-colors relative group"
                    >
                      <div className="p-4 space-y-3">
                        {/* Color indicator & name */}
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full flex-shrink-0 border border-black/10"
                            style={{ backgroundColor: tag.color || "#64748b" }}
                          />
                          <span className="font-medium text-slate-900 text-sm truncate">
                            {tag.name}
                          </span>
                        </div>

                        {/* Usage count */}
                        <div className="flex items-center justify-between">
                          <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                            {tag.usageCount} use{tag.usageCount !== 1 ? "s" : ""}
                          </Badge>

                          {/* Delete button */}
                          {deleteConfirmId === tag.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleDelete(tag.id)}
                                className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => setDeleteConfirmId(null)}
                                className="h-6 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setDeleteConfirmId(tag.id)}
                              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ─── Create Tag Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>
              Add a new tag with an optional category and color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., JavaScript, Senior, Urgent"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="tag-category">Category (optional)</Label>
              <Input
                id="tag-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g., Skill, Level, Priority"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    onClick={() => setFormColor(color.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formColor === color.value
                        ? "border-slate-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-1.5">
              <Label>Preview</Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: formColor }}
                />
                <span className="text-sm font-medium text-slate-900">
                  {formName || "Tag Name"}
                </span>
                {formCategory && (
                  <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200 ml-auto">
                    {formCategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetForm();
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
              {creating ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
