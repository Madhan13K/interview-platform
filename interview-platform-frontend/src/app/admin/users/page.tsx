"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { userService } from "@/services/user.service";
import type { UserResponse, CreateUserRequest } from "@/types/auth";

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewUser, setViewUser] = useState<UserResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchId, setSearchId] = useState("");
  const { addToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserRequest>();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSearchUser = async () => {
    if (!searchId.trim()) {
      addToast({ title: "Input Required", description: "Enter a user ID to search", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await userService.getById(searchId.trim());
      setUsers([user]);
      setViewUser(user);
    } catch {
      addToast({ title: "Not Found", description: "User not found with that ID", variant: "destructive" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onCreateSubmit = async (data: CreateUserRequest) => {
    setSubmitting(true);
    try {
      const newUser = await userService.create(data);
      addToast({ title: "Success", description: "User created successfully", variant: "success" });
      setShowCreate(false);
      reset();
      setUsers((prev) => [newUser, ...prev]);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      addToast({
        title: "Error",
        description: apiError.response?.data?.message ?? "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "INACTIVE": return "secondary";
      case "SUSPENDED": return "destructive";
      case "PENDING": return "warning";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
          <p className="mt-1 text-slate-500">Create users and manage their profiles.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Create User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <Input
          placeholder="Enter User ID (UUID) to search..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="max-w-md"
          onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
        />
        <Button variant="outline" onClick={handleSearchUser}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Search
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-slate-500">Searching...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-slate-700">Search for users</p>
            <p className="mt-1 text-sm text-slate-500">
              Enter a user ID to look up their profile, or create a new user.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status) as "success" | "secondary" | "destructive" | "warning" | "outline"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.length ? user.roles.map((role) => (
                        <Badge key={role} variant="info" className="text-xs">{role}</Badge>
                      )) : (
                        <span className="text-xs text-slate-400">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewUser(user)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName", { required: "First name is required" })}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName", { required: "Last name is required" })}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } })}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (optional)</Label>
              <Input
                id="phoneNumber"
                placeholder="+1 (555) 000-0000"
                {...register("phoneNumber")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Viewing profile information for {viewUser?.firstName} {viewUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-700">
                  {viewUser.firstName?.[0]}{viewUser.lastName?.[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold">{viewUser.firstName} {viewUser.lastName}</p>
                  <p className="text-sm text-slate-500">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <Badge variant={getStatusBadgeVariant(viewUser.status) as "success" | "secondary" | "destructive" | "warning" | "outline"} className="mt-1">
                    {viewUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="mt-1 text-sm">{viewUser.phoneNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">User ID</p>
                  <p className="mt-1 font-mono text-xs text-slate-600">{viewUser.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Roles</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {viewUser.roles?.length ? viewUser.roles.map((role) => (
                      <Badge key={role} variant="info" className="text-xs">{role}</Badge>
                    )) : (
                      <span className="text-xs text-slate-400">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
