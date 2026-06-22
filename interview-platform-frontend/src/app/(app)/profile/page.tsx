"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { userService } from "@/services/user.service";
import { logout } from "@/services/auth.service";
import type { UpdateUserProfileRequest, UserProfileResponse, RoleResponse, PermissionResponse } from "@/types/auth";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { register, handleSubmit, reset } = useForm<UpdateUserProfileRequest>();

  useEffect(() => {
    const init = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        // Fetch current user details
        const me = await userService.getMe();

        // Fetch profile details
        if (me.id) {
          try {
            const profileData = await userService.getProfile(me.id);
            setProfile(profileData);
          } catch { /* profile may not exist yet */ }

          // Fetch user roles
          try {
            const userRoles = await userService.getUserRoles(me.id);
            setRoles(userRoles);
          } catch { /* use roles from user object */ }

          // Fetch user permissions
          try {
            const userPerms = await userService.getUserPermissions(me.id);
            setPermissions(userPerms);
          } catch { /* may not have permission to view */ }
        }
      } catch {
        // Failed to fetch user data
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [accessToken]);

  useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio ?? "",
        designation: profile.designation ?? "",
        company: profile.company ?? "",
        experienceYears: profile.experienceYears ?? undefined,
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: UpdateUserProfileRequest) => {
    if (!user?.id) {
      setError("User ID not available. Please log in again.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await userService.updateProfile(user.id, data);
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (!user?.id) return;

    setPasswordError(null);
    setChangingPassword(true);
    try {
      await userService.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setPasswordError(apiError.response?.data?.message ?? "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Info Card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg border-4 border-white text-2xl font-bold text-indigo-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>

          {/* Status & Roles */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="success" className="text-xs">
              {user?.status ?? "ACTIVE"}
            </Badge>
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} variant="default" className="text-xs">
                {role}
              </Badge>
            ))}
            {roles.length > 0 && roles.map((role) => (
              !user?.roles?.includes(role.name) && (
                <Badge key={role.id} variant="secondary" className="text-xs">
                  {role.name}
                </Badge>
              )
            ))}
          </div>

          {/* User ID */}
          {user?.id && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400">ID:</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                {user.id}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles & Permissions Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Roles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>Your assigned roles determine access level</CardDescription>
          </CardHeader>
          <CardContent>
            {(user?.roles ?? []).length === 0 && roles.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {(user?.roles ?? []).map((role) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{role}</span>
                    </div>
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Permissions</CardTitle>
            <CardDescription>Granular access controls for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {permissions.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                {accessToken ? "Permissions determined by roles" : "Login to view permissions"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((perm) => (
                  <Badge key={perm.id} variant="outline" className="text-[10px] font-mono">
                    {perm.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professional Profile</CardTitle>
          <CardDescription>
            Update your professional information visible to interviewers and recruiters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={3}
                {...register("bio")}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="designation">Job Title / Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Software Engineer"
                  {...register("designation")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. Google, Microsoft"
                  {...register("company")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input
                id="experienceYears"
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 5"
                {...register("experienceYears", { valueAsNumber: true })}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/yourprofile"
                  {...register("linkedinUrl")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/yourusername"
                  {...register("githubUrl")}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || !accessToken}>
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      {accessToken && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Password changed successfully!
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                variant="outline"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {accessToken && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Logout from all devices</p>
                <p className="text-xs text-slate-500">This will invalidate all your sessions</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
