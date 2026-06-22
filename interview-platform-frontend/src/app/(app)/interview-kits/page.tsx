"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Question {
  id: string;
  text: string;
  expectedAnswer: string;
  rubric: { score: number; description: string }[];
  timeAllocation: number;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
}

interface InterviewKit {
  id: string;
  title: string;
  role: string;
  type: "Technical" | "Behavioral" | "Mixed";
  duration: number;
  sections: Section[];
}

const mockKits: InterviewKit[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    role: "Frontend Engineer",
    type: "Technical",
    duration: 60,
    sections: [
      {
        id: "s1",
        name: "Opening Questions",
        questions: [
          {
            id: "q1",
            text: "Tell me about your experience with modern frontend frameworks.",
            expectedAnswer:
              "Candidate should discuss experience with React, Vue, or Angular, mentioning specific projects and architectural decisions.",
            rubric: [
              { score: 1, description: "No framework experience" },
              { score: 2, description: "Basic usage only" },
              { score: 3, description: "Moderate experience with one framework" },
              { score: 4, description: "Strong experience with multiple frameworks" },
              { score: 5, description: "Expert-level, architectural contributions" },
            ],
            timeAllocation: 5,
          },
        ],
      },
      {
        id: "s2",
        name: "Technical",
        questions: [
          {
            id: "q2",
            text: "Explain how you would optimize a React application that has significant re-render issues.",
            expectedAnswer:
              "Should mention React.memo, useMemo, useCallback, virtualization, code splitting, lazy loading, and profiling tools.",
            rubric: [
              { score: 1, description: "Cannot identify optimization strategies" },
              { score: 2, description: "Mentions one or two basic strategies" },
              { score: 3, description: "Good understanding of memoization" },
              { score: 4, description: "Comprehensive optimization knowledge" },
              { score: 5, description: "Expert knowledge including advanced patterns" },
            ],
            timeAllocation: 15,
          },
          {
            id: "q3",
            text: "Describe your approach to state management in large-scale applications.",
            expectedAnswer:
              "Should discuss local vs global state, libraries (Redux, Zustand, Jotai), server state (React Query/SWR), and trade-offs.",
            rubric: [
              { score: 1, description: "No understanding of state management" },
              { score: 2, description: "Basic useState/useContext only" },
              { score: 3, description: "Familiar with one state library" },
              { score: 4, description: "Strong grasp of multiple approaches" },
              { score: 5, description: "Architectural-level state design expertise" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s3",
        name: "Behavioral",
        questions: [
          {
            id: "q4",
            text: "Describe a time you had to push back on a technical decision. How did you handle it?",
            expectedAnswer:
              "Should demonstrate communication skills, data-driven arguments, and collaborative resolution.",
            rubric: [
              { score: 1, description: "Cannot provide an example" },
              { score: 2, description: "Vague example, poor resolution" },
              { score: 3, description: "Decent example with some reflection" },
              { score: 4, description: "Strong example showing leadership" },
              { score: 5, description: "Exceptional communication and outcome" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s4",
        name: "Closing",
        questions: [
          {
            id: "q5",
            text: "What questions do you have about our team and tech stack?",
            expectedAnswer:
              "Look for thoughtful questions that show research about the company and genuine curiosity about the role.",
            rubric: [
              { score: 1, description: "No questions" },
              { score: 2, description: "Generic questions" },
              { score: 3, description: "Some relevant questions" },
              { score: 4, description: "Thoughtful, researched questions" },
              { score: 5, description: "Insightful questions showing deep interest" },
            ],
            timeAllocation: 5,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Product Manager Screening",
    role: "Product Manager",
    type: "Behavioral",
    duration: 45,
    sections: [
      {
        id: "s5",
        name: "Opening Questions",
        questions: [
          {
            id: "q6",
            text: "Walk me through a product you've launched from ideation to release.",
            expectedAnswer:
              "Should cover discovery, validation, prioritization, cross-functional collaboration, launch, and iteration.",
            rubric: [
              { score: 1, description: "Cannot describe a full product cycle" },
              { score: 2, description: "Partial involvement described" },
              { score: 3, description: "Full cycle but limited depth" },
              { score: 4, description: "Strong end-to-end ownership" },
              { score: 5, description: "Exceptional strategic thinking and execution" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s6",
        name: "Technical",
        questions: [
          {
            id: "q7",
            text: "How do you prioritize features when you have competing stakeholder requests?",
            expectedAnswer:
              "Should mention frameworks (RICE, ICE, MoSCoW), data-driven decisions, stakeholder alignment, and trade-off communication.",
            rubric: [
              { score: 1, description: "No framework for prioritization" },
              { score: 2, description: "Ad-hoc approach" },
              { score: 3, description: "Uses one framework consistently" },
              { score: 4, description: "Multiple frameworks, strong justification" },
              { score: 5, description: "Strategic prioritization with business impact" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s7",
        name: "Behavioral",
        questions: [
          {
            id: "q8",
            text: "Tell me about a time a product launch didn't go as planned. What did you learn?",
            expectedAnswer:
              "Should show accountability, root cause analysis, lessons learned, and process improvements implemented.",
            rubric: [
              { score: 1, description: "Blames others, no learning" },
              { score: 2, description: "Acknowledges failure but limited reflection" },
              { score: 3, description: "Good reflection and some improvements" },
              { score: 4, description: "Strong accountability and actionable learnings" },
              { score: 5, description: "Transformed failure into systemic improvement" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s8",
        name: "Closing",
        questions: [
          {
            id: "q9",
            text: "What's your approach to building relationships with engineering teams?",
            expectedAnswer:
              "Should emphasize empathy, technical curiosity, trust building, and collaborative decision-making.",
            rubric: [
              { score: 1, description: "Adversarial or disconnected approach" },
              { score: 2, description: "Basic collaboration" },
              { score: 3, description: "Good working relationships" },
              { score: 4, description: "Strong partnership mindset" },
              { score: 5, description: "Exceptional cross-functional leadership" },
            ],
            timeAllocation: 10,
          },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Full-Stack Developer Assessment",
    role: "Full-Stack Developer",
    type: "Mixed",
    duration: 90,
    sections: [
      {
        id: "s9",
        name: "Opening Questions",
        questions: [
          {
            id: "q10",
            text: "What drew you to full-stack development and how do you stay current with both frontend and backend technologies?",
            expectedAnswer:
              "Should show passion for breadth, continuous learning habits, and awareness of current trends on both sides.",
            rubric: [
              { score: 1, description: "No clear motivation or learning approach" },
              { score: 2, description: "Limited engagement with learning" },
              { score: 3, description: "Regular learning, some depth" },
              { score: 4, description: "Strong learning habits, good breadth" },
              { score: 5, description: "Exceptional passion and systematic learning" },
            ],
            timeAllocation: 5,
          },
        ],
      },
      {
        id: "s10",
        name: "Technical",
        questions: [
          {
            id: "q11",
            text: "Design a real-time notification system. Walk through your architecture choices for both frontend and backend.",
            expectedAnswer:
              "Should cover WebSockets/SSE, message queues, database design, frontend state management, and scalability considerations.",
            rubric: [
              { score: 1, description: "Cannot articulate an architecture" },
              { score: 2, description: "Basic polling approach only" },
              { score: 3, description: "Good architecture for one side" },
              { score: 4, description: "Strong full-stack architecture" },
              { score: 5, description: "Production-ready, scalable design" },
            ],
            timeAllocation: 20,
          },
          {
            id: "q12",
            text: "How do you handle database migrations in a zero-downtime deployment environment?",
            expectedAnswer:
              "Should discuss backward-compatible migrations, feature flags, blue-green deployments, and rollback strategies.",
            rubric: [
              { score: 1, description: "No awareness of migration challenges" },
              { score: 2, description: "Basic migration knowledge" },
              { score: 3, description: "Understands backward compatibility" },
              { score: 4, description: "Strong deployment strategy knowledge" },
              { score: 5, description: "Expert in zero-downtime operations" },
            ],
            timeAllocation: 15,
          },
        ],
      },
      {
        id: "s11",
        name: "Behavioral",
        questions: [
          {
            id: "q13",
            text: "Describe a situation where you had to make a trade-off between code quality and delivery speed.",
            expectedAnswer:
              "Should show pragmatism, clear communication of trade-offs, technical debt awareness, and a plan to address it later.",
            rubric: [
              { score: 1, description: "Always sacrifices quality or always misses deadlines" },
              { score: 2, description: "Makes trade-offs without clear reasoning" },
              { score: 3, description: "Reasonable trade-offs with some planning" },
              { score: 4, description: "Strategic decisions with debt tracking" },
              { score: 5, description: "Exceptional balance with proactive remediation" },
            ],
            timeAllocation: 10,
          },
        ],
      },
      {
        id: "s12",
        name: "Closing",
        questions: [
          {
            id: "q14",
            text: "If you could redesign one system you've worked on, what would you change and why?",
            expectedAnswer:
              "Should demonstrate retrospective thinking, architectural awareness, and growth mindset.",
            rubric: [
              { score: 1, description: "Cannot identify improvements" },
              { score: 2, description: "Minor cosmetic changes only" },
              { score: 3, description: "Good architectural insight" },
              { score: 4, description: "Strong systemic thinking" },
              { score: 5, description: "Visionary redesign with clear justification" },
            ],
            timeAllocation: 10,
          },
        ],
      },
    ],
  },
];

function getQuestionCount(kit: InterviewKit): number {
  return kit.sections.reduce((acc, s) => acc + s.questions.length, 0);
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case "Technical":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "Behavioral":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Mixed":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function InterviewKitsPage() {
  const [kits, setKits] = useState<InterviewKit[]>(mockKits);
  const [selectedKit, setSelectedKit] = useState<InterviewKit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  // Create kit form state
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newType, setNewType] = useState<"Technical" | "Behavioral" | "Mixed">("Technical");
  const [newDuration, setNewDuration] = useState(60);
  const [newSections, setNewSections] = useState<Section[]>([
    { id: crypto.randomUUID(), name: "Opening Questions", questions: [] },
    { id: crypto.randomUUID(), name: "Technical", questions: [] },
    { id: crypto.randomUUID(), name: "Behavioral", questions: [] },
    { id: crypto.randomUUID(), name: "Closing", questions: [] },
  ]);

  const toggleAnswer = (questionId: string) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const openDetail = (kit: InterviewKit) => {
    setSelectedKit(kit);
    setDetailOpen(true);
  };

  const handleCreateKit = () => {
    if (!newTitle || !newRole) return;
    const newKit: InterviewKit = {
      id: crypto.randomUUID(),
      title: newTitle,
      role: newRole,
      type: newType,
      duration: newDuration,
      sections: newSections.filter((s) => s.questions.length > 0 || s.name),
    };
    setKits((prev) => [...prev, newKit]);
    setCreateOpen(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewRole("");
    setNewType("Technical");
    setNewDuration(60);
    setNewSections([
      { id: crypto.randomUUID(), name: "Opening Questions", questions: [] },
      { id: crypto.randomUUID(), name: "Technical", questions: [] },
      { id: crypto.randomUUID(), name: "Behavioral", questions: [] },
      { id: crypto.randomUUID(), name: "Closing", questions: [] },
    ]);
  };

  const addQuestionToSection = (sectionId: string) => {
    setNewSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  id: crypto.randomUUID(),
                  text: "",
                  expectedAnswer: "",
                  rubric: [
                    { score: 1, description: "" },
                    { score: 2, description: "" },
                    { score: 3, description: "" },
                    { score: 4, description: "" },
                    { score: 5, description: "" },
                  ],
                  timeAllocation: 5,
                },
              ],
            }
          : s
      )
    );
  };

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    field: keyof Question,
    value: string | number
  ) => {
    setNewSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, [field]: value } : q
              ),
            }
          : s
      )
    );
  };

  const handleDownloadPDF = (kit: InterviewKit) => {
    const content = generateKitText(kit);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kit.title.replace(/\s+/g, "-").toLowerCase()}-kit.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateKitText = (kit: InterviewKit): string => {
    let text = `INTERVIEW KIT: ${kit.title}\n`;
    text += `Role: ${kit.role}\n`;
    text += `Type: ${kit.type}\n`;
    text += `Duration: ${kit.duration} minutes\n`;
    text += `Total Questions: ${getQuestionCount(kit)}\n`;
    text += `${"=".repeat(60)}\n\n`;

    kit.sections.forEach((section) => {
      text += `--- ${section.name.toUpperCase()} ---\n\n`;
      section.questions.forEach((q, i) => {
        text += `${i + 1}. ${q.text}\n`;
        text += `   Time: ${q.timeAllocation} min\n`;
        text += `   Expected Answer: ${q.expectedAnswer}\n`;
        text += `   Rubric:\n`;
        q.rubric.forEach((r) => {
          text += `     ${r.score}/5 - ${r.description}\n`;
        });
        text += `\n`;
      });
    });

    return text;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interview Kits</h1>
          <p className="mt-1 text-slate-500">
            Structured interview guides for consistent, fair evaluations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">
                Create Interview Kit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit-title" className="text-slate-700">
                    Title
                  </Label>
                  <Input
                    id="kit-title"
                    placeholder="e.g. Senior Backend Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kit-role" className="text-slate-700">
                    Role
                  </Label>
                  <Input
                    id="kit-role"
                    placeholder="e.g. Backend Engineer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit-type" className="text-slate-700">
                    Type
                  </Label>
                  <select
                    id="kit-type"
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as "Technical" | "Behavioral" | "Mixed")
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kit-duration" className="text-slate-700">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="kit-duration"
                    type="number"
                    min={15}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Sections */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Sections & Questions</h3>
                {newSections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">{section.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestionToSection(section.id)}
                        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                      >
                        + Add Question
                      </Button>
                    </div>
                    {section.questions.map((question, qIdx) => (
                      <div
                        key={question.id}
                        className="ml-4 space-y-2 rounded border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            Q{qIdx + 1}
                          </span>
                          <Input
                            placeholder="Question text..."
                            value={question.text}
                            onChange={(e) =>
                              updateQuestion(section.id, question.id, "text", e.target.value)
                            }
                            className="text-sm border-slate-200"
                          />
                        </div>
                        <Textarea
                          placeholder="Expected answer..."
                          value={question.expectedAnswer}
                          onChange={(e) =>
                            updateQuestion(
                              section.id,
                              question.id,
                              "expectedAnswer",
                              e.target.value
                            )
                          }
                          className="text-sm border-slate-200"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-slate-500">Time (min):</Label>
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            value={question.timeAllocation}
                            onChange={(e) =>
                              updateQuestion(
                                section.id,
                                question.id,
                                "timeAllocation",
                                Number(e.target.value)
                              )
                            }
                            className="w-20 text-sm border-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                    {section.questions.length === 0 && (
                      <p className="ml-4 text-sm text-slate-400 italic">
                        No questions added yet
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateForm();
                  }}
                  className="border-slate-300 text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKit}
                  disabled={!newTitle || !newRole}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  Create Kit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kits.map((kit) => (
          <Card
            key={kit.id}
            className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{kit.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{kit.role}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`${getTypeBadgeColor(kit.type)} text-xs font-medium`}
                >
                  {kit.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {getQuestionCount(kit)} questions
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {kit.duration} min
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetail(kit)}
                  className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(kit)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Use in Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kit Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedKit && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <div>
                    <DialogTitle className="text-2xl text-slate-900">
                      {selectedKit.title}
                    </DialogTitle>
                    <p className="text-slate-500 mt-1">
                      {selectedKit.role} &middot; {selectedKit.duration} min &middot;{" "}
                      {getQuestionCount(selectedKit)} questions
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getTypeBadgeColor(selectedKit.type)} font-medium`}
                  >
                    {selectedKit.type}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {selectedKit.sections.map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <h3 className="text-lg font-semibold text-slate-800">
                        {section.name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ({section.questions.length}{" "}
                        {section.questions.length === 1 ? "question" : "questions"})
                      </span>
                    </div>
                    <div className="space-y-4 ml-4">
                      {section.questions.map((question, qIdx) => (
                        <div
                          key={question.id}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                                  {qIdx + 1}
                                </span>
                                <p className="font-medium text-slate-800">
                                  {question.text}
                                </p>
                              </div>
                            </div>
                            <span className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              {question.timeAllocation} min
                            </span>
                          </div>

                          {/* Expected Answer (collapsible) */}
                          <div className="mt-3 ml-8">
                            <button
                              onClick={() => toggleAnswer(question.id)}
                              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              <svg
                                className={`h-4 w-4 transition-transform ${
                                  expandedAnswers.has(question.id) ? "rotate-90" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              Expected Answer
                            </button>
                            {expandedAnswers.has(question.id) && (
                              <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-3 border border-slate-100">
                                {question.expectedAnswer}
                              </p>
                            )}
                          </div>

                          {/* Rubric */}
                          <div className="mt-3 ml-8">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              Rubric (1-5 Scale)
                            </p>
                            <div className="grid grid-cols-5 gap-1">
                              {question.rubric.map((r) => (
                                <div
                                  key={r.score}
                                  className="rounded border border-slate-200 bg-slate-50 p-2 text-center"
                                >
                                  <div
                                    className={`text-sm font-bold ${
                                      r.score <= 2
                                        ? "text-red-500"
                                        : r.score === 3
                                        ? "text-amber-500"
                                        : "text-emerald-500"
                                    }`}
                                  >
                                    {r.score}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                    {r.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-6 bg-slate-100" />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedKit)}
                  className="border-slate-300 text-slate-600"
                >
                  Download PDF
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Use in Interview
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
