"use client";

import { useEffect, useState, useCallback } from "react";
import { teamService } from "@/services/team.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";
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
import type { TeamResponse, TeamMember, CreateTeamRequest } from "@/types";

const DEPARTMENT_OPTIONS = [
  { value: "", label: "All Departments" },
  { value: "Engineering", label: "Engineering" },
  { value: "Design", label: "Design" },
  { value: "Product", label: "Product" },
  { value: "Marketing", label: "Marketing" },
  { value: "Sales", label: "Sales" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Operations", label: "Operations" },
];

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member" },
  { value: "LEAD", label: "Lead" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "INTERVIEWER", label: "Interviewer" },
  { value: "ADMIN", label: "Admin" },
];

export default function TeamsPage() {
  const { showSuccess, showError } = useActionFeedback();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Create team dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formLeadId, setFormLeadId] = useState("");

  // Team detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editLeadId, setEditLeadId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamService.getAll();
      setTeams(data);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      showError("Failed to load", "Could not fetch teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDepartment =
      !departmentFilter || team.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // ─── Create Team ────────────────────────────────────────────────────────────

  const handleCreateTeam = async () => {
    if (!formName.trim() || !formDepartment.trim()) return;

    try {
      setCreating(true);
      const request: CreateTeamRequest = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        department: formDepartment.trim(),
        leadId: formLeadId.trim() || undefined,
      };
      const newTeam = await teamService.create(request);
      setTeams((prev) => [...prev, newTeam]);
      showSuccess("Team created");
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create team:", error);
      showError("Create failed", "Could not create team");
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setFormName("");
    setFormDescription("");
    setFormDepartment("");
    setFormLeadId("");
  };

  // ─── Team Detail ────────────────────────────────────────────────────────────

  const handleViewMembers = async (team: TeamResponse) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const fullTeam = await teamService.getById(team.id);
      setSelectedTeam(fullTeam);
    } catch (error) {
      console.error("Failed to fetch team details:", error);
      showError("Load failed", "Could not fetch team details");
      setSelectedTeam(team);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !addMemberUserId.trim()) return;

    try {
      setAddingMember(true);
      await teamService.addMember(selectedTeam.id, addMemberUserId.trim());
      const updated = await teamService.getById(selectedTeam.id);
      setSelectedTeam(updated);
      setTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showSuccess("Member added");
      setAddMemberUserId("");
    } catch (error) {
      console.error("Failed to add member:", error);
      showError("Add failed", "Could not add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      await teamService.removeMember(selectedTeam.id, userId);
      const updated = await teamService.getById(selectedTeam.id);
      setSelectedTeam(updated);
      setTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showSuccess("Member removed");
    } catch (error) {
      console.error("Failed to remove member:", error);
      showError("Remove failed", "Could not remove member");
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    if (!selectedTeam) return;

    try {
      await teamService.updateMemberRole(selectedTeam.id, userId, role);
      const updated = await teamService.getById(selectedTeam.id);
      setSelectedTeam(updated);
      showSuccess("Role updated");
    } catch (error) {
      console.error("Failed to update member role:", error);
      showError("Update failed", "Could not update member role");
    }
  };

  // ─── Edit Team ──────────────────────────────────────────────────────────────

  const handleOpenEdit = (team: TeamResponse) => {
    setEditTeam(team);
    setEditName(team.name);
    setEditDescription(team.description || "");
    setEditDepartment(team.department);
    setEditLeadId(team.leadId || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTeam || !editName.trim() || !editDepartment.trim()) return;

    try {
      setSaving(true);
      const updated = await teamService.update(editTeam.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        department: editDepartment.trim(),
        leadId: editLeadId.trim() || undefined,
      });
      setTeams((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showSuccess("Team updated");
      setEditDialogOpen(false);
      setEditTeam(null);
    } catch (error) {
      console.error("Failed to update team:", error);
      showError("Update failed", "Could not update team");
    } finally {
      setSaving(false);
    }
  };

  // ─── Deactivate / Delete ────────────────────────────────────────────────────

  const handleDeactivate = async (team: TeamResponse) => {
    try {
      await teamService.update(team.id, {
        name: team.name,
        department: team.department,
      });
      setTeams((prev) =>
        prev.map((t) => (t.id === team.id ? { ...t, active: !t.active } : t))
      );
      showSuccess("Team deactivated");
    } catch (error) {
      console.error("Failed to deactivate team:", error);
      showError("Deactivate failed", "Could not deactivate team");
    }
  };

  const handleDelete = async (team: TeamResponse) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await teamService.delete(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      showSuccess("Team deleted");
    } catch (error) {
      console.error("Failed to delete team:", error);
      showError("Delete failed", "Could not delete team");
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32 bg-slate-200" />
          <Skeleton className="h-10 w-36 bg-slate-200" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64 bg-slate-200" />
          <Skeleton className="h-10 w-48 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 bg-slate-100 rounded-lg" />
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
        <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Team
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search teams by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          options={DEPARTMENT_OPTIONS}
          className="w-48"
        />
        {(searchQuery || departmentFilter) && (
          <Button
            onClick={() => {
              setSearchQuery("");
              setDepartmentFilter("");
            }}
            className="h-10 px-3 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
          >
            Clear Filters
          </Button>
        )}
        <span className="text-sm text-slate-500 ml-auto">
          {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No teams found</p>
            <p className="text-sm text-slate-400">
              {teams.length === 0
                ? "Create your first team to get started."
                : "Try adjusting your search or filters."}
            </p>
            {teams.length === 0 && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Team
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Teams Grid */}
      {filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="p-5 space-y-4">
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                        {team.department}
                      </Badge>
                      <Badge
                        className={`text-xs border ${
                          team.active
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {team.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Lead */}
                {team.leadName && (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-700">
                        {team.leadName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600">
                      Lead: <span className="font-medium">{team.leadName}</span>
                    </span>
                  </div>
                )}

                {/* Member Count with Avatar Stack */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(team.memberCount, 4) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="h-7 w-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center"
                        >
                          <span className="text-[10px] font-medium text-slate-500">
                            {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                      )
                    )}
                    {team.memberCount > 4 && (
                      <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-slate-600">
                          +{team.memberCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Description */}
                {team.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    onClick={() => handleViewMembers(team)}
                    className="h-8 px-3 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                  >
                    View Members
                  </Button>
                  <Button
                    onClick={() => handleOpenEdit(team)}
                    className="h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    Edit
                  </Button>
                  {team.active ? (
                    <Button
                      onClick={() => handleDeactivate(team)}
                      className="h-8 px-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 ml-auto"
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleDelete(team)}
                      className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 ml-auto"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Team Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTeam?.name || "Team Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.department && (
                <span className="text-slate-500">
                  {selectedTeam.department}
                  {selectedTeam.description && ` — ${selectedTeam.description}`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-5 mt-4">
              {/* Add Member Form */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Add Member
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter user ID..."
                    value={addMemberUserId}
                    onChange={(e) => setAddMemberUserId(e.target.value)}
                    className="flex-1"
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

              {/* Member List */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Members ({selectedTeam?.members?.length || 0})
                </Label>

                {(!selectedTeam?.members || selectedTeam.members.length === 0) ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-400">
                      No members yet. Add a member using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedTeam.members.map((member: TeamMember) => (
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

                        {/* Name & Joined */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {member.userName}
                          </p>
                          <p className="text-xs text-slate-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Role Dropdown */}
                        <Select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateMemberRole(member.userId, e.target.value)
                          }
                          options={ROLE_OPTIONS}
                          className="w-36 h-8 text-sm"
                        />

                        {/* Remove Button */}
                        <Button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent flex-shrink-0"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Team Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Set up a new team with a name, department, and optional lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Frontend Engineering"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of the team's purpose..."
                rows={3}
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="team-department">Department</Label>
              <Select
                id="team-department"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                options={DEPARTMENT_OPTIONS.filter((d) => d.value !== "")}
                placeholder="Select department"
              />
            </div>

            {/* Lead ID */}
            <div className="space-y-1.5">
              <Label htmlFor="team-lead-id">Lead ID (optional)</Label>
              <Input
                id="team-lead-id"
                value={formLeadId}
                onChange={(e) => setFormLeadId(e.target.value)}
                placeholder="User ID of the team lead"
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
              onClick={handleCreateTeam}
              disabled={creating || !formName.trim() || !formDepartment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Team Dialog ────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the team details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Team name"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-department">Department</Label>
              <Select
                id="edit-team-department"
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                options={DEPARTMENT_OPTIONS.filter((d) => d.value !== "")}
                placeholder="Select department"
              />
            </div>

            {/* Lead ID */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-lead-id">Lead ID (optional)</Label>
              <Input
                id="edit-team-lead-id"
                value={editLeadId}
                onChange={(e) => setEditLeadId(e.target.value)}
                placeholder="User ID of the team lead"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditTeam(null);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editName.trim() || !editDepartment.trim()}
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
