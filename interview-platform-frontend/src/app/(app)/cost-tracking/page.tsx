"use client";

import { useState, useEffect } from "react";
import { costPerHireService, CostEntry } from "@/services/cost-per-hire.service";

interface CostBreakdown {
  category: string;
  total: number;
  percentage: number;
}

interface PositionCost {
  jobId: string;
  jobTitle: string;
  totalCost: number;
  hires: number;
  costPerHire: number;
}

export default function CostTrackingPage() {
  const [breakdown, setBreakdown] = useState<CostBreakdown[]>([]);
  const [avgCost, setAvgCost] = useState<number>(0);
  const [positionCosts, setPositionCosts] = useState<PositionCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "", jobId: "", description: "" });

  useEffect(() => {
    Promise.all([
      costPerHireService.getBreakdown("2024-01-01").catch(() => []),
      costPerHireService.getAvgCost().catch(() => ({ average: 0 })),
    ]).then(([b, a]) => {
      setBreakdown(b || []);
      setAvgCost(a?.average || 0);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CostEntry = {
      category: form.category,
      amount: parseFloat(form.amount),
      jobId: form.jobId,
      description: form.description,
    };
    await costPerHireService.addCost(data);
    setForm({ category: "", amount: "", jobId: "", description: "" });
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading cost data...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cost Tracking</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Cancel" : "+ Add Cost"}
        </button>
      </div>

      {/* Add Cost Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select...</option>
                <option value="advertising">Advertising</option>
                <option value="agency">Agency Fees</option>
                <option value="tools">Tools & Software</option>
                <option value="events">Events</option>
                <option value="referral">Referral Bonus</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Job ID</label>
              <input
                type="text"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save Cost
          </button>
        </form>
      )}

      {/* Average Cost Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">${avgCost.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">Average Cost per Hire</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold">{breakdown.length}</p>
          <p className="text-sm text-slate-500 mt-1">Cost Categories</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-3xl font-bold text-green-600">
            ${breakdown.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total Spend</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.category} className="flex items-center gap-4">
              <span className="w-28 text-sm font-medium capitalize">{b.category}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${b.percentage}%` }} />
              </div>
              <span className="text-sm font-medium w-24 text-right">${b.total.toLocaleString()}</span>
            </div>
          ))}
          {breakdown.length === 0 && <p className="text-slate-400 text-sm">No cost data recorded.</p>}
        </div>
      </div>
    </div>
  );
}
