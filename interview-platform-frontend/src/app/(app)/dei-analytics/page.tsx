"use client";

import { useState } from "react";

const funnelStages = [
  { stage: "Applied", total: 2450, groups: { "Group A": 980, "Group B": 735, "Group C": 490, "Group D": 245 } },
  { stage: "Screened", total: 1680, groups: { "Group A": 672, "Group B": 504, "Group C": 336, "Group D": 168 } },
  { stage: "Interviewed", total: 840, groups: { "Group A": 336, "Group B": 252, "Group C": 168, "Group D": 84 } },
  { stage: "Offered", total: 210, groups: { "Group A": 84, "Group B": 63, "Group C": 42, "Group D": 21 } },
  { stage: "Hired", total: 156, groups: { "Group A": 62, "Group B": 47, "Group C": 31, "Group D": 16 } },
];

const genderData = [
  { label: "Male", percentage: 48, color: "bg-indigo-500" },
  { label: "Female", percentage: 38, color: "bg-purple-500" },
  { label: "Non-binary", percentage: 9, color: "bg-teal-500" },
  { label: "Prefer not to say", percentage: 5, color: "bg-slate-400" },
];

const ethnicityData = [
  { label: "White", percentage: 42, color: "bg-indigo-500" },
  { label: "Asian", percentage: 24, color: "bg-blue-500" },
  { label: "Hispanic/Latino", percentage: 16, color: "bg-emerald-500" },
  { label: "Black/African American", percentage: 12, color: "bg-amber-500" },
  { label: "Other/Multiple", percentage: 6, color: "bg-rose-500" },
];

const monthlyTrend = [
  { month: "Jan", diversity: 58 },
  { month: "Feb", diversity: 60 },
  { month: "Mar", diversity: 62 },
  { month: "Apr", diversity: 59 },
  { month: "May", diversity: 64 },
  { month: "Jun", diversity: 67 },
  { month: "Jul", diversity: 65 },
  { month: "Aug", diversity: 68 },
  { month: "Sep", diversity: 70 },
  { month: "Oct", diversity: 72 },
  { month: "Nov", diversity: 71 },
  { month: "Dec", diversity: 74 },
];

const recommendations = [
  {
    title: "Expand Sourcing Channels",
    description: "Partner with diversity-focused job boards and organizations to broaden your candidate pipeline.",
  },
  {
    title: "Structured Interviews",
    description: "Implement standardized interview rubrics to reduce unconscious bias in the evaluation process.",
  },
  {
    title: "Blind Resume Screening",
    description: "Remove identifying information from resumes during initial screening to focus on qualifications.",
  },
  {
    title: "Diverse Interview Panels",
    description: "Ensure interview panels include members from different backgrounds and departments.",
  },
];

const groupColors: Record<string, string> = {
  "Group A": "bg-indigo-500",
  "Group B": "bg-emerald-500",
  "Group C": "bg-amber-500",
  "Group D": "bg-rose-500",
};

export default function DEIAnalyticsPage() {
  const [dateRange, setDateRange] = useState("last-12-months");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DEI Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Diversity, Equity & Inclusion metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="last-12-months">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Export PDF/CSV
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-blue-800">
          All demographic data is self-reported and opt-in. Data is anonymized for reporting.
          Individual responses are never shared or used in hiring decisions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Applicants</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">2,450</p>
          <p className="text-xs text-emerald-600 mt-1">+12% from last period</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Diversity Index</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">74%</p>
          <p className="text-xs text-emerald-600 mt-1">+3% from last period</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Gender Balance</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">48/52</p>
          <p className="text-xs text-slate-500 mt-1">Male / Non-male ratio</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Ethnicity Representation</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">5 groups</p>
          <p className="text-xs text-emerald-600 mt-1">Well distributed</p>
        </div>
      </div>

      {/* Funnel Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Funnel Analysis</h2>
        <p className="text-sm text-slate-500 mb-4">Conversion at each stage by demographic group</p>
        <div className="flex items-center gap-4 mb-4">
          {Object.entries(groupColors).map(([group, color]) => (
            <div key={group} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="text-xs text-slate-600">{group}</span>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {funnelStages.map((item) => (
            <div key={item.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{item.stage}</span>
                <span className="text-sm text-slate-500">{item.total} candidates</span>
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
                {Object.entries(item.groups).map(([group, count]) => (
                  <div
                    key={group}
                    className={`${groupColors[group]} transition-all`}
                    style={{ width: `${(count / funnelStages[0].total) * 100}%` }}
                    title={`${group}: ${count}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gender Distribution & Ethnicity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Gender Distribution</h2>
          <div className="space-y-3">
            {genderData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.percentage}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ethnicity Breakdown</h2>
          <div className="space-y-3">
            {ethnicityData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.percentage}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Over Time */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Trend Over Time</h2>
        <p className="text-sm text-slate-500 mb-4">Monthly diversity index (%)</p>
        <div className="flex items-end gap-2 h-40">
          {monthlyTrend.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs text-slate-600 mb-1">{item.diversity}%</span>
              <div
                className="w-full bg-indigo-500 rounded-t transition-all"
                style={{ height: `${(item.diversity / 100) * 100}%` }}
              />
              <span className="text-xs text-slate-500 mt-1">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">AI-Generated Recommendations</h2>
        <p className="text-sm text-slate-500 mb-4">Suggestions to improve diversity and inclusion</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{rec.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
