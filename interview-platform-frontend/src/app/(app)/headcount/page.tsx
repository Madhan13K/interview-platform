"use client";

import { useState, useEffect } from "react";
import { headcountService, HeadcountRequest } from "@/services/headcount.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HeadcountPage() {
  const [requests, setRequests] = useState<HeadcountRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    headcountService
      .list()
      .then((res) => setRequests(res.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "PENDING_APPROVAL":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading headcount requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Headcount Planning</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage headcount requests, approvals, and workforce forecasting
          </p>
        </div>
        <Button>New Headcount Request</Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No headcount requests found. Create one to start planning your workforce needs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium text-slate-900">{req.title}</h3>
                  <p className="text-sm text-slate-500">
                    {req.department} | Priority: {req.priority} | Target: {req.targetStartDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadge(req.status) as "default" | "secondary" | "destructive" | "outline"}>
                    {req.status.replace("_", " ")}
                  </Badge>
                  {req.status === "PENDING_APPROVAL" && (
                    <Button size="sm" variant="outline">
                      Approve
                    </Button>
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
