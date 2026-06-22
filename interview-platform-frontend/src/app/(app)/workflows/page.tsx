"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

// Types
interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: Condition[];
  action: string;
  enabled: boolean;
  createdAt: string;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  candidateName: string;
  interviewId: string;
  action: string;
  executedAt: string;
  status: "SUCCESS" | "FAILED";
}

// Constants
const TRIGGER_OPTIONS = [
  { value: "interview_completed", label: "Interview Completed" },
  { value: "score_submitted", label: "Score Submitted" },
  { value: "candidate_applied", label: "Candidate Applied" },
  { value: "stage_changed", label: "Stage Changed" },
  { value: "feedback_received", label: "Feedback Received" },
];

const CONDITION_FIELDS = [
  { value: "avg_score", label: "Average Score" },
  { value: "recommendation", label: "Recommendation" },
  { value: "stage", label: "Stage" },
  { value: "experience_years", label: "Experience (years)" },
  { value: "interview_count", label: "Interview Count" },
  { value: "feedback_sentiment", label: "Feedback Sentiment" },
];

const CONDITION_OPERATORS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "==", label: "==" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "contains", label: "contains" },
];

const ACTION_OPTIONS = [
  { value: "advance_stage", label: "Advance to next stage" },
  { value: "send_notification", label: "Send notification" },
  { value: "assign_interviewer", label: "Assign interviewer" },
  { value: "schedule_next_round", label: "Schedule next round" },
  { value: "reject_candidate", label: "Reject candidate" },
  { value: "create_offer", label: "Create offer" },
];

const TEMPLATE_RULES = [
  {
    id: "tpl-1",
    name: "Auto-advance on positive feedback",
    description: "Automatically advance candidates to the next stage when they receive positive feedback from all interviewers.",
    trigger: "feedback_received",
    conditions: [{ id: "c1", field: "avg_score", operator: ">=", value: "4" }],
    action: "advance_stage",
  },
  {
    id: "tpl-2",
    name: "Notify recruiter on completion",
    description: "Send a notification to the assigned recruiter when an interview is completed.",
    trigger: "interview_completed",
    conditions: [],
    action: "send_notification",
  },
  {
    id: "tpl-3",
    name: "Auto-reject on no-show",
    description: "Automatically reject candidates who do not show up for their scheduled interview.",
    trigger: "interview_completed",
    conditions: [{ id: "c2", field: "recommendation", operator: "==", value: "no_show" }],
    action: "reject_candidate",
  },
];

// Initial mock data
const INITIAL_RULES: WorkflowRule[] = [
  {
    id: "rule-1",
    name: "High Score Auto-Advance",
    description: "Advance candidates with score >= 4.5 to next stage",
    trigger: "score_submitted",
    conditions: [{ id: "c1", field: "avg_score", operator: ">=", value: "4.5" }],
    action: "advance_stage",
    enabled: true,
    createdAt: "2024-12-01",
  },
  {
    id: "rule-2",
    name: "Low Score Notification",
    description: "Notify recruiter when score is below 2",
    trigger: "score_submitted",
    conditions: [{ id: "c2", field: "avg_score", operator: "<", value: "2" }],
    action: "send_notification",
    enabled: true,
    createdAt: "2024-12-05",
  },
  {
    id: "rule-3",
    name: "Auto-Schedule Technical",
    description: "Schedule technical round after phone screen passes",
    trigger: "stage_changed",
    conditions: [{ id: "c3", field: "stage", operator: "==", value: "phone_screen_passed" }],
    action: "schedule_next_round",
    enabled: false,
    createdAt: "2024-12-10",
  },
];

const INITIAL_LOGS: ExecutionLog[] = [
  {
    id: "log-1",
    ruleId: "rule-1",
    ruleName: "High Score Auto-Advance",
    candidateName: "Alice Johnson",
    interviewId: "INT-1042",
    action: "Advance to next stage",
    executedAt: "2024-12-15 14:30",
    status: "SUCCESS",
  },
  {
    id: "log-2",
    ruleId: "rule-2",
    ruleName: "Low Score Notification",
    candidateName: "Bob Smith",
    interviewId: "INT-1039",
    action: "Send notification",
    executedAt: "2024-12-15 11:15",
    status: "SUCCESS",
  },
  {
    id: "log-3",
    ruleId: "rule-1",
    ruleName: "High Score Auto-Advance",
    candidateName: "Carol Davis",
    interviewId: "INT-1045",
    action: "Advance to next stage",
    executedAt: "2024-12-14 16:45",
    status: "FAILED",
  },
  {
    id: "log-4",
    ruleId: "rule-3",
    ruleName: "Auto-Schedule Technical",
    candidateName: "David Lee",
    interviewId: "INT-1037",
    action: "Schedule next round",
    executedAt: "2024-12-14 09:00",
    status: "SUCCESS",
  },
];

