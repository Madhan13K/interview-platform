"use client";

import { useState } from "react";

interface Source {
  id: string;
  name: string;
  category: "Job Board" | "Referral" | "Social" | "Agency" | "Direct";
  applied: number;
  interviewed: number;
  hired: number;
  conversionRate: number;
  costPerHire: number;
  roi: "High" | "Medium" | "Low";
  trackingUrl: string;
  monthlyCost: number;
  qualityScore: number;
  avgTimeToHire: number;
  monthlyTrend: number[];
}

const mockSources: Source[] = [
  {
    id: "1",
    name: "LinkedIn Recruiter",
    category: "Social",
    applied: 520,
    interviewed: 156,
    hired: 42,
    conversionRate: 8.1,
    costPerHire: 4200,
    roi: "High",
    trackingUrl: "https://linkedin.com/recruiter/track/abc123",
    monthlyCost: 12000,
    qualityScore: 88,
    avgTimeToHire: 24,
    monthlyTrend: [3, 5, 4, 6, 5, 7],
  },
  {
    id: "2",
    name: "Employee Referrals",
    category: "Referral",
    applied: 180,
    interviewed: 90,
    hired: 38,
    conversionRate: 21.1,
    costPerHire: 2500,
    roi: "High",
    trackingUrl: "",
    monthlyCost: 5000,
    qualityScore: 92,
    avgTimeToHire: 18,
    monthlyTrend: [5, 7, 6, 8, 7, 6],
  },
  {
    id: "3",
    name: "Indeed",
    category: "Job Board",
    applied: 890,
    interviewed: 178,
    hired: 35,
    conversionRate: 3.9,
    costPerHire: 5800,
    roi: "Medium",
    trackingUrl: "https://indeed.com/track/xyz789",
    monthlyCost: 15000,
    qualityScore: 72,
    avgTimeToHire: 32,
    monthlyTrend: [4, 6, 5, 5, 7, 8],
  },
  {
    id: "4",
    name: "Greenhouse Job Board",
    category: "Job Board",
    applied: 340,
    interviewed: 85,
    hired: 22,
    conversionRate: 6.5,
    costPerHire: 3800,
    roi: "Medium",
    trackingUrl: "https://greenhouse.io/track/def456",
    monthlyCost: 8000,
    qualityScore: 78,
    avgTimeToHire: 28,
    monthlyTrend: [2, 4, 3, 5, 4, 4],
  },
  {
    id: "5",
    name: "Tech Talent Agency",
    category: "Agency",
    applied: 65,
    interviewed: 48,
    hired: 18,
    conversionRate: 27.7,
    costPerHire: 18000,
    roi: "Low",
    trackingUrl: "",
    monthlyCost: 25000,
    qualityScore: 85,
    avgTimeToHire: 21,
    monthlyTrend: [2, 3, 3, 4, 3, 3],
  },
  {
    id: "6",
    name: "Company Career Page",
    category: "Direct",
    applied: 420,
    interviewed: 84,
    hired: 28,
    conversionRate: 6.7,
    costPerHire: 1200,
    roi: "High",
    trackingUrl: "https://company.com/careers",
    monthlyCost: 2000,
    qualityScore: 76,
    avgTimeToHire: 30,
    monthlyTrend: [3, 5, 4, 5, 6, 5],
  },
  {
    id: "7",
    name: "Twitter/X",
    category: "Social",
    applied: 145,
    interviewed: 29,
    hired: 8,
    conversionRate: 5.5,
    costPerHire: 3500,
    roi: "Medium",
    trackingUrl: "https://x.com/company/jobs",
    monthlyCost: 3000,
    qualityScore: 68,
    avgTimeToHire: 35,
    monthlyTrend: [1, 2, 1, 2, 1, 1],
  },
];

const categoryColors: Record<string, string> = {
  "Job Board": "bg-blue-100 text-blue-700",
  Referral: "bg-emerald-100 text-emerald-700",
  Social: "bg-purple-100 text-purple-700",
  Agency: "bg-amber-100 text-amber-700",
  Direct: "bg-slate-100 text-slate-700",
};

