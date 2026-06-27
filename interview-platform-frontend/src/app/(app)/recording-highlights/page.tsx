"use client";

import { useState } from "react";
import { recordingHighlightsService, RecordingHighlight } from "@/services/recording-highlights.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecordingHighlightsPage() {
  const [interviewId, setInterviewId] = useState("");
  const [highlights, setHighlights] = useState<RecordingHighlight[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      const res = await recordingHighlightsService.listByInterview(interviewId);
      setHighlights(res.data);
    } catch (error) {
      console.error("Failed to load highlights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      const res = await recordingHighlightsService.generate(interviewId);
      setHighlights(res.data);
    } catch (error) {
      console.error("Failed to generate highlights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "STRONG_ANSWER":
        return "default";
      case "RED_FLAG":
        return "destructive";
      case "KEY_MOMENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recording Highlights</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI-generated key moments and bookmarks from interview recordings
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="interview-id">Interview ID</Label>
              <Input
                id="interview-id"
                value={interviewId}
                onChange={(e) => setInterviewId(e.target.value)}
                placeholder="Enter interview ID..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleLoad} disabled={loading || !interviewId} variant="outline">
              Load Highlights
            </Button>
            <Button onClick={handleGenerate} disabled={loading || !interviewId}>
              {loading ? "Processing..." : "Generate with AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Highlights ({highlights.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg">
                  <div className="text-xs font-mono text-slate-400 whitespace-nowrap pt-1">
                    {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 text-sm">{highlight.label}</p>
                      <Badge variant={getTypeBadge(highlight.type) as "default" | "secondary" | "destructive" | "outline"}>
                        {highlight.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{highlight.transcript}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
