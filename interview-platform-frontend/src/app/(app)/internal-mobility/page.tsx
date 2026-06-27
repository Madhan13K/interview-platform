"use client";

import { useState, useEffect } from "react";
import { internalMobilityService, InternalPosting } from "@/services/internal-mobility.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InternalMobilityPage() {
  const [postings, setPostings] = useState<InternalPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalMobilityService
      .listPostings()
      .then((res) => setPostings(res.data))
      .catch(() => setPostings([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading internal postings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internal Mobility</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and apply for internal transfer and promotion opportunities
          </p>
        </div>
        <Button>Create Posting</Button>
      </div>

      {postings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No internal postings available. Check back later or create a new posting.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {postings.map((posting) => (
            <Card key={posting.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{posting.title}</CardTitle>
                  <Badge variant={posting.status === "OPEN" ? "default" : "secondary"}>
                    {posting.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-3">{posting.department}</p>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{posting.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Closing: {posting.closingDate}</p>
                  {posting.status === "OPEN" && (
                    <Button size="sm">Apply</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
