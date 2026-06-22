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

// Types
interface ApprovalChainStep {
  id: string;
  approverName: string;
  approverEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  decidedAt?: string;
  comment?: string;
}

interface ApprovalRequest {
  id: string;
  type: "Offer" | "Requisition" | "Job Posting";
  title: string;
  requester: string;
  requesterEmail: string;
  summary: string;
  details: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedDate: string;
  resolvedDate?: string;
  attachedDocuments: string[];
  approvalChain: ApprovalChainStep[];
}

// Constants
const APPROVAL_TYPES = [
  { value: "Offer", label: "Offer" },
  { value: "Requisition", label: "Requisition" },
  { value: "Job Posting", label: "Job Posting" },
];

const URGENCY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const AVAILABLE_APPROVERS = [
  { id: "a1", name: "Sarah Director", email: "sarah.director@company.com" },
  { id: "a2", name: "Mike VP", email: "mike.vp@company.com" },
  { id: "a3", name: "Jane HR Lead", email: "jane.hrlead@company.com" },
  { id: "a4", name: "Tom Finance", email: "tom.finance@company.com" },
];

// Mock data
const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: "apr-1",
    type: "Offer",
    title: "Senior Engineer Offer - Alice Johnson",
    requester: "John Recruiter",
    requesterEmail: "john@company.com",
    summary: "Offer package for Senior Software Engineer position at $185K base + equity",
    details: "Candidate Alice Johnson has successfully completed all interview rounds with an average score of 4.7/5. Proposed compensation: $185,000 base salary, $50,000 RSU over 4 years, $20,000 signing bonus. Start date: January 15, 2025.",
    urgency: "HIGH",
    status: "PENDING",
    requestedDate: "2024-12-14",
    attachedDocuments: ["offer_letter_draft.pdf", "compensation_analysis.xlsx"],
    approvalChain: [
      { id: "s1", approverName: "Jane HR Lead", approverEmail: "jane.hrlead@company.com", status: "APPROVED", decidedAt: "2024-12-14 10:30", comment: "Compensation is within band. Approved." },
      { id: "s2", approverName: "Sarah Director", approverEmail: "sarah.director@company.com", status: "PENDING" },
      { id: "s3", approverName: "Tom Finance", approverEmail: "tom.finance@company.com", status: "PENDING" },
    ],
  },
  {
    id: "apr-2",
    type: "Requisition",
    title: "New Headcount - Frontend Team",
    requester: "Emily Manager",
    requesterEmail: "emily@company.com",
    summary: "Request for 2 additional frontend engineers for Q1 2025",
    details: "The frontend team needs 2 additional engineers to support the new product launch scheduled for Q2 2025. Current team capacity is at 120% utilization.",
    urgency: "MEDIUM",
    status: "PENDING",
    requestedDate: "2024-12-13",
    attachedDocuments: ["headcount_justification.pdf"],
    approvalChain: [
      { id: "s4", approverName: "Sarah Director", approverEmail: "sarah.director@company.com", status: "PENDING" },
      { id: "s5", approverName: "Mike VP", approverEmail: "mike.vp@company.com", status: "PENDING" },
    ],
  },
  {
    id: "apr-3",
    type: "Job Posting",
    title: "Data Scientist - ML Team",
    requester: "David Lead",
    requesterEmail: "david@company.com",
    summary: "New job posting for Data Scientist role in Machine Learning team",
    details: "Posting for a mid-level Data Scientist to join the ML team. Requirements include 3+ years experience with Python, TensorFlow, and production ML systems.",
    urgency: "LOW",
    status: "PENDING",
    requestedDate: "2024-12-12",
    attachedDocuments: ["job_description.docx"],
    approvalChain: [
      { id: "s6", approverName: "Jane HR Lead", approverEmail: "jane.hrlead@company.com", status: "PENDING" },
    ],
  },
  {
    id: "apr-4",
    type: "Offer",
    title: "Product Manager Offer - Carlos Rivera",
    requester: "John Recruiter",
    requesterEmail: "john@company.com",
    summary: "Offer for Product Manager position at $160K base",
    details: "Standard offer for PM role. Candidate accepted verbal offer pending formal approval.",
    urgency: "CRITICAL",
    status: "APPROVED",
    requestedDate: "2024-12-10",
    resolvedDate: "2024-12-11",
    attachedDocuments: ["offer_letter.pdf"],
    approvalChain: [
      { id: "s7", approverName: "Jane HR Lead", approverEmail: "jane.hrlead@company.com", status: "APPROVED", decidedAt: "2024-12-10 14:00", comment: "Approved" },
      { id: "s8", approverName: "Sarah Director", approverEmail: "sarah.director@company.com", status: "APPROVED", decidedAt: "2024-12-11 09:30", comment: "Approved. Good hire." },
    ],
  },
  {
    id: "apr-5",
    type: "Requisition",
    title: "Contractor Budget - QA Team",
    requester: "Lisa QA Lead",
    requesterEmail: "lisa@company.com",
    summary: "Request for contractor budget to support release testing",
    details: "Need 3 QA contractors for 3 months to support major release.",
    urgency: "MEDIUM",
    status: "REJECTED",
    requestedDate: "2024-12-08",
    resolvedDate: "2024-12-09",
    attachedDocuments: ["budget_request.pdf"],
    approvalChain: [
      { id: "s9", approverName: "Tom Finance", approverEmail: "tom.finance@company.com", status: "REJECTED", decidedAt: "2024-12-09 11:00", comment: "Budget not available in Q4. Resubmit for Q1." },
    ],
  },
];

