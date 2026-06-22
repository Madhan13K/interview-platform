"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// ─── Types ──────────────────────────────────────────────────────────────────

type OfferStatus = "DRAFT" | "PENDING_APPROVAL" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED";
type ApproverStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Approver {
  id: string;
  name: string;
  role: string;
  status: ApproverStatus;
  decidedAt?: string;
}

interface Offer {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  baseSalary: number;
  bonus: number;
  equity: string;
  currency: string;
  startDate: string;
  expiryDate: string;
  customTerms: string;
  benefits: string[];
  status: OfferStatus;
  createdAt: string;
  approvers: Approver[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const statusColors: Record<OfferStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 border-amber-200",
  SENT: "bg-blue-100 text-blue-700 border-blue-200",
  ACCEPTED: "bg-green-100 text-green-700 border-green-200",
  DECLINED: "bg-red-100 text-red-700 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
};

const statusLabels: Record<OfferStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const approverStatusColors: Record<ApproverStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const MOCK_OFFERS: Offer[] = [
  {
    id: "1",
    candidateName: "Alice Johnson",
    candidateEmail: "alice@example.com",
    position: "Senior Software Engineer",
    baseSalary: 180000,
    bonus: 25000,
    equity: "0.1% over 4 years",
    currency: "USD",
    startDate: "2024-03-01",
    expiryDate: "2024-02-15",
    customTerms: "Relocation assistance of $10,000 included. Flexible work arrangement (3 days remote).",
    benefits: ["Health Insurance", "401(k) Match", "Unlimited PTO", "Home Office Stipend"],
    status: "PENDING_APPROVAL",
    createdAt: "2024-01-20T10:00:00Z",
    approvers: [
      { id: "a1", name: "Sarah Chen", role: "Hiring Manager", status: "APPROVED", decidedAt: "2024-01-21T09:00:00Z" },
      { id: "a2", name: "Michael Park", role: "VP Engineering", status: "PENDING" },
      { id: "a3", name: "Lisa Wang", role: "HR Director", status: "PENDING" },
    ],
  },
  {
    id: "2",
    candidateName: "Bob Martinez",
    candidateEmail: "bob@example.com",
    position: "Product Designer",
    baseSalary: 145000,
    bonus: 15000,
    equity: "0.05% over 4 years",
    currency: "USD",
    startDate: "2024-04-01",
    expiryDate: "2024-03-01",
    customTerms: "",
    benefits: ["Health Insurance", "401(k) Match", "PTO 25 days"],
    status: "SENT",
    createdAt: "2024-01-18T14:00:00Z",
    approvers: [
      { id: "a4", name: "Emily Ross", role: "Design Lead", status: "APPROVED", decidedAt: "2024-01-19T11:00:00Z" },
      { id: "a5", name: "Lisa Wang", role: "HR Director", status: "APPROVED", decidedAt: "2024-01-20T08:00:00Z" },
    ],
  },
  {
    id: "3",
    candidateName: "Carol White",
    candidateEmail: "carol@example.com",
    position: "Engineering Manager",
    baseSalary: 210000,
    bonus: 40000,
    equity: "0.15% over 4 years",
    currency: "USD",
    startDate: "2024-02-15",
    expiryDate: "2024-02-01",
    customTerms: "Sign-on bonus of $30,000.",
    benefits: ["Health Insurance", "401(k) Match", "Unlimited PTO", "Executive Coaching"],
    status: "ACCEPTED",
    createdAt: "2024-01-10T09:00:00Z",
    approvers: [
      { id: "a6", name: "David Kim", role: "CTO", status: "APPROVED", decidedAt: "2024-01-11T10:00:00Z" },
      { id: "a7", name: "Lisa Wang", role: "HR Director", status: "APPROVED", decidedAt: "2024-01-12T09:00:00Z" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [loading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [formCandidateName, setFormCandidateName] = useState("");
  const [formCandidateEmail, setFormCandidateEmail] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formBaseSalary, setFormBaseSalary] = useState("");
  const [formBonus, setFormBonus] = useState("");
  const [formEquity, setFormEquity] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formStartDate, setFormStartDate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formCustomTerms, setFormCustomTerms] = useState("");
  const [formBenefits, setFormBenefits] = useState("");

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormCandidateName("");
    setFormCandidateEmail("");
    setFormPosition("");
    setFormBaseSalary("");
    setFormBonus("");
    setFormEquity("");
    setFormCurrency("USD");
    setFormStartDate("");
    setFormExpiryDate("");
    setFormCustomTerms("");
    setFormBenefits("");
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newOffer: Offer = {
        id: crypto.randomUUID(),
        candidateName: formCandidateName,
        candidateEmail: formCandidateEmail,
        position: formPosition,
        baseSalary: Number(formBaseSalary),
        bonus: Number(formBonus) || 0,
        equity: formEquity,
        currency: formCurrency,
        startDate: formStartDate,
        expiryDate: formExpiryDate,
        customTerms: formCustomTerms,
        benefits: formBenefits.split(",").map((b) => b.trim()).filter(Boolean),
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        approvers: [],
      };

      // Attempt API call (will be placeholder)
      try {
        await api.post("/api/v1/offers", newOffer);
      } catch {
        // API not available, use local state
      }

      setOffers((prev) => [newOffer, ...prev]);
      setCreateOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (offerId: string, newStatus: OfferStatus) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: newStatus } : o))
    );
    if (selectedOffer?.id === offerId) {
      setSelectedOffer((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
  };

  const handleSendToCandidate = (offerId: string) => {
    handleUpdateStatus(offerId, "SENT");
  };

  const handleRevoke = (offerId: string) => {
    handleUpdateStatus(offerId, "DRAFT");
  };

  const handleExtendDeadline = (offerId: string) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 14);
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId ? { ...o, expiryDate: newExpiry.toISOString().split("T")[0] } : o
      )
    );
  };

  const openDetail = (offer: Offer) => {
    setSelectedOffer(offer);
    setDetailOpen(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatCurrency = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString()}`;

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offer Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create, track, and manage candidate offers</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Create Offer
        </Button>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No offers yet</h3>
          <p className="text-slate-500">Create your first offer to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2">Salary</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="border border-slate-200 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => openDetail(offer)}
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <p className="font-medium text-slate-900">{offer.candidateName}</p>
                    <p className="text-xs text-slate-500">{offer.candidateEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-700">{offer.position}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(offer.baseSalary, offer.currency)}
                    </p>
                    {offer.bonus > 0 && (
                      <p className="text-xs text-slate-500">+ {formatCurrency(offer.bonus, offer.currency)} bonus</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge className={`text-xs ${statusColors[offer.status]}`}>
                      {statusLabels[offer.status]}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-slate-500">{formatDate(offer.createdAt)}</p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {offer.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleUpdateStatus(offer.id, "PENDING_APPROVAL")}
                      >
                        Submit
                      </Button>
                    )}
                    {offer.status === "PENDING_APPROVAL" && (
                      <Button
                        size="sm"
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleSendToCandidate(offer.id)}
                      >
                        Send
                      </Button>
                    )}
                    {offer.status === "SENT" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(offer.id, "ACCEPTED")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => handleUpdateStatus(offer.id, "DECLINED")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ Create Offer Dialog ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Create New Offer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOffer} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-name">Candidate Name *</Label>
                <Input
                  id="candidate-name"
                  value={formCandidateName}
                  onChange={(e) => setFormCandidateName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Candidate Email *</Label>
                <Input
                  id="candidate-email"
                  type="email"
                  value={formCandidateEmail}
                  onChange={(e) => setFormCandidateEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-position">Position *</Label>
              <Input
                id="offer-position"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>

            <Separator />
            <h4 className="text-sm font-medium text-slate-700">Compensation</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-salary">Base Salary *</Label>
                <Input
                  id="base-salary"
                  type="number"
                  value={formBaseSalary}
                  onChange={(e) => setFormBaseSalary(e.target.value)}
                  placeholder="150000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Signing/Annual Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={formBonus}
                  onChange={(e) => setFormBonus(e.target.value)}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formCurrency} onValueChange={setFormCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equity">Equity</Label>
              <Input
                id="equity"
                value={formEquity}
                onChange={(e) => setFormEquity(e.target.value)}
                placeholder="e.g. 0.1% over 4 years with 1 year cliff"
              />
            </div>

            <Separator />
            <h4 className="text-sm font-medium text-slate-700">Dates</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Proposed Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Offer Expiry Date *</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (comma-separated)</Label>
              <Input
                id="benefits"
                value={formBenefits}
                onChange={(e) => setFormBenefits(e.target.value)}
                placeholder="Health Insurance, 401(k) Match, Unlimited PTO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-terms">Custom Terms</Label>
              <Textarea
                id="custom-terms"
                value={formCustomTerms}
                onChange={(e) => setFormCustomTerms(e.target.value)}
                placeholder="Any additional terms or conditions..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Offer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ Offer Detail Dialog ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOffer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-semibold text-slate-900">
                    Offer Details
                  </DialogTitle>
                  <Badge className={`text-xs ${statusColors[selectedOffer.status]}`}>
                    {statusLabels[selectedOffer.status]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Candidate & Position */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Candidate</p>
                    <p className="font-medium text-slate-900">{selectedOffer.candidateName}</p>
                    <p className="text-sm text-slate-500">{selectedOffer.candidateEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Position</p>
                    <p className="font-medium text-slate-900">{selectedOffer.position}</p>
                  </div>
                </div>

                <Separator />

                {/* Compensation */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Compensation</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-md">
                      <p className="text-xs text-slate-500">Base Salary</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(selectedOffer.baseSalary, selectedOffer.currency)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md">
                      <p className="text-xs text-slate-500">Bonus</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(selectedOffer.bonus, selectedOffer.currency)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md">
                      <p className="text-xs text-slate-500">Equity</p>
                      <p className="font-semibold text-slate-900">{selectedOffer.equity || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedOffer.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expiry Date</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedOffer.expiryDate)}</p>
                  </div>
                </div>

                {/* Benefits */}
                {selectedOffer.benefits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Benefits</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOffer.benefits.map((b) => (
                        <Badge key={b} variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Terms */}
                {selectedOffer.customTerms && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Custom Terms</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
                      {selectedOffer.customTerms}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Approval Chain */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Approval Chain</h4>
                  {selectedOffer.approvers.length === 0 ? (
                    <p className="text-sm text-slate-500">No approvers assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedOffer.approvers.map((approver, idx) => (
                        <div
                          key={approver.id}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{approver.name}</p>
                              <p className="text-xs text-slate-500">{approver.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${approverStatusColors[approver.status]}`}>
                              {approver.status}
                            </Badge>
                            {approver.decidedAt && (
                              <span className="text-xs text-slate-400">{formatDate(approver.decidedAt)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* E-Signature */}
                <div className="p-4 border border-dashed border-slate-300 rounded-md bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">E-Signature</p>
                      <p className="text-xs text-slate-500">
                        Integration with DocuSign / HelloSign for digital signatures
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={selectedOffer.status !== "SENT"}
                    >
                      Send for Signature
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {(selectedOffer.status === "PENDING_APPROVAL" || selectedOffer.status === "DRAFT") && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => handleSendToCandidate(selectedOffer.id)}
                    >
                      Send to Candidate
                    </Button>
                  )}
                  {selectedOffer.status === "SENT" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => handleRevoke(selectedOffer.id)}
                      >
                        Revoke Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExtendDeadline(selectedOffer.id)}
                      >
                        Extend Deadline
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(selectedOffer.id, "ACCEPTED")}
                      >
                        Mark Accepted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedOffer.id, "DECLINED")}
                      >
                        Mark Declined
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
