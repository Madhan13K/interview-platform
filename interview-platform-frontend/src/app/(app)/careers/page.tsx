"use client";

import { useState, useEffect, useCallback } from "react";
import { jobPositionService } from "@/services/job-position.service";
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
import type { JobPositionResponse } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type ApplicationStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "REJECTED";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  linkedinUrl?: string;
  coverLetter?: string;
  resumeFileName?: string;
  status: ApplicationStatus;
  appliedAt: string;
  timeline: { status: ApplicationStatus; date: string; note?: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Sales", "Product", "HR", "Finance"];
const LOCATIONS = ["Remote", "San Francisco", "New York", "London", "Berlin", "Singapore"];
const TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const EXPERIENCE_LEVELS = ["Entry Level", "Mid-Level", "Senior", "Lead", "Director"];

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const statusColors: Record<ApplicationStatus, string> = {
  APPLIED: "bg-slate-100 text-slate-700 border-slate-200",
  SCREENING: "bg-amber-100 text-amber-700 border-amber-200",
  INTERVIEW: "bg-blue-100 text-blue-700 border-blue-200",
  OFFERED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");
  const [jobs, setJobs] = useState<JobPositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [experienceFilter, setExperienceFilter] = useState("ALL");

  // Job detail / apply modal
  const [selectedJob, setSelectedJob] = useState<JobPositionResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applyMode, setApplyMode] = useState(false);

  // Application form state
  const [appName, setAppName] = useState("");
  const [appEmail, setAppEmail] = useState("");
  const [appLinkedin, setAppLinkedin] = useState("");
  const [appCoverLetter, setAppCoverLetter] = useState("");
  const [appResume, setAppResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // My Applications
  const [applications, setApplications] = useState<Application[]>([]);

  // ─── Fetch Jobs ─────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: JobPositionResponse[];
      if (searchQuery.trim()) {
        data = await jobPositionService.search(searchQuery);
      } else {
        data = await jobPositionService.filterByStatus("OPEN");
      }
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load job listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─── Filtering ──────────────────────────────────────────────────────────

  const filteredJobs = jobs.filter((job) => {
    if (departmentFilter !== "ALL" && job.department !== departmentFilter) return false;
    if (locationFilter !== "ALL" && job.location !== locationFilter) return false;
    if (typeFilter !== "ALL" && job.type !== typeFilter) return false;
    if (experienceFilter !== "ALL" && job.experienceLevel !== experienceFilter) return false;
    return true;
  });

  // ─── Application Submission ─────────────────────────────────────────────

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      await api.post("/api/v1/applications", {
        jobPositionId: selectedJob.id,
        name: appName,
        email: appEmail,
        linkedinUrl: appLinkedin || undefined,
        coverLetter: appCoverLetter || undefined,
        resumeFileName: appResume?.name || undefined,
      });

      // Add to local applications list
      const newApp: Application = {
        id: crypto.randomUUID(),
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        name: appName,
        email: appEmail,
        linkedinUrl: appLinkedin || undefined,
        coverLetter: appCoverLetter || undefined,
        resumeFileName: appResume?.name || undefined,
        status: "APPLIED",
        appliedAt: new Date().toISOString(),
        timeline: [{ status: "APPLIED", date: new Date().toISOString(), note: "Application submitted" }],
      };
      setApplications((prev) => [newApp, ...prev]);

      // Reset form
      resetApplicationForm();
      setApplyMode(false);
      setDetailOpen(false);
    } catch (err) {
      console.error("Failed to submit application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetApplicationForm = () => {
    setAppName("");
    setAppEmail("");
    setAppLinkedin("");
    setAppCoverLetter("");
    setAppResume(null);
  };

  const openJobDetail = (job: JobPositionResponse) => {
    setSelectedJob(job);
    setApplyMode(false);
    setDetailOpen(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchJobs} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Try Again
          </Button>
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
          <h1 className="text-2xl font-bold text-slate-900">Career Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">Find your next role and grow with us</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            {filteredJobs.length} Open {filteredJobs.length === 1 ? "Position" : "Positions"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "jobs"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Job Board
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "applications"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Applications
          {applications.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══ Job Board Tab ═══ */}
      {activeTab === "jobs" && (
        <>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search jobs by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Locations</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Grid */}
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No positions found</h3>
              <p className="text-slate-500 max-w-sm">Try adjusting your search or filters to find more opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => openJobDetail(job)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
                        {job.title}
                      </CardTitle>
                      <Badge className="text-xs shrink-0 bg-indigo-100 text-indigo-700 border-indigo-200">
                        {typeLabels[job.type]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {job.department}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{job.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">Posted {formatDate(job.createdAt)}</span>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                          setApplyMode(true);
                          setDetailOpen(true);
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ My Applications Tab ═══ */}
      {activeTab === "applications" && (
        <>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
              <p className="text-slate-500 max-w-sm">Browse open positions and submit your application to get started.</p>
              <Button
                onClick={() => setActiveTab("jobs")}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Browse Jobs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{app.jobTitle}</h3>
                        <p className="text-sm text-slate-500 mt-1">Applied {formatDate(app.appliedAt)}</p>
                      </div>
                      <Badge className={`text-xs ${statusColors[app.status]}`}>
                        {app.status}
                      </Badge>
                    </div>

                    {/* Timeline */}
                    <Separator className="my-4" />
                    <div className="relative pl-6">
                      {app.timeline.map((entry, idx) => (
                        <div key={idx} className="relative pb-4 last:pb-0">
                          <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                          {idx < app.timeline.length - 1 && (
                            <div className="absolute left-[-15px] top-4 w-0.5 h-full bg-slate-200" />
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${statusColors[entry.status]}`}>
                              {entry.status}
                            </Badge>
                            <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-slate-500 mt-1">{entry.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ Job Detail / Apply Modal ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && !applyMode && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  {selectedJob.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    {typeLabels[selectedJob.type]}
                  </Badge>
                  <Badge variant="outline" className="text-slate-600">
                    {selectedJob.department}
                  </Badge>
                  {selectedJob.location && (
                    <Badge variant="outline" className="text-slate-600">
                      {selectedJob.location}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-slate-600">
                    {selectedJob.experienceLevel}
                  </Badge>
                </div>

                {selectedJob.salaryRange && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      Salary: {selectedJob.salaryRange.currency}{" "}
                      {selectedJob.salaryRange.min.toLocaleString()} - {selectedJob.salaryRange.max.toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedJob.description && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i} className="text-sm text-slate-600">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={() => setApplyMode(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedJob && applyMode && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  Apply for {selectedJob.title}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleApply} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">Full Name *</Label>
                    <Input
                      id="app-name"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-email">Email *</Label>
                    <Input
                      id="app-email"
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app-linkedin">LinkedIn URL</Label>
                  <Input
                    id="app-linkedin"
                    value={appLinkedin}
                    onChange={(e) => setAppLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app-resume">Resume *</Label>
                  <Input
                    id="app-resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setAppResume(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-slate-400">Accepted formats: PDF, DOC, DOCX</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app-cover">Cover Letter</Label>
                  <Textarea
                    id="app-cover"
                    value={appCoverLetter}
                    onChange={(e) => setAppCoverLetter(e.target.value)}
                    placeholder="Tell us why you're interested in this role..."
                    rows={5}
                  />
                </div>

                <Separator />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setApplyMode(false)}>
                    Back to Details
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
