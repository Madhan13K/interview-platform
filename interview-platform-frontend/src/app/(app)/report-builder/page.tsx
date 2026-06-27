"use client";

import { useState, useEffect } from "react";
import {
  reportBuilderService,
  ReportTemplate,
  ReportWidget,
  GeneratedReport,
} from "@/services/report-builder.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WidgetType = ReportWidget["type"];

const WIDGET_PALETTE: { type: WidgetType; label: string; icon: string; description: string }[] = [
  { type: "BAR_CHART", label: "Bar Chart", icon: "📊", description: "Compare values across categories" },
  { type: "LINE_CHART", label: "Line Chart", icon: "📈", description: "Show trends over time" },
  { type: "PIE_CHART", label: "Pie Chart", icon: "🥧", description: "Show proportions of a whole" },
  { type: "TABLE", label: "Table", icon: "📋", description: "Display detailed tabular data" },
  { type: "METRIC_CARD", label: "Metric Card", icon: "🔢", description: "Highlight a single KPI" },
  { type: "FUNNEL", label: "Funnel", icon: "🔻", description: "Visualize conversion stages" },
  { type: "HEATMAP", label: "Heatmap", icon: "🗺️", description: "Show density patterns" },
];

type ViewMode = "grid" | "list";
type Tab = "templates" | "generated" | "create";

export default function ReportBuilderPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("templates");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLayout, setFormLayout] = useState<"grid" | "list">("grid");
  const [formWidgets, setFormWidgets] = useState<Partial<ReportWidget>[]>([]);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes] = await Promise.all([
        reportBuilderService.list(),
      ]);
      setTemplates(templatesRes.data || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = (type: WidgetType) => {
    const widget: Partial<ReportWidget> = {
      id: `widget_${Date.now()}`,
      type,
      title: `${WIDGET_PALETTE.find((w) => w.type === type)?.label || type} Widget`,
      dataSource: "",
      position: { x: 0, y: formWidgets.length * 4, w: 6, h: 4 },
      config: {},
    };
    setFormWidgets((prev) => [...prev, widget]);
  };

  const handleRemoveWidget = (id: string) => {
    setFormWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleCreateTemplate = async () => {
    if (!formName.trim() || formWidgets.length === 0) return;
    try {
      setCreating(true);
      const res = await reportBuilderService.create({
        name: formName.trim(),
        description: formDescription.trim(),
        layout: formLayout,
        widgets: formWidgets as ReportWidget[],
        filters: [],
      });
      setTemplates((prev) => [...prev, res.data]);
      setFormName("");
      setFormDescription("");
      setFormWidgets([]);
      setTab("templates");
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async (templateId: string) => {
    try {
      setGenerating(templateId);
      const res = await reportBuilderService.generate(templateId);
      setGeneratedReports((prev) => [res.data, ...prev]);
      setTab("generated");
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reportBuilderService.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading report builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Builder</h1>
          <p className="text-sm text-slate-500 mt-1">
            Design custom reports with drag-and-drop widgets
          </p>
        </div>
        <Button
          onClick={() => setTab("create")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          + New Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["templates", "generated", "create"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t === "create" ? "Create New" : t}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {tab === "templates" && (
        <div>
          {/* View Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/></svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
            </button>
            <span className="text-sm text-slate-400 ml-2">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </span>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:border-indigo-200 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="secondary">{template.layout}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.widgets.map((w) => (
                        <span
                          key={w.id}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {WIDGET_PALETTE.find((wp) => wp.type === w.type)?.icon} {w.title}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(template.id)}
                        disabled={generating === template.id}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {generating === template.id ? "Generating..." : "Generate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {templates.length === 0 && (
                <p className="col-span-full text-center text-slate-500 py-12">
                  No templates yet. Create your first report template.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <Card key={template.id} className="hover:border-indigo-200 transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-500">
                          {template.widgets.length} widgets | {template.layout} layout
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(template.id)}
                        disabled={generating === template.id}
                      >
                        {generating === template.id ? "..." : "Generate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Reports Tab */}
      {tab === "generated" && (
        <div className="space-y-3">
          {generatedReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-sm text-slate-500">
                    {report.format} | {report.rowCount} rows |{" "}
                    {(report.fileSizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Badge
                  className={
                    report.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : report.status === "GENERATING"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {report.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {generatedReports.length === 0 && (
            <p className="text-center text-slate-500 py-12">
              No generated reports yet. Generate one from a template.
            </p>
          )}
        </div>
      )}

      {/* Create Template Tab */}
      {tab === "create" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Widget Palette */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Widget Palette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {WIDGET_PALETTE.map((widget) => (
                  <button
                    key={widget.type}
                    onClick={() => handleAddWidget(widget.type)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <span className="text-2xl">{widget.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{widget.label}</p>
                      <p className="text-xs text-slate-500">{widget.description}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Monthly Hiring Report"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe what this report shows"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormLayout("grid")}
                      className={`px-4 py-2 rounded border text-sm ${
                        formLayout === "grid"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setFormLayout("list")}
                      className={`px-4 py-2 rounded border text-sm ${
                        formLayout === "list"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Added Widgets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Widgets ({formWidgets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formWidgets.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    Click widgets from the palette to add them
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {WIDGET_PALETTE.find((w) => w.type === widget.type)?.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{widget.title}</p>
                            <p className="text-xs text-slate-500">{widget.type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveWidget(widget.id!)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleCreateTemplate}
              disabled={creating || !formName.trim() || formWidgets.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {creating ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
