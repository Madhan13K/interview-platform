"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { roleService } from "@/services/role.service";
import { permissionService } from "@/services/permission.service";
import type { RoleResponse, PermissionResponse, RolePermissionResponse } from "@/types/auth";

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [assignments, setAssignments] = useState<RolePermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, permissionsData] = await Promise.all([
          roleService.getAll(),
          permissionService.getAll(),
        ]);
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch {
        addToast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssign = async () => {
    if (!selectedRoleId || !selectedPermissionId) {
      addToast({ title: "Selection Required", description: "Please select both a role and a permission", variant: "destructive" });
      return;
    }

    setAssigning(true);
    try {
      const result = await roleService.assignPermission(selectedRoleId, {
        permissionId: selectedPermissionId,
      });
      setAssignments((prev) => [result, ...prev]);
      addToast({ title: "Success", description: `Permission assigned to role successfully`, variant: "success" });
      setSelectedPermissionId("");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      addToast({
        title: "Error",
        description: apiError.response?.data?.message ?? "Failed to assign permission",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role-Permission Assignments</h1>
          <p className="text-slate-500">Loading...</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Role-Permission Assignments</h1>
        <p className="mt-1 text-slate-500">
          Map permissions to roles to control what each role can do in the system.
        </p>
      </div>

      {/* Assignment Form */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg">Assign Permission to Role</CardTitle>
          <CardDescription>
            Select a role and a permission, then click assign to create the mapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                placeholder="Select a role..."
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Permission</label>
              <Select
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                placeholder="Select a permission..."
                options={permissions.map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
            <Button onClick={handleAssign} disabled={assigning} className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
              </svg>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Assignments</CardTitle>
            <CardDescription>Permissions assigned during this session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="info">{assignment.roleName}</Badge>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <Badge variant="secondary" className="font-mono">{assignment.permissionName}</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(assignment.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Roles ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <p className="text-sm text-slate-500">No roles available. Create roles first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role.id} variant="info" className="text-sm">
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Permissions ({permissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {permissions.length === 0 ? (
              <p className="text-sm text-slate-500">No permissions available. Create permissions first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <Badge key={perm.id} variant="secondary" className="font-mono text-xs">
                    {perm.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
