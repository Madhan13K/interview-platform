"use client";

import { useState, useEffect } from "react";
import { complianceService, ComplianceAuditRun } from "@/services/compliance.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AUDIT_TYPES = ["GDPR", "EEOC", "OFCCP", "SOC2", "CCPA"];

export default function CompliancePage() {
  const [audits, setAudits] = useState<Record<string, ComplianceAuditRun | null>>({});
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(
      AUDIT_TYPES.map((type) =>
        complianceService
          .getLatest(type)
          .then((res) => ({ type, data: res.data }))
          .catch(() => ({ type, data: null }))
      )
    ).then((results) => {
      const map: Record<string, ComplianceAuditRun | null> = {};
      results.forEach((r) => (map[r.type] = r.data));
      setAudits(map);
      setLoading(false);
    });
  }, []);

  const handleRunAudit = async (type: string) => {
    setRunningAudit(type);
    try {
      const res = await complianceService.runAudit(type);
      setAudits((prev) => ({ ...prev, [type]: res.data }));
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setRunningAudit(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading compliance dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Audits</h1>
          <p className="text-sm text-slate-500 mt-1">
            Run and review compliance audit checks across regulatory frameworks
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AUDIT_TYPES.map((type) => {
          const audit = audits[type];
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{type}</CardTitle>
                  {audit && (
                    <Badge variant={audit.score >= 80 ? "default" : "destructive"}>
                      {audit.score}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {audit ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">
                      {audit.passedChecks}/{audit.totalChecks} checks passed
                    </p>
                    <p className="text-xs text-slate-400">
                      Last run: {audit.completedAt || audit.startedAt}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No audit run yet</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleRunAudit(type)}
                  disabled={runningAudit === type}
                >
                  {runningAudit === type ? "Running..." : "Run Audit"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
