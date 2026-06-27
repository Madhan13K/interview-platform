"use client";

import { useState, useEffect } from "react";
import { calibrationService } from "@/services/calibration.service";

interface InterviewerCalibration {
  interviewerId: string;
  name: string;
  avgScore: number;
  totalInterviews: number;
  hireRate: number;
  biasIndicators: { category: string; severity: string }[];
  deviation: number;
}

export default function CalibrationPage() {
  const [data, setData] = useState<InterviewerCalibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    calibrationService.getOrgCalibration()
      .then((res) => setData(res || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCompare = async () => {
    if (selectedIds.length >= 2) {
      const result = await calibrationService.compare(selectedIds);
      console.log("Comparison result:", result);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading calibration data...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interviewer Calibration</h1>
        <button
          onClick={handleCompare}
          disabled={selectedIds.length < 2}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          Compare Selected ({selectedIds.length})
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Interviewer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Interviews</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hire Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deviation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bias Indicators</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.interviewerId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.interviewerId)}
                    onChange={() => toggleSelect(row.interviewerId)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.avgScore.toFixed(1)}</td>
                <td className="px-4 py-3">{row.totalInterviews}</td>
                <td className="px-4 py-3">{(row.hireRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${Math.abs(row.deviation) > 1.5 ? "bg-red-100 text-red-700" : Math.abs(row.deviation) > 0.75 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    {row.deviation > 0 ? "+" : ""}{row.deviation.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {row.biasIndicators.map((b, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-xs ${b.severity === "high" ? "bg-red-100 text-red-700" : b.severity === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                        {b.category}
                      </span>
                    ))}
                    {row.biasIndicators.length === 0 && (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-slate-400">No calibration data available.</div>
        )}
      </div>
    </div>
  );
}
