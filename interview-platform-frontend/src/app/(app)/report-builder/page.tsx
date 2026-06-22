"use client";

import { useState } from "react";

type DataSource = "Interviews" | "Candidates" | "Jobs" | "Feedback";
type ChartType = "Table" | "Bar" | "Line" | "Pie";
type FilterOperator = "equals" | "contains" | "greater_than" | "less_than";

interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string;
}

interface SavedReport {
  id: string;
  name: string;
  dataSource: DataSource;
  columns: string[];
  filters: ReportFilter[];
  groupBy: string;
  sortBy: string;
  chartType: ChartType;
  createdAt: string;
  lastRun: string;
}

const columnOptions: Record<DataSource, string[]> = {
  Interviews: ["Candidate", "Position", "Date", "Duration", "Score", "Status", "Interviewer"],
  Candidates: ["Name", "Email", "Phone", "Skills", "Experience", "Location", "Applied Date"],
  Jobs: ["Title", "Department", "Location", "Status", "Applications", "Posted Date", "Salary Range"],
  Feedback: ["Interviewer", "Candidate", "Rating", "Recommendation", "Date", "Comments"],
};

const mockTableData: Record<DataSource, Record<string, string>[]> = {
  Interviews: [
    { Candidate: "Alice Johnson", Position: "Frontend Dev", Date: "2024-01-15", Duration: "45 min", Score: "8/10", Status: "Completed", Interviewer: "Bob Smith" },
    { Candidate: "Charlie Brown", Position: "Backend Dev", Date: "2024-01-16", Duration: "60 min", Score: "7/10", Status: "Completed", Interviewer: "Diana Lee" },
    { Candidate: "Eve Davis", Position: "Full Stack", Date: "2024-01-17", Duration: "50 min", Score: "9/10", Status: "Completed", Interviewer: "Frank Wilson" },
  ],
  Candidates: [
    { Name: "Alice Johnson", Email: "alice@email.com", Phone: "555-0101", Skills: "React, TypeScript", Experience: "5 years", Location: "NYC", "Applied Date": "2024-01-10" },
    { Name: "Charlie Brown", Email: "charlie@email.com", Phone: "555-0102", Skills: "Node.js, Python", Experience: "3 years", Location: "SF", "Applied Date": "2024-01-11" },
  ],
  Jobs: [
    { Title: "Frontend Developer", Department: "Engineering", Location: "Remote", Status: "Open", Applications: "24", "Posted Date": "2024-01-01", "Salary Range": "$120k-$150k" },
    { Title: "Product Manager", Department: "Product", Location: "NYC", Status: "Open", Applications: "18", "Posted Date": "2024-01-05", "Salary Range": "$130k-$160k" },
  ],
  Feedback: [
    { Interviewer: "Bob Smith", Candidate: "Alice Johnson", Rating: "4/5", Recommendation: "Hire", Date: "2024-01-15", Comments: "Strong technical skills" },
    { Interviewer: "Diana Lee", Candidate: "Charlie Brown", Rating: "3/5", Recommendation: "Maybe", Date: "2024-01-16", Comments: "Good culture fit" },
  ],
};

const initialSavedReports: SavedReport[] = [
  {
    id: "1",
    name: "Weekly Interview Summary",
    dataSource: "Interviews",
    columns: ["Candidate", "Position", "Date", "Score", "Status"],
    filters: [],
    groupBy: "Status",
    sortBy: "Date",
    chartType: "Table",
    createdAt: "2024-01-10",
    lastRun: "2024-01-17",
  },
  {
    id: "2",
    name: "Candidate Pipeline",
    dataSource: "Candidates",
    columns: ["Name", "Skills", "Experience", "Location"],
    filters: [],
    groupBy: "Location",
    sortBy: "Name",
    chartType: "Bar",
    createdAt: "2024-01-08",
    lastRun: "2024-01-16",
  },
];

