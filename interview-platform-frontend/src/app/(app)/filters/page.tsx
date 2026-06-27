"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterCondition[];
  createdAt: string;
  isDefault: boolean;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in" | "not_in";
  value: string | string[] | number | [number, number];
}

const AVAILABLE_FIELDS = [
  { value: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Hired", "Rejected", "Withdrawn"] },
  { value: "department", label: "Department", type: "select", options: ["Engineering", "Design", "Product", "Marketing", "Sales", "HR"] },
  { value: "experience", label: "Experience (years)", type: "number" },
  { value: "location", label: "Location", type: "text" },
  { value: "salary_range", label: "Salary Range", type: "number" },
  { value: "applied_date", label: "Applied Date", type: "date" },
  { value: "skills", label: "Skills", type: "multi-select", options: ["React", "TypeScript", "Python", "Java", "Go", "Rust", "AWS", "Docker", "Kubernetes"] },
  { value: "source", label: "Source", type: "select", options: ["LinkedIn", "Referral", "Job Board", "Direct", "Agency"] },
  { value: "pipeline_stage", label: "Pipeline Stage", type: "select", options: ["Applied", "Screening", "Phone Screen", "Technical", "Onsite", "Offer"] },
  { value: "rating", label: "Average Rating", type: "number" },
];

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "between", label: "between" },
  { value: "in", label: "is one of" },
  { value: "not_in", label: "is not one of" },
];

export default function FiltersPage() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedMultiValues, setSelectedMultiValues] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved presets
    const mockPresets: FilterPreset[] = [
      {
        id: "p1",
        name: "Active Engineers",
        filters: [
          { id: "f1", field: "status", operator: "equals", value: "Active" },
          { id: "f2", field: "department", operator: "equals", value: "Engineering" },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        isDefault: true,
      },
      {
        id: "p2",
        name: "Senior Candidates (5+ years)",
        filters: [
          { id: "f3", field: "experience", operator: "gt", value: 5 },
          { id: "f4", field: "status", operator: "in", value: ["Active", "Hired"] },
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        isDefault: false,
      },
      {
        id: "p3",
        name: "Recent Applicants",
        filters: [
          { id: "f5", field: "applied_date", operator: "gt", value: new Date(Date.now() - 604800000).toISOString().split("T")[0] },
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        isDefault: false,
      },
    ];
    setPresets(mockPresets);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Simulate result count when filters change
    if (activeFilters.length > 0) {
      setResultCount(Math.floor(Math.random() * 200) + 10);
    } else {
      setResultCount(null);
    }
  }, [activeFilters]);

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      field: "status",
      operator: "equals",
      value: "",
    };
    setActiveFilters((prev) => [...prev, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setActiveFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (id: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const applyPreset = (preset: FilterPreset) => {
    setActiveFilters(preset.filters);
  };

  const savePreset = () => {
    if (!presetName.trim() || activeFilters.length === 0) return;
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name: presetName.trim(),
      filters: [...activeFilters],
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    setPresets((prev) => [...prev, newPreset]);
    setPresetName("");
    setShowSaveDialog(false);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSelectedMultiValues({});
  };

  const toggleMultiValue = (filterId: string, value: string) => {
    setSelectedMultiValues((prev) => {
      const current = prev[filterId] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterId]: next };
    });
    // Also update the filter value
    updateFilter(filterId, { value: selectedMultiValues[filterId] || [] });
  };

  const getFieldConfig = (fieldName: string) => {
    return AVAILABLE_FIELDS.find((f) => f.value === fieldName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advanced Filtering</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build complex filters with multiple conditions and save presets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
              <Button size="sm" onClick={() => setShowSaveDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Preset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Saved Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <button onClick={() => applyPreset(preset)} className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                  {preset.name}
                </button>
                <Badge variant="secondary" className="text-xs">{preset.filters.length}</Badge>
                {preset.isDefault && <Badge className="text-xs bg-indigo-100 text-indigo-700">Default</Badge>}
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="text-sm text-slate-400">No saved presets yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Filter Conditions</CardTitle>
            {resultCount !== null && (
              <Badge className="bg-green-100 text-green-700">{resultCount} results</Badge>
            )}
          </div>
          <Button size="sm" onClick={addFilter} variant="outline">
            + Add Condition
          </Button>
        </CardHeader>
        <CardContent>
          {activeFilters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No filters applied</p>
              <p className="text-xs text-slate-300 mt-1">Click &quot;Add Condition&quot; to start filtering</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeFilters.map((filter, index) => {
                const fieldConfig = getFieldConfig(filter.field);
                return (
                  <div key={filter.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    {index > 0 && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded self-center">
                        AND
                      </span>
                    )}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {/* Field */}
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(filter.id, { field: e.target.value, value: "" })}
                        className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white"
                      >
                        {AVAILABLE_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterCondition["operator"] })}
                        className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {/* Value */}
                      {fieldConfig?.type === "select" ? (
                        <select
                          value={filter.value as string}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white"
                        >
                          <option value="">Select...</option>
                          {fieldConfig.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fieldConfig?.type === "multi-select" ? (
                        <div className="flex flex-wrap gap-1 p-2 rounded-md border border-slate-200 bg-white min-h-[40px]">
                          {fieldConfig.options?.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => toggleMultiValue(filter.id, opt)}
                              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                (selectedMultiValues[filter.id] || []).includes(opt)
                                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-indigo-200"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : fieldConfig?.type === "date" ? (
                        <input
                          type="date"
                          value={filter.value as string}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white"
                        />
                      ) : (
                        <Input
                          type={fieldConfig?.type === "number" ? "number" : "text"}
                          value={filter.value as string}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Enter value..."
                          className="text-sm"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-slate-400 hover:text-red-500 self-center"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Range Quick Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range Quick Picker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            {["Today", "Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"].map((label) => (
              <button
                key={label}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Filter Preset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preset Name</Label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Senior Engineers in NYC"
                />
              </div>
              <p className="text-sm text-slate-500">
                This will save {activeFilters.length} filter condition{activeFilters.length !== 1 ? "s" : ""}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                <Button onClick={savePreset} disabled={!presetName.trim()}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
