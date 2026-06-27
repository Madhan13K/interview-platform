"use client";

import { useState, useEffect } from "react";
import { competitiveIntelService } from "@/services/competitive-intel.service";

interface CompetitorEntry {
  id: string;
  competitor: string;
  role: string;
  salaryMin: number;
  salaryMax: number;
  benefits: string[];
  source: string;
}

interface SalaryBenchmark {
  competitor: string;
  avgSalary: number;
  difference: number;
}

export default function CompetitiveIntelPage() {
  const [entries, setEntries] = useState<CompetitorEntry[]>([]);
  const [benchmarks, setBenchmarks] = useState<SalaryBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRole, setSearchRole] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCompare = async () => {
    if (searchRole && searchLocation) {
      const data = await competitiveIntelService.compareSalaries(searchRole, searchLocation);
      setBenchmarks(data || []);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading competitive intel...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Competitive Intelligence</h1>

      {/* Salary Comparison Tool */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Salary Benchmarks</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Role (e.g., Senior Engineer)"
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Location (e.g., San Francisco)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={handleCompare}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Compare
          </button>
        </div>
        {benchmarks.length > 0 && (
          <div className="space-y-2">
            {benchmarks.map((b) => (
              <div key={b.competitor} className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">{b.competitor}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">${b.avgSalary.toLocaleString()}</span>
                  <span className={`text-sm font-medium ${b.difference > 0 ? "text-red-600" : "text-green-600"}`}>
                    {b.difference > 0 ? "+" : ""}{b.difference}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Competitor Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Competitor Data</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Competitor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Salary Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Benefits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{e.competitor}</td>
                <td className="px-4 py-3">{e.role}</td>
                <td className="px-4 py-3">${e.salaryMin.toLocaleString()} - ${e.salaryMax.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {e.benefits.slice(0, 3).map((b) => (
                      <span key={b} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{b}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{e.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="text-center py-12 text-slate-400">No competitive data added yet.</div>
        )}
      </div>
    </div>
  );
}
