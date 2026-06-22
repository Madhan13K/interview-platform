"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">InterviewAI</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                    {user?.firstName?.[0] ?? "U"}
                  </span>
                  {user?.firstName ?? "Profile"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-600">
          🚀 AI-Powered Interview Preparation
        </div>
        <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
          Practice Interviews.<br />
          <span className="text-blue-600">Get Hired Faster.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Simulate real interviews with AI, receive instant feedback on your
          answers, body language, and communication skills. Prepare for any role
          at any company.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors"
          >
            Start Practicing Free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-center text-3xl font-bold text-slate-900">
            Everything you need to ace your interview
          </h3>
          <p className="mt-3 text-center text-slate-600">
            Our platform covers the full interview preparation lifecycle.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">AI Mock Interviews</h4>
              <p className="mt-2 text-sm text-slate-600">
                Practice with a realistic AI interviewer that adapts questions based on your role and experience level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">Instant Feedback</h4>
              <p className="mt-2 text-sm text-slate-600">
                Get detailed scoring and suggestions on your answers, communication clarity, and technical accuracy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">Question Library</h4>
              <p className="mt-2 text-sm text-slate-600">
                Access hundreds of curated questions across behavioral, technical, and system design categories.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">Video Interviews</h4>
              <p className="mt-2 text-sm text-slate-600">
                Record yourself and get AI analysis on body language, eye contact, and presentation skills.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">Role-Specific Prep</h4>
              <p className="mt-2 text-sm text-slate-600">
                Tailored interview prep for software engineering, product management, data science, and more.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="mt-4 font-semibold text-slate-900">Progress Tracking</h4>
              <p className="mt-2 text-sm text-slate-600">
                Monitor your improvement over time with detailed analytics and performance trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-slate-500">© 2026 InterviewAI. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
            <a href="#" className="hover:text-slate-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
