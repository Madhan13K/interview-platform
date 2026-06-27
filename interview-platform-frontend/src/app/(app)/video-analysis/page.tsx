"use client";

import { useState } from "react";
import { videoAnalysisService } from "@/services/video-analysis.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VideoAnalysisPage() {
  const [analyses, setAnalyses] = useState<
    { id: string; interviewId: string; status: string; sentimentScore: number; engagementScore: number; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered sentiment and engagement analysis from interview recordings
          </p>
        </div>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Video Analyses</h3>
            <p className="text-sm text-slate-500 mb-6">
              Video analysis processes interview recordings to extract sentiment, engagement,
              and emotional signals throughout the conversation.
            </p>
            <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Sentiment Tracking</h4>
                <p className="text-xs text-slate-500 mt-1">Track candidate sentiment throughout the interview</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Engagement Score</h4>
                <p className="text-xs text-slate-500 mt-1">Measure visual engagement and attentiveness</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Emotion Timeline</h4>
                <p className="text-xs text-slate-500 mt-1">Visualize emotional changes over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium text-slate-900">Interview {analysis.interviewId.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-500">
                    Sentiment: {analysis.sentimentScore}% | Engagement: {analysis.engagementScore}%
                  </p>
                </div>
                <Badge variant={analysis.status === "COMPLETED" ? "default" : "secondary"}>
                  {analysis.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