type TabType = "pending" | "my_requests" | "all";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  // Create form state
  const [formType, setFormType] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formUrgency, setFormUrgency] = useState("MEDIUM");
  const [formApprovers, setFormApprovers] = useState<string[]>([]);
  const [formDocument, setFormDocument] = useState("");

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const myRequests = approvals.filter((a) => a.requester === "John Recruiter");
  const completedApprovals = approvals.filter((a) => a.status !== "PENDING");

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleApprove = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? { ...a, status: "APPROVED" as const, resolvedDate: new Date().toISOString().split("T")[0] }
          : a
      )
    );
    setDetailModalOpen(false);
    setApprovalComment("");
  };

  const handleReject = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? { ...a, status: "REJECTED" as const, resolvedDate: new Date().toISOString().split("T")[0] }
          : a
      )
    );
    setDetailModalOpen(false);
    setApprovalComment("");
  };

  const handleCreateRequest = () => {
    if (!formType || !formTitle || !formSummary) return;
    const newApproval: ApprovalRequest = {
      id: `apr-${Date.now()}`,
      type: formType as ApprovalRequest["type"],
      title: formTitle,
      requester: "John Recruiter",
      requesterEmail: "john@company.com",
      summary: formSummary,
      details: formDetails,
      urgency: formUrgency as ApprovalRequest["urgency"],
      status: "PENDING",
      requestedDate: new Date().toISOString().split("T")[0],
      attachedDocuments: formDocument ? [formDocument] : [],
      approvalChain: formApprovers.map((approverId) => {
        const approver = AVAILABLE_APPROVERS.find((a) => a.id === approverId);
        return {
          id: `s-${Date.now()}-${approverId}`,
          approverName: approver?.name ?? "Unknown",
          approverEmail: approver?.email ?? "",
          status: "PENDING" as const,
        };
      }),
    };
    setApprovals((prev) => [newApproval, ...prev]);
    resetCreateForm();
    setCreateDialogOpen(false);
  };

  const resetCreateForm = () => {
    setFormType("");
    setFormTitle("");
    setFormSummary("");
    setFormDetails("");
    setFormUrgency("MEDIUM");
    setFormApprovers([]);
    setFormDocument("");
  };

  const toggleApprover = (approverId: string) => {
    setFormApprovers((prev) =>
      prev.includes(approverId)
        ? prev.filter((id) => id !== approverId)
        : [...prev, approverId]
    );
  };

  const getFilteredApprovals = () => {
    switch (activeTab) {
      case "pending":
        return pendingApprovals;
      case "my_requests":
        return myRequests;
      case "all":
        return approvals;
      default:
        return approvals;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Approval Center</h1>
          {pendingApprovals.length > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>New Request</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { key: "pending" as TabType, label: "Pending My Approval", count: pendingApprovals.length },
          { key: "my_requests" as TabType, label: "My Requests", count: myRequests.length },
          { key: "all" as TabType, label: "All (Admin)", count: approvals.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-4">
        {getFilteredApprovals().map((approval) => (
          <Card key={approval.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{approval.type}</Badge>
                    <Badge variant={getUrgencyBadgeVariant(approval.urgency) as "destructive" | "warning" | "info" | "secondary"}>
                      {approval.urgency}
                    </Badge>
                    {approval.status !== "PENDING" && (
                      <Badge variant={getStatusBadgeVariant(approval.status) as "success" | "destructive"}>
                        {approval.status}
                      </Badge>
                    )}
                  </div>
                  <h3
                    className="text-base font-semibold text-slate-900 cursor-pointer hover:text-indigo-600"
                    onClick={() => {
                      setSelectedApproval(approval);
                      setDetailModalOpen(true);
                    }}
                  >
                    {approval.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{approval.summary}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>By {approval.requester}</span>
                    <span>Requested {approval.requestedDate}</span>
                    {approval.attachedDocuments.length > 0 && (
                      <span>{approval.attachedDocuments.length} document(s)</span>
                    )}
                  </div>
                </div>
                {approval.status === "PENDING" && (
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="success" onClick={() => handleApprove(approval.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(approval.id)}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {getFilteredApprovals().length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No approvals in this view
          </div>
        )}
      </div>

      {/* History Section */}
      {activeTab === "all" && completedApprovals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Completed</h2>
          <div className="space-y-3">
            {completedApprovals.map((approval) => (
              <Card key={approval.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{approval.title}</span>
                        <Badge variant={getStatusBadgeVariant(approval.status) as "success" | "destructive"}>
                          {approval.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Resolved {approval.resolvedDate}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Approval Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApproval && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedApproval.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Summary */}
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">{selectedApproval.type}</Badge>
                    <Badge variant={getUrgencyBadgeVariant(selectedApproval.urgency) as "destructive" | "warning" | "info" | "secondary"}>
                      {selectedApproval.urgency}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{selectedApproval.details}</p>
                </div>

                {/* Requester Info */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Requested by</p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedApproval.requester} ({selectedApproval.requesterEmail})
                  </p>
                  <p className="text-xs text-slate-400 mt-1">on {selectedApproval.requestedDate}</p>
                </div>

                {/* Attached Documents */}
                {selectedApproval.attachedDocuments.length > 0 && (
                  <div>
                    <Label className="text-slate-700">Attached Documents</Label>
                    <div className="mt-2 space-y-1">
                      {selectedApproval.attachedDocuments.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-indigo-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Chain */}
                <div>
                  <Label className="text-slate-700">Approval Chain</Label>
                  <div className="mt-2 space-y-2">
                    {selectedApproval.approvalChain.map((step, i) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          step.status === "APPROVED"
                            ? "border-emerald-200 bg-emerald-50"
                            : step.status === "REJECTED"
                            ? "border-red-200 bg-red-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{step.approverName}</p>
                          {step.comment && (
                            <p className="text-xs text-slate-500 mt-0.5">&ldquo;{step.comment}&rdquo;</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              step.status === "APPROVED"
                                ? "success"
                                : step.status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {step.status}
                          </Badge>
                          {step.decidedAt && (
                            <p className="text-xs text-slate-400 mt-1">{step.decidedAt}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment field */}
                {selectedApproval.status === "PENDING" && (
                  <div>
                    <Label htmlFor="approval-comment">Comment</Label>
                    <Textarea
                      id="approval-comment"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Add a comment (optional)..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {selectedApproval.status === "PENDING" && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={() => handleReject(selectedApproval.id)}>
                    Reject
                  </Button>
                  <Button variant="success" onClick={() => handleApprove(selectedApproval.id)}>
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Approval Request Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Approval Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Type</Label>
              <Select
                value={formType}
                onValueChange={setFormType}
                options={APPROVAL_TYPES}
                placeholder="Select type..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="req-title">Title</Label>
              <Input
                id="req-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Brief title for the request"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="req-summary">Summary</Label>
              <Input
                id="req-summary"
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="One-line summary"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="req-details">Details</Label>
              <Textarea
                id="req-details"
                value={formDetails}
                onChange={(e) => setFormDetails(e.target.value)}
                placeholder="Full details of the request..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Urgency</Label>
              <Select
                value={formUrgency}
                onValueChange={setFormUrgency}
                options={URGENCY_OPTIONS}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="req-doc">Attach Document (filename)</Label>
              <Input
                id="req-doc"
                value={formDocument}
                onChange={(e) => setFormDocument(e.target.value)}
                placeholder="e.g. offer_letter.pdf"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Approval Chain (select in order)</Label>
              <div className="mt-2 space-y-2">
                {AVAILABLE_APPROVERS.map((approver) => {
                  const isSelected = formApprovers.includes(approver.id);
                  const order = formApprovers.indexOf(approver.id) + 1;
                  return (
                    <button
                      key={approver.id}
                      type="button"
                      onClick={() => toggleApprover(approver.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected && (
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                          {order}
                        </span>
                      )}
                      <div className={!isSelected ? "ml-8" : ""}>
                        <p className="text-sm font-medium text-slate-700">{approver.name}</p>
                        <p className="text-xs text-slate-400">{approver.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest} disabled={!formType || !formTitle || !formSummary}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