const roiColors: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-red-100 text-red-700",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Job Board" as Source["category"],
    trackingUrl: "",
    monthlyCost: 0,
  });

  const topSource = [...sources].sort((a, b) => b.hired - a.hired)[0];
  const avgCostPerHire = Math.round(
    sources.reduce((sum, s) => sum + s.costPerHire, 0) / sources.length
  );
  const bestConversion = [...sources].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const maxHired = Math.max(...sources.map((s) => s.hired));

  const rankedSources = [...sources].sort((a, b) => b.hired - a.hired);

  const handleSave = () => {
    if (editingSource) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === editingSource.id
            ? { ...s, name: formData.name, category: formData.category, trackingUrl: formData.trackingUrl, monthlyCost: formData.monthlyCost }
            : s
        )
      );
    } else {
      const newSource: Source = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        trackingUrl: formData.trackingUrl,
        monthlyCost: formData.monthlyCost,
        applied: 0,
        interviewed: 0,
        hired: 0,
        conversionRate: 0,
        costPerHire: 0,
        roi: "Medium",
        qualityScore: 0,
        avgTimeToHire: 0,
        monthlyTrend: [0, 0, 0, 0, 0, 0],
      };
      setSources((prev) => [...prev, newSource]);
    }
    setShowDialog(false);
    setEditingSource(null);
    setFormData({ name: "", category: "Job Board", trackingUrl: "", monthlyCost: 0 });
  };

  const openAddDialog = () => {
    setEditingSource(null);
    setFormData({ name: "", category: "Job Board", trackingUrl: "", monthlyCost: 0 });
    setShowDialog(true);
  };

  const openEditDialog = (source: Source) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      category: source.category,
      trackingUrl: source.trackingUrl,
      monthlyCost: source.monthlyCost,
    });
    setShowDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate Sources</h1>
          <p className="text-sm text-slate-500 mt-1">Track and analyze recruiting source effectiveness</p>
        </div>
        <button
          onClick={openAddDialog}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add Source
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Sources</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{sources.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Top Performing Source</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{topSource.name}</p>
          <p className="text-xs text-slate-500 mt-1">{topSource.hired} hires</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Avg Cost per Hire</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">${avgCostPerHire.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Best Conversion Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{bestConversion.conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">{bestConversion.name}</p>
        </div>
      </div>

      {/* Top Sources Ranked */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Sources</h2>
        <div className="flex items-end justify-center gap-6">
          {rankedSources.slice(0, 3).map((source, i) => {
            const medals = ["bg-yellow-400", "bg-slate-300", "bg-amber-600"];
            const medalLabels = ["1st", "2nd", "3rd"];
            const heights = ["h-32", "h-24", "h-20"];
            return (
              <div key={source.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${medals[i]} flex items-center justify-center mb-2`}>
                  <span className="text-xs font-bold text-white">{medalLabels[i]}</span>
                </div>
                <div className={`w-24 ${heights[i]} bg-indigo-100 rounded-t-lg flex items-end justify-center pb-2`}>
                  <span className="text-lg font-bold text-indigo-700">{source.hired}</span>
                </div>
                <p className="text-xs text-slate-700 mt-2 text-center font-medium">{source.name}</p>
                <p className="text-xs text-slate-500">{source.conversionRate}% conv.</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Applied</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Interviewed</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Hired</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Conv. Rate</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Cost/Hire</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">ROI</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <>
                  <tr
                    key={source.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === source.id ? null : source.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{source.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[source.category]}`}>
                        {source.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{source.applied}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{source.interviewed}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{source.hired}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{source.conversionRate}%</td>
                    <td className="px-4 py-3 text-right text-slate-700">${source.costPerHire.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roiColors[source.roi]}`}>
                        {source.roi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(source);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                  {expandedId === source.id && (
                    <tr key={`${source.id}-detail`} className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Monthly Hires Trend</p>
                            <div className="flex items-end gap-1 h-12">
                              {source.monthlyTrend.map((val, i) => (
                                <div
                                  key={i}
                                  className="flex-1 bg-indigo-400 rounded-t"
                                  style={{ height: `${(val / Math.max(...source.monthlyTrend)) * 100}%` }}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Quality Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${source.qualityScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{source.qualityScore}/100</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Avg. Time to Hire</p>
                            <p className="text-lg font-semibold text-slate-900">{source.avgTimeToHire} days</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Source Comparison (Hires)</h2>
        <div className="space-y-3">
          {rankedSources.map((source) => (
            <div key={source.id} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-40 truncate">{source.name}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(source.hired / maxHired) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-10 text-right">{source.hired}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingSource ? "Edit Source" : "Add New Source"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., LinkedIn Recruiter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Source["category"] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Job Board">Job Board</option>
                  <option value="Referral">Referral</option>
                  <option value="Social">Social</option>
                  <option value="Agency">Agency</option>
                  <option value="Direct">Direct</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tracking URL</label>
                <input
                  type="url"
                  value={formData.trackingUrl}
                  onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Cost ($)</label>
                <input
                  type="number"
                  value={formData.monthlyCost}
                  onChange={(e) => setFormData({ ...formData, monthlyCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDialog(false); setEditingSource(null); }}
                className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {editingSource ? "Save Changes" : "Add Source"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
