"use client";

import { useEffect, useState, useCallback } from "react";
import { organizationService } from "@/services/organization.service";
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
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  OrganizationResponse,
  OrganizationMember,
  CreateOrganizationRequest,
} from "@/types";

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
];

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "OWNER":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "ADMIN":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "MEMBER":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getPlanBadgeColor(plan?: string): string {
  switch (plan?.toUpperCase()) {
    case "ENTERPRISE":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "PRO":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "STARTER":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDomain, setFormDomain] = useState("");

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrganizationResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [saving, setSaving] = useState(false);

  // Detail dialog (members)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await organizationService.getMy();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ─── Create Organization ──────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formName.trim()) return;

    try {
      setCreating(true);
      const request: CreateOrganizationRequest = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        domain: formDomain.trim() || undefined,
      };
      const newOrg = await organizationService.create(request);
      setOrganizations((prev) => [...prev, newOrg]);
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setFormName("");
    setFormDescription("");
    setFormDomain("");
  };

  // ─── Edit Organization ────────────────────────────────────────────────────────

  const handleOpenEdit = (org: OrganizationResponse) => {
    setEditOrg(org);
    setEditName(org.name);
    setEditDescription(org.description || "");
    setEditDomain(org.domain || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editOrg || !editName.trim()) return;

    try {
      setSaving(true);
      const updated = await organizationService.update(editOrg.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        domain: editDomain.trim() || undefined,
      });
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      setEditDialogOpen(false);
      setEditOrg(null);
    } catch (error) {
      console.error("Failed to update organization:", error);
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Organization ──────────────────────────────────────────────────────

  const handleDelete = async (org: OrganizationResponse) => {
    if (
      !confirm(
        `Are you sure you want to delete "${org.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await organizationService.delete(org.id);
      setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
    } catch (error) {
      console.error("Failed to delete organization:", error);
    }
  };

  // ─── Organization Detail / Members ────────────────────────────────────────────

  const handleViewMembers = async (org: OrganizationResponse) => {
    setSelectedOrg(org);
    setDetailDialogOpen(true);
    setMembersLoading(true);
    try {
      const data = await organizationService.getMembers(org.id);
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedOrg || !addMemberUserId.trim()) return;

    try {
      setAddingMember(true);
      await organizationService.addMember(selectedOrg.id, {
        userId: addMemberUserId.trim(),
        role: addMemberRole,
      });
      const updatedMembers = await organizationService.getMembers(selectedOrg.id);
      setMembers(updatedMembers);
      setAddMemberUserId("");
      setAddMemberRole("MEMBER");
      // Update member count in the list
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === selectedOrg.id
            ? { ...o, memberCount: updatedMembers.length }
            : o
        )
      );
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg) return;

    try {
      await organizationService.removeMember(selectedOrg.id, userId);
      const updatedMembers = await organizationService.getMembers(selectedOrg.id);
      setMembers(updatedMembers);
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === selectedOrg.id
            ? { ...o, memberCount: updatedMembers.length }
            : o
        )
      );
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    if (!selectedOrg) return;

    try {
      await organizationService.updateMemberRole(selectedOrg.id, userId, role);
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, role: role as OrganizationMember["role"] } : m
        )
      );
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 bg-slate-100 rounded-lg" />
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
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Organization
        </Button>
      </div>

      {/* Empty State */}
      {organizations.length === 0 && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No organizations yet</p>
            <p className="text-sm text-slate-400">
              Create your first organization to start managing teams and members.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Organization
            </Button>
          </div>
        </Card>
      )}

      {/* Organizations Grid */}
      {organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="p-5 space-y-4">
                {/* Org Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {org.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {org.plan && (
                        <Badge
                          className={`text-xs border ${getPlanBadgeColor(org.plan)}`}
                        >
                          {org.plan}
                        </Badge>
                      )}
                      {org.domain && (
                        <span className="text-xs text-slate-400">{org.domain}</span>
                      )}
                    </div>
                  </div>
                  {org.logoUrl && (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                </div>

                {/* Description */}
                {org.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {org.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs">
                    Created {new Date(org.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    onClick={() => handleViewMembers(org)}
                    className="h-8 px-3 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                  >
                    Members
                  </Button>
                  <Button
                    onClick={() => handleOpenEdit(org)}
                    className="h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(org)}
                    className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 ml-auto"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Organization Detail / Members Dialog ────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg?.name || "Organization"} — Members
            </DialogTitle>
            <DialogDescription>
              {selectedOrg?.description && (
                <span className="text-slate-500">{selectedOrg.description}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {membersLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-5 mt-4">
              {/* Add Member Form */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Add Member</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter user ID..."
                    value={addMemberUserId}
                    onChange={(e) => setAddMemberUserId(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={addMemberRole}
                    onChange={(e) => setAddMemberRole(e.target.value)}
                    options={ROLE_OPTIONS.filter((r) => r.value !== "OWNER")}
                    className="w-32"
                  />
                  <Button
                    onClick={handleAddMember}
                    disabled={addingMember || !addMemberUserId.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  >
                    {addingMember ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Members ({members.length})
                </Label>

                {members.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-400">
                      No members yet. Add a member using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        {/* Avatar */}
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-700">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Name & Email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {member.userName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {member.email}
                          </p>
                        </div>

                        {/* Role Badge / Dropdown */}
                        {member.role === "OWNER" ? (
                          <Badge
                            className={`text-xs border ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role}
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(member.userId, e.target.value)
                            }
                            options={ROLE_OPTIONS.filter((r) => r.value !== "OWNER")}
                            className="w-32 h-8 text-sm"
                          />
                        )}

                        {/* Remove Button (not for owners) */}
                        {member.role !== "OWNER" && (
                          <Button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent flex-shrink-0"
                          >
                            &times;
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Organization Dialog ──────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Set up a new organization with a name and optional details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Acme Corp"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of the organization..."
                rows={3}
              />
            </div>

            {/* Domain */}
            <div className="space-y-1.5">
              <Label htmlFor="org-domain">Domain</Label>
              <Input
                id="org-domain"
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
                placeholder="e.g., acme.com"
              />
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
              {creating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Organization Dialog ────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Organization name"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-org-description">Description</Label>
              <Textarea
                id="edit-org-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            {/* Domain */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-org-domain">Domain</Label>
              <Input
                id="edit-org-domain"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="e.g., acme.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditOrg(null);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