export default function ReportBuilderPage() {
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");
  const [dataSource, setDataSource] = useState<DataSource>("Interviews");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [chartType, setChartType] = useState<ChartType>("Table");
  const [reportName, setReportName] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>(initialSavedReports);
  const [showPreview, setShowPreview] = useState(false);

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const addFilter = () => {
    setFilters([...filters, { field: columnOptions[dataSource][0], operator: "equals", value: "" }]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters(filters.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const saveReport = () => {
    if (!reportName.trim()) return;
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      dataSource,
      columns: selectedColumns,
      filters,
      groupBy,
      sortBy,
      chartType,
      createdAt: new Date().toISOString().split("T")[0],
      lastRun: "-",
    };
    setSavedReports([...savedReports, newReport]);
    setReportName("");
  };

  const deleteReport = (id: string) => {
    setSavedReports(savedReports.filter((r) => r.id !== id));
  };

  const runReport = (id: string) => {
    setSavedReports(
      savedReports.map((r) =>
        r.id === id ? { ...r, lastRun: new Date().toISOString().split("T")[0] } : r
      )
    );
  };

  const previewData = mockTableData[dataSource];
  const displayColumns = selectedColumns.length > 0 ? selectedColumns : columnOptions[dataSource];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Report Builder</h1>
          <p className="text-slate-500 mt-1">Create custom reports and visualizations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create Report
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "saved"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Saved Reports
          </button>
        </div>

        {activeTab === "create" ? (
          <div className="space-y-6">
            {/* Step 1: Data Source */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">1. Select Data Source</h2>
              <div className="grid grid-cols-4 gap-3">
                {(["Interviews", "Candidates", "Jobs", "Feedback"] as DataSource[]).map((source) => (
                  <button
                    key={source}
                    onClick={() => {
                      setDataSource(source);
                      setSelectedColumns([]);
                      setFilters([]);
                      setGroupBy("");
                      setSortBy("");
                    }}
                    className={`p-4 rounded-lg border-2 text-center font-medium transition-colors ${
                      dataSource === source
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Columns */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">2. Choose Columns</h2>
              <div className="grid grid-cols-4 gap-3">
                {columnOptions[dataSource].map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">3. Add Filters</h2>
                <button
                  onClick={addFilter}
                  className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium"
                >
                  + Add Filter
                </button>
              </div>
              {filters.length === 0 ? (
                <p className="text-slate-400 text-sm">No filters applied. Click &quot;Add Filter&quot; to narrow your results.</p>
              ) : (
                <div className="space-y-3">
                  {filters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(idx, { field: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                      >
                        {columnOptions[dataSource].map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterOperator })}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                        placeholder="Value..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                      <button
                        onClick={() => removeFilter(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Group By & Sort By */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">4. Group & Sort</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  >
                    <option value="">None</option>
                    {columnOptions[dataSource].map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  >
                    <option value="">None</option>
                    {columnOptions[dataSource].map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 5: Chart Type */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">5. Visualization</h2>
              <div className="flex gap-3">
                {(["Table", "Bar", "Line", "Pie"] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      chartType === type
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview & Save */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Preview & Save</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                  <button className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium">
                    CSV
                  </button>
                  <button className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium">
                    JSON
                  </button>
                  <button className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium">
                    PDF
                  </button>
                </div>
              </div>

              {showPreview && (
                <div className="mb-6 overflow-x-auto">
                  {chartType === "Table" ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {displayColumns.map((col) => (
                            <th key={col} className="text-left py-3 px-4 font-medium text-slate-600">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            {displayColumns.map((col) => (
                              <td key={col} className="py-3 px-4 text-slate-700">
                                {row[col] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {chartType === "Bar" && "|||"}
                          {chartType === "Line" && "~~~"}
                          {chartType === "Pie" && "O"}
                        </div>
                        <p className="text-slate-500 text-sm">{chartType} chart preview</p>
                        <p className="text-slate-400 text-xs mt-1">Data source: {dataSource} ({previewData.length} rows)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm"
                />
                <button
                  onClick={saveReport}
                  disabled={!reportName.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Report
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Saved Reports Tab */
          <div className="bg-white rounded-xl border border-slate-200">
            {savedReports.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 text-lg">No saved reports yet</p>
                <p className="text-slate-400 text-sm mt-1">Create a report and save it to see it here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-6 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-600">Data Source</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-600">Created</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-600">Last Run</th>
                    <th className="text-right py-3 px-6 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedReports.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 font-medium text-slate-900">{report.name}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                          {report.dataSource}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{report.createdAt}</td>
                      <td className="py-4 px-6 text-slate-500">{report.lastRun}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => runReport(report.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-100 mr-2"
                        >
                          Run
                        </button>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
