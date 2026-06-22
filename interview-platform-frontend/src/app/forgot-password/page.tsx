"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/axios";
import { AUTH_ENDPOINTS } from "@/lib/api-endpoints";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.post(AUTH_ENDPOINTS.forgotPassword, { email: parsed.data.email });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      // Always show success to prevent email enumeration
      if (apiError.response?.data?.message) {
        setError(apiError.response.data.message);
      } else {
        setSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-slate-600">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="sr-only">Forgot Password</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {success ? (
              <div className="space-y-4">
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <p className="font-medium">Check your email</p>
                  <p className="mt-1">
                    If an account exists with that email, we&apos;ve sent a password reset link.
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Back to Login</Button>
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-500">
                  Remember your password?{" "}
                  <Link href="/login" className="font-medium text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
