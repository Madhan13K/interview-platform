"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { OAUTH_URLS, MFA_ENDPOINTS } from "@/lib/api-endpoints";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // MFA Challenge state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const completeLogin = (accessToken: string, email?: string) => {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      useAuthStore.getState().setUser({
        id: payload.sub || payload.userId,
        email: payload.email || email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: payload.roles,
      });
    } catch {
      // Token parsing failed
    }
    router.push(returnUrl);
  };

  const onSubmit = async (data: LoginForm) => {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const auth = await login(parsed.data);

      // Check if server indicates MFA is required
      const responseData = auth as unknown as Record<string, unknown>;
      if (responseData.mfaRequired || responseData.mfa_required) {
        setMfaRequired(true);
        setMfaToken((responseData.mfaToken as string) || (responseData.mfa_token as string) || auth.accessToken);
        setIsLoading(false);
        return;
      }

      completeLogin(auth.accessToken, parsed.data.email);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; mfaRequired?: boolean; mfaToken?: string } } };

      if (apiError.response?.data?.mfaRequired) {
        setMfaRequired(true);
        setMfaToken(apiError.response.data.mfaToken || "");
        setIsLoading(false);
        return;
      }

      setError(apiError.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setError(null);
    setMfaLoading(true);

    try {
      const response = await api.post(MFA_ENDPOINTS.validate, {
        token: mfaToken,
        code: totpCode,
      });

      const data = response.data;
      const accessToken = data.accessToken || data.access_token || "";
      const refreshToken = data.refreshToken || data.refresh_token || undefined;

      useAuthStore.getState().setAuthTokens({ accessToken, refreshToken });
      completeLogin(accessToken);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? "Invalid verification code. Please try again.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = OAUTH_URLS.google;
  };

  const handleGithubLogin = () => {
    window.location.href = OAUTH_URLS.github;
  };

  // ─── MFA Challenge Screen ─────────────────────────────────────────────────
  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Two-Factor Authentication
            </h1>
            <p className="mt-2 text-slate-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="sr-only">MFA Verification</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <div className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="totp-code">Verification Code</Label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleMfaVerify(); }}
                  className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                  autoFocus
                />
                <p className="text-xs text-slate-500 text-center">
                  Open your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>

              <Button
                onClick={handleMfaVerify}
                className="h-11 w-full"
                disabled={mfaLoading || totpCode.length !== 6}
              >
                {mfaLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                variant="outline"
                onClick={() => { setMfaRequired(false); setTotpCode(""); setError(null); }}
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Normal Login Screen ───────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-slate-600">
            Sign in to InterviewAI
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="sr-only">Sign In</CardTitle>
            <CardDescription className="sr-only">Choose a sign-in method</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-11 w-full gap-3 text-sm font-medium" onClick={handleGoogleLogin} type="button">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <Button variant="outline" className="h-11 w-full gap-3 text-sm font-medium" onClick={handleGithubLogin} type="button">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...registerField("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" placeholder="Enter your password" {...registerField("password")} />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="mt-2 h-11 w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
