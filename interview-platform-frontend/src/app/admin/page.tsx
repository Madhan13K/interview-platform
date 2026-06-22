"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleService } from "@/services/role.service";
import { permissionService } from "@/services/permission.service";
import type { RoleResponse, PermissionResponse } from "@/types/auth";

export default function AdminOverviewPage() {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
        // API may not be available yet
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500">Loading system data...</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Roles",
      value: roles.length,
      description: "System-defined roles",
      color: "bg-blue-50 border-blue-200",
      iconColor: "bg-blue-600",
    },
    {
      title: "Total Permissions",
      value: permissions.length,
      description: "Granular access controls",
      color: "bg-purple-50 border-purple-200",
      iconColor: "bg-purple-600",
    },
    {
      title: "Active Roles",
      value: roles.length,
      description: "Currently in use",
      color: "bg-green-50 border-green-200",
      iconColor: "bg-green-600",
    },
    {
      title: "Access Policies",
      value: roles.length * permissions.length > 0 ? "Configured" : "Pending",
      description: "Role-permission mappings",
      color: "bg-amber-50 border-amber-200",
      iconColor: "bg-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-slate-500">
          Manage your platform&apos;s access control system - roles, permissions, and user assignments.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`${stat.color} transition-shadow hover:shadow-md`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <p className="text-sm text-slate-500">No roles configured yet. Create your first role to get started.</p>
            ) : (
              <div className="space-y-2">
                {roles.slice(0, 5).map((role) => (
                  <div key={role.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{role.name}</p>
                      <p className="text-xs text-slate-500">{role.description || "No description"}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Role
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {permissions.length === 0 ? (
              <p className="text-sm text-slate-500">No permissions configured yet. Create permissions to define access controls.</p>
            ) : (
              <div className="space-y-2">
                {permissions.slice(0, 5).map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{perm.name}</p>
                      <p className="text-xs text-slate-500">{perm.description || "No description"}</p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Permission
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
