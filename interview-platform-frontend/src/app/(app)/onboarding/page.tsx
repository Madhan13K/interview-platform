"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type OnboardingStep = "welcome" | "organization" | "invite" | "first-job" | "schedule" | "complete";

interface OrgFormData {
  name: string;
  industry: string;
  size: string;
  website: string;
}

interface InviteData {
  email: string;
  role: string;
}

interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: string;
}

const STEPS: { id: OnboardingStep; label: string; number: number }[] = [
  { id: "welcome", label: "Welcome", number: 0 },
  { id: "organization", label: "Create Organization", number: 1 },
  { id: "invite", label: "Invite Team", number: 2 },
  { id: "first-job", label: "First Job", number: 3 },
  { id: "schedule", label: "Schedule", number: 4 },
  { id: "complete", label: "Complete", number: 5 },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [orgData, setOrgData] = useState<OrgFormData>({ name: "", industry: "", size: "", website: "" });
  const [invites, setInvites] = useState<InviteData[]>([{ email: "", role: "interviewer" }]);
  const [jobData, setJobData] = useState<JobFormData>({ title: "", department: "", location: "", type: "full-time" });
  const [schedulePreference, setSchedulePreference] = useState<string>("weekdays");

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = (currentStepIndex / (STEPS.length - 1)) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const addInvite = () => {
    setInvites((prev) => [...prev, { email: "", role: "interviewer" }]);
  };

  const removeInvite = (index: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: keyof InviteData, value: string) => {
    setInvites((prev) =>
      prev.map((invite, i) => (i === index ? { ...invite, [field]: value } : invite))
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "organization": return !!orgData.name.trim() && !!orgData.industry;
      case "invite": return invites.some((i) => i.email.trim().includes("@"));
      case "first-job": return !!jobData.title.trim() && !!jobData.department.trim();
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        {currentStep !== "welcome" && currentStep !== "complete" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.filter((s) => s.id !== "welcome" && s.id !== "complete").map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 ${
                    STEPS.findIndex((s) => s.id === step.id) <= currentStepIndex
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      STEPS.findIndex((s) => s.id === step.id) < currentStepIndex
                        ? "bg-indigo-600 text-white"
                        : STEPS.findIndex((s) => s.id === step.id) === currentStepIndex
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {STEPS.findIndex((s) => s.id === step.id) < currentStepIndex ? "✓" : step.number}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Welcome Step */}
            {currentStep === "welcome" && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 mx-auto flex items-center justify-center">
                  <span className="text-3xl">👋</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Welcome to Interview Platform</h1>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Let&apos;s get you set up in just a few minutes. We&apos;ll walk you through
                    creating your organization, inviting your team, and posting your first job.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                    Takes ~3 minutes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                    4 simple steps
                  </div>
                </div>
                <Button onClick={goNext} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                  Get Started
                </Button>
              </div>
            )}

            {/* Organization Step */}
            {currentStep === "organization" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create Your Organization</h2>
                  <p className="text-sm text-slate-500 mt-1">Tell us about your company</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input
                      value={orgData.name}
                      onChange={(e) => setOrgData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <select
                      value={orgData.industry}
                      onChange={(e) => setOrgData((prev) => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                    >
                      <option value="">Select industry...</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Size</Label>
                      <select
                        value={orgData.size}
                        onChange={(e) => setOrgData((prev) => ({ ...prev, size: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                      >
                        <option value="">Select size...</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-1000">201-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={orgData.website}
                        onChange={(e) => setOrgData((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invite Step */}
            {currentStep === "invite" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Invite Your Team</h2>
                  <p className="text-sm text-slate-500 mt-1">Add team members to collaborate on hiring</p>
                </div>
                <div className="space-y-3">
                  {invites.map((invite, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={invite.email}
                        onChange={(e) => updateInvite(idx, "email", e.target.value)}
                        placeholder="email@company.com"
                        className="flex-1"
                      />
                      <select
                        value={invite.role}
                        onChange={(e) => updateInvite(idx, "role", e.target.value)}
                        className="px-3 py-2 rounded-md border border-slate-200 text-sm w-36"
                      >
                        <option value="admin">Admin</option>
                        <option value="interviewer">Interviewer</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                      </select>
                      {invites.length > 1 && (
                        <button onClick={() => removeInvite(idx)} className="text-slate-400 hover:text-red-500">×</button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addInvite}>
                    + Add Another
                  </Button>
                </div>
                <p className="text-xs text-slate-400">You can skip this step and invite people later.</p>
              </div>
            )}

            {/* First Job Step */}
            {currentStep === "first-job" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Post Your First Job</h2>
                  <p className="text-sm text-slate-500 mt-1">Create a job opening to start receiving candidates</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <Input
                      value={jobData.title}
                      onChange={(e) => setJobData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Input
                        value={jobData.department}
                        onChange={(e) => setJobData((prev) => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={jobData.location}
                        onChange={(e) => setJobData((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Remote, NYC"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <div className="flex gap-2">
                      {["full-time", "part-time", "contract", "internship"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setJobData((prev) => ({ ...prev, type }))}
                          className={`px-3 py-1.5 rounded-md border text-sm capitalize ${
                            jobData.type === type
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {type.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Step */}
            {currentStep === "schedule" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Set Your Availability</h2>
                  <p className="text-sm text-slate-500 mt-1">When are you available for interviews?</p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "weekdays", label: "Weekdays (9 AM - 5 PM)", desc: "Standard business hours" },
                    { id: "flexible", label: "Flexible", desc: "Available most times, will confirm each request" },
                    { id: "custom", label: "Custom Schedule", desc: "Set specific time blocks" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSchedulePreference(option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        schedulePreference === option.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-700">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === "complete" && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">You&apos;re All Set!</h2>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Your workspace is ready. Start managing your hiring pipeline and scheduling interviews.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 max-w-sm mx-auto">
                  <Card className="p-3 text-center">
                    <p className="text-lg font-bold text-indigo-600">{orgData.name || "Org"}</p>
                    <p className="text-xs text-slate-500">Organization</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-lg font-bold text-indigo-600">{invites.filter((i) => i.email.trim()).length}</p>
                    <p className="text-xs text-slate-500">Invites Sent</p>
                  </Card>
                </div>
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                  Go to Dashboard
                </Button>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep !== "welcome" && currentStep !== "complete" && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {currentStep === "invite" && (
                    <Button variant="ghost" onClick={goNext} className="text-slate-500">
                      Skip
                    </Button>
                  )}
                  <Button
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {currentStep === "schedule" ? "Complete Setup" : "Continue"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
