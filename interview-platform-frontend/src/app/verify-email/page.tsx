"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyEmail = useCallback(async (verifyToken: string) => {
    setState("loading");
    try {
      await api.post(AUTH_ENDPOINTS.verifyEmail, { token: verifyToken });
      setState("success");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        apiError.response?.data?.message || "Email verification failed. The link may be expired or invalid."
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setErrorMessage("No verification token provided. Please check your email link.");
      setState("error");
    }
  }, [token, verifyEmail]);

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await api.post(AUTH_ENDPOINTS.resendVerification, { email: email.trim() });
      setResendSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        apiError.response?.data?.message || "Failed to resend verification email."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
          <span className="text-lg font-bold text-white">AI</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Email Verification
        </h1>
        <p className="mt-2 text-slate-600">
          {state === "loading" && "Verifying your email address..."}
          {state === "success" && "Your email has been verified!"}
          {state === "error" && "Verification failed"}
        </p>
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="sr-only">Email Verification</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Loading State */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="text-sm text-slate-600">
                Verifying your email address, please wait...
              </p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <p className="font-medium">Email verified successfully!</p>
                <p className="mt-1">
                  Your email address has been confirmed. You can now sign in to your account.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="space-y-4">
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>

              {resendSuccess ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <p className="font-medium">Verification email sent!</p>
                  <p className="mt-1">
                    Please check your inbox and spam folder for the new verification link.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Enter your email address to receive a new verification link:
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleResend}
                    disabled={resendLoading || !email.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
