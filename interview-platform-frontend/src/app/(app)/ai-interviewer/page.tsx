"use client";

import { useState, useEffect } from "react";
import { aiInterviewerService } from "@/services/ai-interviewer.service";

interface Session {
  id: string;
  jobTitle: string;
  candidateName: string;
  status: "active" | "completed" | "pending";
  questionsAsked: number;
  startedAt: string;
  score?: number;
}

export default function AIInterviewerPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ jobId: "", candidateId: "" });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const session = await aiInterviewerService.createSession(form.jobId, form.candidateId);
      setSessions((prev) => [session, ...prev]);
      setForm({ jobId: "", candidateId: "" });
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (sessionId: string) => {
    await aiInterviewerService.complete(sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: "completed" as const } : s))
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading AI Interviewer...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">AI Interviewer</h1>

      {/* Create Session Form */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create AI Interview Session</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Job ID</label>
            <input
              type="text"
              value={form.jobId}
              onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter job position ID"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Candidate ID</label>
            <input
              type="text"
              value={form.candidateId}
              onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter candidate ID"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {creating ? "Creating..." : "Start Session"}
          </button>
        </form>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Sessions</h2>
        </div>
        <div className="divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.candidateName || "Candidate"}</p>
                <p className="text-sm text-slate-500">{s.jobTitle || "Position"} - {s.questionsAsked} questions asked</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                  {s.status}
                </span>
                {s.score !== undefined && (
                  <span className="text-sm font-bold">{s.score}%</span>
                )}
                {s.status === "active" && (
                  <button
                    onClick={() => handleComplete(s.id)}
                    className="px-3 py-1 text-sm bg-slate-200 rounded hover:bg-slate-300"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400">No AI interview sessions yet. Create one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
