"use client";

import { useState, useEffect } from "react";
import { referenceCheckService } from "@/services/reference-check.service";

interface ReferenceCheck {
  id: string;
  candidateId: string;
  candidateName: string;
  referenceName: string;
  email: string;
  relationship: string;
  status: "pending" | "sent" | "completed";
  completedAt?: string;
  rating?: number;
}

export default function ReferenceChecksPage() {
  const [checks, setChecks] = useState<ReferenceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ candidateId: "", name: "", email: "", relationship: "" });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const check = await referenceCheckService.create(
        form.candidateId,
        form.name,
        form.email,
        form.relationship
      );
      setChecks((prev) => [check, ...prev]);
      setForm({ candidateId: "", name: "", email: "", relationship: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create reference check:", err);
    }
  };

  const handleSend = async (id: string) => {
    await referenceCheckService.send(id);
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "sent" as const } : c))
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading reference checks...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reference Checks</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Cancel" : "+ New Reference"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Candidate ID</label>
              <input
                type="text"
                value={form.candidateId}
                onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship</label>
              <select
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select...</option>
                <option value="manager">Manager</option>
                <option value="colleague">Colleague</option>
                <option value="report">Direct Report</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create Reference Check
          </button>
        </form>
      )}

      {/* Reference List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Relationship</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {checks.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.referenceName}</p>
                  <p className="text-sm text-slate-500">{c.email}</p>
                </td>
                <td className="px-4 py-3">{c.candidateName || c.candidateId}</td>
                <td className="px-4 py-3 capitalize">{c.relationship}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.status === "completed" ? "bg-green-100 text-green-700" : c.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.status === "pending" && (
                    <button onClick={() => handleSend(c.id)} className="text-sm text-blue-600 hover:underline">
                      Send Request
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {checks.length === 0 && (
          <div className="text-center py-12 text-slate-400">No reference checks created yet.</div>
        )}
      </div>
    </div>
  );
}
