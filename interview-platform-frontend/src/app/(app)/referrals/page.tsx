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
type ReferralStatus = "SUBMITTED" | "SCREENING" | "INTERVIEWED" | "HIRED" | "REJECTED";

interface Referral {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  relationship: string;
  notes: string;
  status: ReferralStatus;
  submittedDate: string;
  bonusAmount: number | null;
  referrerName: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  totalReferrals: number;
  hiredCount: number;
  hireRate: number;
  totalBonus: number;
}

// Constants
const POSITION_OPTIONS = [
  { value: "senior_engineer", label: "Senior Software Engineer" },
  { value: "frontend_dev", label: "Frontend Developer" },
  { value: "backend_dev", label: "Backend Developer" },
  { value: "product_manager", label: "Product Manager" },
  { value: "designer", label: "UX Designer" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "devops_engineer", label: "DevOps Engineer" },
  { value: "qa_engineer", label: "QA Engineer" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "former_colleague", label: "Former Colleague" },
  { value: "friend", label: "Friend" },
  { value: "university_peer", label: "University Peer" },
  { value: "professional_network", label: "Professional Network" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

const STATUS_STAGES: ReferralStatus[] = ["SUBMITTED", "SCREENING", "INTERVIEWED", "HIRED"];

const STATUS_COLORS: Record<ReferralStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700",
  SCREENING: "bg-blue-100 text-blue-700",
  INTERVIEWED: "bg-indigo-100 text-indigo-700",
  HIRED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

// Mock data
const INITIAL_REFERRALS: Referral[] = [
  {
    id: "ref-1",
    candidateName: "Alice Johnson",
    candidateEmail: "alice@email.com",
    position: "Senior Software Engineer",
    relationship: "Former Colleague",
    notes: "Worked together at TechCorp for 3 years. Excellent problem solver.",
    status: "HIRED",
    submittedDate: "2024-10-15",
    bonusAmount: 5000,
    referrerName: "You",
  },
  {
    id: "ref-2",
    candidateName: "Bob Martinez",
    candidateEmail: "bob.m@email.com",
    position: "Frontend Developer",
    relationship: "University Peer",
    notes: "CS grad from MIT, strong React skills.",
    status: "INTERVIEWED",
    submittedDate: "2024-11-20",
    bonusAmount: null,
    referrerName: "You",
  },
  {
    id: "ref-3",
    candidateName: "Carol Zhang",
    candidateEmail: "carol.z@email.com",
    position: "Product Manager",
    relationship: "Professional Network",
    notes: "Met at a product conference. Great strategic thinker.",
    status: "SCREENING",
    submittedDate: "2024-12-01",
    bonusAmount: null,
    referrerName: "You",
  },
  {
    id: "ref-4",
    candidateName: "David Kim",
    candidateEmail: "david.k@email.com",
    position: "Data Scientist",
    relationship: "Former Colleague",
    notes: "PhD in ML, published researcher.",
    status: "SUBMITTED",
    submittedDate: "2024-12-10",
    bonusAmount: null,
    referrerName: "You",
  },
  {
    id: "ref-5",
    candidateName: "Eva Brown",
    candidateEmail: "eva.b@email.com",
    position: "UX Designer",
    relationship: "Friend",
    notes: "Portfolio is excellent.",
    status: "REJECTED",
    submittedDate: "2024-09-05",
    bonusAmount: null,
    referrerName: "You",
  },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { id: "l1", name: "Sarah Chen", department: "Engineering", totalReferrals: 12, hiredCount: 5, hireRate: 41.7, totalBonus: 25000 },
  { id: "l2", name: "Mike Rodriguez", department: "Product", totalReferrals: 8, hiredCount: 3, hireRate: 37.5, totalBonus: 15000 },
  { id: "l3", name: "You", department: "Engineering", totalReferrals: 5, hiredCount: 1, hireRate: 20.0, totalBonus: 5000 },
  { id: "l4", name: "Lisa Park", department: "Design", totalReferrals: 6, hiredCount: 2, hireRate: 33.3, totalBonus: 10000 },
  { id: "l5", name: "James Wilson", department: "Engineering", totalReferrals: 4, hiredCount: 1, hireRate: 25.0, totalBonus: 5000 },
];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [referDialogOpen, setReferDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Settings state
  const [bonusPerHire, setBonusPerHire] = useState("5000");
  const [programRules, setProgramRules] = useState(
    "Referral bonus is paid after the referred candidate completes 90 days of employment. Both full-time and contract positions are eligible. Self-referrals are not permitted."
  );

  // Stats
  const totalReferrals = referrals.length;
  const hiredCount = referrals.filter((r) => r.status === "HIRED").length;
  const pendingCount = referrals.filter((r) => !["HIRED", "REJECTED"].includes(r.status)).length;
  const totalBonus = referrals.reduce((sum, r) => sum + (r.bonusAmount ?? 0), 0);

  const handleSubmitReferral = () => {
    if (!formName || !formEmail || !formPosition) return;
    const positionLabel = POSITION_OPTIONS.find((p) => p.value === formPosition)?.label ?? formPosition;
    const relationshipLabel = RELATIONSHIP_OPTIONS.find((r) => r.value === formRelationship)?.label ?? formRelationship;

    const newReferral: Referral = {
      id: `ref-${Date.now()}`,
      candidateName: formName,
      candidateEmail: formEmail,
      position: positionLabel,
      relationship: relationshipLabel,
      notes: formNotes,
      status: "SUBMITTED",
      submittedDate: new Date().toISOString().split("T")[0],
      bonusAmount: null,
      referrerName: "You",
    };
    setReferrals((prev) => [newReferral, ...prev]);
    resetForm();
    setReferDialogOpen(false);
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPosition("");
    setFormRelationship("");
    setFormNotes("");
  };

  const getStageProgress = (status: ReferralStatus): number => {
    if (status === "REJECTED") return -1;
    const idx = STATUS_STAGES.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
          <p className="text-sm text-slate-500 mt-1">
            Refer great candidates and earn rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button onClick={() => setReferDialogOpen(true)}>Refer a Candidate</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total Referrals</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Hired</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{hiredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Bonus Earned</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">${totalBonus.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* My Referrals */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">My Referrals</h2>
        <div className="space-y-4">
          {referrals.map((referral) => {
            const progress = getStageProgress(referral.status);
            return (
              <Card key={referral.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{referral.candidateName}</h3>
                      <p className="text-sm text-slate-500">{referral.position}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={STATUS_COLORS[referral.status]}>
                        {referral.status}
                      </Badge>
                      {referral.bonusAmount && (
                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                          +${referral.bonusAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pipeline Visualization */}
                  {referral.status !== "REJECTED" && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1">
                        {STATUS_STAGES.map((stage, i) => (
                          <div key={stage} className="flex items-center flex-1">
                            <div className="flex-1">
                              <div
                                className={`h-2 rounded-full transition-colors ${
                                  i <= progress
                                    ? "bg-indigo-500"
                                    : "bg-slate-200"
                                }`}
                              />
                              <p className={`text-[10px] mt-1 ${
                                i <= progress ? "text-indigo-600 font-medium" : "text-slate-400"
                              }`}>
                                {stage}
                              </p>
                            </div>
                            {i < STATUS_STAGES.length - 1 && (
                              <div className="w-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {referral.status === "REJECTED" && (
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-red-200" />
                      <p className="text-[10px] mt-1 text-red-500 font-medium">REJECTED</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>Submitted {referral.submittedDate}</span>
                    <span>{referral.relationship}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Referral Leaderboard</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 font-medium text-slate-500">Rank</th>
                    <th className="text-left p-4 font-medium text-slate-500">Name</th>
                    <th className="text-left p-4 font-medium text-slate-500">Department</th>
                    <th className="text-center p-4 font-medium text-slate-500">Referrals</th>
                    <th className="text-center p-4 font-medium text-slate-500">Hired</th>
                    <th className="text-center p-4 font-medium text-slate-500">Hire Rate</th>
                    <th className="text-right p-4 font-medium text-slate-500">Total Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD.sort((a, b) => b.hiredCount - a.hiredCount).map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-50 ${entry.name === "You" ? "bg-indigo-50" : ""}`}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                            ? "bg-slate-200 text-slate-600"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {entry.name}
                        {entry.name === "You" && (
                          <Badge variant="default" className="ml-2 text-[10px]">You</Badge>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">{entry.department}</td>
                      <td className="p-4 text-center">{entry.totalReferrals}</td>
                      <td className="p-4 text-center font-semibold text-emerald-600">{entry.hiredCount}</td>
                      <td className="p-4 text-center">{entry.hireRate}%</td>
                      <td className="p-4 text-right font-semibold">${entry.totalBonus.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Refer a Candidate Dialog */}
      <Dialog open={referDialogOpen} onOpenChange={setReferDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refer a Candidate</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ref-name">Candidate Name</Label>
              <Input
                id="ref-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ref-email">Email</Label>
              <Input
                id="ref-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="candidate@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Position</Label>
              <Select
                value={formPosition}
                onValueChange={setFormPosition}
                options={POSITION_OPTIONS}
                placeholder="Select position..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Relationship</Label>
              <Select
                value={formRelationship}
                onValueChange={setFormRelationship}
                options={RELATIONSHIP_OPTIONS}
                placeholder="How do you know them?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ref-notes">Notes</Label>
              <Textarea
                id="ref-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Why would they be a great fit?"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReferral} disabled={!formName || !formEmail || !formPosition}>
              Submit Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog (Admin) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Referral Program Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="bonus-amount">Bonus Amount Per Hire ($)</Label>
              <Input
                id="bonus-amount"
                type="number"
                value={bonusPerHire}
                onChange={(e) => setBonusPerHire(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Eligible Positions</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {POSITION_OPTIONS.map((pos) => (
                  <Badge key={pos.value} variant="outline" className="cursor-pointer hover:bg-indigo-50">
                    {pos.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">All positions are currently eligible</p>
            </div>

            <div>
              <Label htmlFor="program-rules">Program Rules</Label>
              <Textarea
                id="program-rules"
                value={programRules}
                onChange={(e) => setProgramRules(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
