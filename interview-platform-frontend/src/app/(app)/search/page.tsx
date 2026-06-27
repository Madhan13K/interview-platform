"use client";

import { useState } from "react";
import { searchInterviews, searchCandidates } from "@/services/search.service";
import type { InterviewSearchResult, CandidateSearchResult, SearchResult } from "@/services/search.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"interviews" | "candidates">("interviews");
  const [interviewResults, setInterviewResults] = useState<SearchResult<InterviewSearchResult> | null>(null);
  const [candidateResults, setCandidateResults] = useState<SearchResult<CandidateSearchResult> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (tab === "interviews") {
        const res = await searchInterviews(query);
        setInterviewResults(res);
      } else {
        const res = await searchCandidates(query);
        setCandidateResults(res);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search interviews, candidates, skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
          aria-label="Search query"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="flex gap-2 mb-4" role="tablist" aria-label="Search categories">
        <Button
          variant={tab === "interviews" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("interviews")}
          role="tab"
          aria-selected={tab === "interviews"}
        >
          Interviews
        </Button>
        <Button
          variant={tab === "candidates" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("candidates")}
          role="tab"
          aria-selected={tab === "candidates"}
        >
          Candidates
        </Button>
      </div>

      {tab === "interviews" && interviewResults && (
        <div role="tabpanel" aria-label="Interview results">
          <p className="text-sm text-slate-500 mb-3">
            {interviewResults.totalElements} results found
          </p>
          <div className="flex flex-col gap-3">
            {interviewResults.content.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <p>{item.description}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100">{item.status}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">{item.type}</span>
                    {item.candidate && <span>{item.candidate.name}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "candidates" && candidateResults && (
        <div role="tabpanel" aria-label="Candidate results">
          <p className="text-sm text-slate-500 mb-3">
            {candidateResults.totalElements} results found
          </p>
          <div className="flex flex-col gap-3">
            {candidateResults.content.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.fullName}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <p>{item.email}</p>
                  {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
