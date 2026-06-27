"use client";

import { useState, useEffect } from "react";
import { transcriptionService, TranscriptionSession } from "@/services/transcription.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TranscriptionPage() {
  const [sessions, setSessions] = useState<TranscriptionSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: In production, fetch transcription sessions for the user
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading transcriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transcription</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time speech-to-text transcription for interviews
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Transcription Sessions</h3>
            <p className="text-sm text-slate-500">
              Transcription sessions are automatically created when you start recording an interview.
              View past transcripts from completed interviews here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium text-slate-900">Session {session.id.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-500">
                    {session.provider} | {session.language} | {session.segments.length} segments
                  </p>
                </div>
                <Badge variant={session.status === "COMPLETED" ? "default" : "secondary"}>
                  {session.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
