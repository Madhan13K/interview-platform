"use client";

import { useState, useEffect } from "react";
import { duplicateDetectionService, DuplicateCandidate } from "@/services/duplicate-detection.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DuplicateDetectionPage() {
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    duplicateDetectionService
      .getPending()
      .then((res) => setDuplicates(res.data))
      .catch(() => setDuplicates([]))
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await duplicateDetectionService.scan();
      // Refresh pending list after scan
      const pendingRes = await duplicateDetectionService.getPending();
      setDuplicates(pendingRes.data);
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (id: string, status: "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE") => {
    try {
      await duplicateDetectionService.resolve(id, status);
      setDuplicates((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Resolution failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading duplicate candidates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duplicate Detection</h1>
          <p className="text-sm text-slate-500 mt-1">
            Identify and merge duplicate candidate records
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? "Scanning..." : "Run Scan"}
        </Button>
      </div>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No pending duplicates found. Run a scan to check for duplicate candidate records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <Card key={dup.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-medium text-slate-900">{dup.candidateAName}</p>
                      <p className="text-xs text-slate-500">{dup.candidateAId.slice(0, 8)}</p>
                    </div>
                    <span className="text-slate-400">vs</span>
                    <div className="text-center">
                      <p className="font-medium text-slate-900">{dup.candidateBName}</p>
                      <p className="text-xs text-slate-500">{dup.candidateBId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{dup.matchScore}% match</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Matching fields: {dup.matchFields.join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleResolve(dup.id, "NOT_DUPLICATE")}>
                      Not Duplicate
                    </Button>
                    <Button size="sm" onClick={() => handleResolve(dup.id, "CONFIRMED_DUPLICATE")}>
                      Confirm & Merge
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
