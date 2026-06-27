"use client";

import { useState, useEffect } from "react";
import { listAsyncInterviews, createAsyncInterview, publishAsyncInterview } from "@/services/async-interview.service";
import type { AsyncInterview } from "@/services/async-interview.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AsyncInterviewsPage() {
  const [interviews, setInterviews] = useState<AsyncInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ questionText: "", thinkingTime: 30, maxResponseTime: 120 }]);

  useEffect(() => {
    listAsyncInterviews().then(setInterviews).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || questions.every(q => !q.questionText.trim())) return;
    const result = await createAsyncInterview({
      title,
      questions: questions.filter(q => q.questionText.trim()),
    });
    setInterviews(prev => [result, ...prev]);
    setShowCreate(false);
    setTitle("");
    setQuestions([{ questionText: "", thinkingTime: 30, maxResponseTime: 120 }]);
  };

  const handlePublish = async (id: string) => {
    await publishAsyncInterview(id);
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: "PUBLISHED" } : i));
  };

  if (loading) return <div className="flex justify-center py-20"><p>Loading...</p></div>;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Async Video Interviews</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Interview"}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Async Interview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Frontend Developer Screen" />
            </div>
            <div>
              <Label>Questions</Label>
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={q.questionText}
                    onChange={e => {
                      const updated = [...questions];
                      updated[i].questionText = e.target.value;
                      setQuestions(updated);
                    }}
                    placeholder={`Question ${i + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setQuestions([...questions, { questionText: "", thinkingTime: 30, maxResponseTime: 120 }])}>
                + Add Question
              </Button>
            </div>
            <Button onClick={handleCreate}>Create</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {interviews.map(interview => (
          <Card key={interview.id}>
            <CardContent className="flex justify-between items-center py-4">
              <div>
                <h3 className="font-medium">{interview.title}</h3>
                <p className="text-sm text-slate-500">
                  {interview.questionCount} questions | {interview.invitationCount} candidates | Created {new Date(interview.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  interview.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                  interview.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {interview.status}
                </span>
                {interview.status === "DRAFT" && (
                  <Button size="sm" onClick={() => handlePublish(interview.id)}>Publish</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {interviews.length === 0 && (
          <p className="text-center text-slate-500 py-8">No async interviews yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
