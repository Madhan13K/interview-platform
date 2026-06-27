"use client";

import { useState, useCallback } from "react";

interface Widget {
  id: string;
  type: string;
  title: string;
  category: "metric" | "chart" | "list" | "calendar";
  colSpan: number;
}

const availableWidgets: Omit<Widget, "id">[] = [
  { type: "total-interviews", title: "Total Interviews", category: "metric", colSpan: 1 },
  { type: "active-candidates", title: "Active Candidates", category: "metric", colSpan: 1 },
  { type: "offer-rate", title: "Offer Rate", category: "metric", colSpan: 1 },
  { type: "avg-time-to-hire", title: "Avg Time to Hire", category: "metric", colSpan: 1 },
  { type: "pipeline-chart", title: "Pipeline Funnel", category: "chart", colSpan: 2 },
  { type: "hiring-velocity", title: "Hiring Velocity", category: "chart", colSpan: 2 },
  { type: "nps-trend", title: "NPS Trend", category: "chart", colSpan: 2 },
  { type: "source-breakdown", title: "Source Breakdown", category: "chart", colSpan: 1 },
  { type: "recent-activity", title: "Recent Activity", category: "list", colSpan: 2 },
  { type: "upcoming-interviews", title: "Upcoming Interviews", category: "list", colSpan: 2 },
  { type: "top-candidates", title: "Top Candidates", category: "list", colSpan: 1 },
  { type: "open-positions", title: "Open Positions", category: "list", colSpan: 1 },
  { type: "today-schedule", title: "Today's Schedule", category: "calendar", colSpan: 2 },
  { type: "week-calendar", title: "Week View", category: "calendar", colSpan: 2 },
];

const defaultWidgets: Widget[] = [
  { id: "1", type: "total-interviews", title: "Total Interviews", category: "metric", colSpan: 1 },
  { id: "2", type: "active-candidates", title: "Active Candidates", category: "metric", colSpan: 1 },
  { id: "3", type: "offer-rate", title: "Offer Rate", category: "metric", colSpan: 1 },
  { id: "4", type: "avg-time-to-hire", title: "Avg Time to Hire", category: "metric", colSpan: 1 },
  { id: "5", type: "pipeline-chart", title: "Pipeline Funnel", category: "chart", colSpan: 2 },
  { id: "6", type: "recent-activity", title: "Recent Activity", category: "list", colSpan: 2 },
  { id: "7", type: "today-schedule", title: "Today's Schedule", category: "calendar", colSpan: 2 },
];

const categoryIcons: Record<string, string> = {
  metric: "M",
  chart: "C",
  list: "L",
  calendar: "K",
};

const categoryColors: Record<string, string> = {
  metric: "bg-blue-100 text-blue-600",
  chart: "bg-purple-100 text-purple-600",
  list: "bg-green-100 text-green-600",
  calendar: "bg-orange-100 text-orange-600",
};

export default function DashboardCustomizePage() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [saved, setSaved] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const addWidget = (widget: Omit<Widget, "id">) => {
    const newWidget: Widget = { ...widget, id: Date.now().toString() };
    setWidgets((prev) => [...prev, newWidget]);
    setSaved(false);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSaved(false);
  };

  const moveWidget = useCallback((fromIdx: number, toIdx: number) => {
    setWidgets((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
    setSaved(false);
  }, []);

  const handleSave = () => {
    localStorage.setItem("dashboard-layout", JSON.stringify(widgets));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem("dashboard-layout");
    setSaved(false);
  };

  const filteredAvailable = availableWidgets.filter((aw) => {
    if (filterCategory !== "all" && aw.category !== filterCategory) return false;
    return !widgets.some((w) => w.type === aw.type);
  });

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customize Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Drag to reorder widgets and add new ones from the panel below.</p>
        </div>
        <div className="flex gap-2 items-center">
          {saved && (
            <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
              Layout saved!
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            Save Layout
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Your Widgets ({widgets.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {widgets.map((widget, idx) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedIdx !== null && draggedIdx !== idx) {
                  moveWidget(draggedIdx, idx);
                }
                setDraggedIdx(null);
              }}
              className={`bg-white rounded-xl border p-4 relative group hover:shadow-md transition cursor-grab active:cursor-grabbing ${
                widget.colSpan === 2 ? "col-span-2" : ""
              } ${draggedIdx === idx ? "opacity-50 border-indigo-400" : "border-gray-200"}`}
            >
              <button
                onClick={() => removeWidget(widget.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs hidden group-hover:flex items-center justify-center hover:bg-red-200 transition"
                aria-label="Remove widget"
              >
                &times;
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${categoryColors[widget.category]}`}>
                  {categoryIcons[widget.category]}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
                  <span className="text-xs text-gray-400 capitalize">{widget.category}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg h-20 flex items-center justify-center text-gray-300 text-xs border border-dashed border-gray-200">
                {widget.colSpan === 2 ? "Wide Widget Preview" : "Widget Preview"}
              </div>
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition">
                <span className="text-[10px] text-gray-400">Drag to reorder</span>
              </div>
            </div>
          ))}
        </div>
        {widgets.length === 0 && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed rounded-xl">
            <p className="text-lg mb-2">No widgets added</p>
            <p className="text-sm">Select widgets from the panel below to build your dashboard.</p>
          </div>
        )}
      </div>

      {/* Available Widgets Panel */}
      <div className="border-t pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Available Widgets</h2>
          <div className="flex gap-2">
            {["all", "metric", "chart", "list", "calendar"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterCategory === cat
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1) + "s"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAvailable.map((aw) => (
            <button
              key={aw.type}
              onClick={() => addWidget(aw)}
              className="text-left p-4 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${categoryColors[aw.category]}`}>
                  {categoryIcons[aw.category]}
                </div>
                <span className="font-medium text-sm text-gray-900">{aw.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 capitalize">{aw.category}</span>
                <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition">+ Add</span>
              </div>
            </button>
          ))}
          {filteredAvailable.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-400 py-8">
              All widgets in this category have been added.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