export default function WorkflowsPage() {
  const [rules, setRules] = useState<WorkflowRule[]>(INITIAL_RULES);
  const [logs] = useState<ExecutionLog[]>(INITIAL_LOGS);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formConditions, setFormConditions] = useState<Condition[]>([
    { id: "new-1", field: "", operator: "", value: "" },
  ]);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormTrigger("");
    setFormAction("");
    setFormConditions([{ id: "new-1", field: "", operator: "", value: "" }]);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddCondition = () => {
    setFormConditions((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, field: "", operator: "", value: "" },
    ]);
  };

  const handleRemoveCondition = (condId: string) => {
    setFormConditions((prev) => prev.filter((c) => c.id !== condId));
  };

  const handleConditionChange = (
    condId: string,
    key: keyof Condition,
    value: string
  ) => {
    setFormConditions((prev) =>
      prev.map((c) => (c.id === condId ? { ...c, [key]: value } : c))
    );
  };

  const handleCreateRule = () => {
    if (!formName || !formTrigger || !formAction) return;
    const newRule: WorkflowRule = {
      id: `rule-${Date.now()}`,
      name: formName,
      description: formDescription,
      trigger: formTrigger,
      conditions: formConditions.filter((c) => c.field && c.operator && c.value),
      action: formAction,
      enabled: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRules((prev) => [newRule, ...prev]);
    resetForm();
    setCreateDialogOpen(false);
  };

  const handleUseTemplate = (template: (typeof TEMPLATE_RULES)[0]) => {
    setFormName(template.name);
    setFormDescription(template.description);
    setFormTrigger(template.trigger);
    setFormAction(template.action);
    setFormConditions(
      template.conditions.length > 0
        ? template.conditions
        : [{ id: "new-1", field: "", operator: "", value: "" }]
    );
    setCreateDialogOpen(true);
  };

  const getTriggerLabel = (value: string) =>
    TRIGGER_OPTIONS.find((t) => t.value === value)?.label ?? value;

  const getActionLabel = (value: string) =>
    ACTION_OPTIONS.find((a) => a.value === value)?.label ?? value;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Automation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure rules to automate your interview pipeline
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>Create Rule</Button>
      </div>

      {/* Active Rules */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Rules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.enabled ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-3">{rule.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{getTriggerLabel(rule.trigger)}</Badge>
                  </div>
                  {rule.conditions.length > 0 && (
                    <div className="text-xs text-slate-600">
                      {rule.conditions.map((c) => (
                        <span
                          key={c.id}
                          className="inline-block mr-2 px-2 py-0.5 bg-slate-100 rounded"
                        >
                          {c.field} {c.operator} {c.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{getActionLabel(rule.action)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Template Rules */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Template Rules</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATE_RULES.map((tpl) => (
            <Card key={tpl.id} className="border-dashed border-slate-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tpl.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">{tpl.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseTemplate(tpl)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Execution Log */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Execution Log</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Interview</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.ruleName}</TableCell>
                    <TableCell>{log.candidateName}</TableCell>
                    <TableCell className="text-slate-500">{log.interviewId}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-slate-500">{log.executedAt}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "SUCCESS" ? "success" : "destructive"}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Create Rule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Workflow Rule</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Name & Description */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Auto-advance on high score"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rule-desc">Description</Label>
                <Textarea
                  id="rule-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe what this rule does..."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Trigger */}
            <div>
              <Label>Trigger Event</Label>
              <Select
                value={formTrigger}
                onValueChange={setFormTrigger}
                options={TRIGGER_OPTIONS}
                placeholder="Select trigger..."
                className="mt-1"
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Conditions</Label>
                <Button variant="ghost" size="sm" onClick={handleAddCondition}>
                  + Add Condition
                </Button>
              </div>
              <div className="space-y-2">
                {formConditions.map((cond) => (
                  <div key={cond.id} className="flex items-center gap-2">
                    <Select
                      value={cond.field}
                      onValueChange={(v) => handleConditionChange(cond.id, "field", v)}
                      options={CONDITION_FIELDS}
                      placeholder="Field"
                      className="flex-1"
                    />
                    <Select
                      value={cond.operator}
                      onValueChange={(v) => handleConditionChange(cond.id, "operator", v)}
                      options={CONDITION_OPERATORS}
                      placeholder="Op"
                      className="w-24"
                    />
                    <Input
                      value={cond.value}
                      onChange={(e) =>
                        handleConditionChange(cond.id, "value", e.target.value)
                      }
                      placeholder="Value"
                      className="flex-1"
                    />
                    {formConditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCondition(cond.id)}
                        className="shrink-0 text-slate-400 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div>
              <Label>Action</Label>
              <Select
                value={formAction}
                onValueChange={setFormAction}
                options={ACTION_OPTIONS}
                placeholder="Select action..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={!formName || !formTrigger || !formAction}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
