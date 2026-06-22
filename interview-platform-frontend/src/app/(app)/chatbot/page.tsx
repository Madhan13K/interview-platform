"use client";

import { useState, useRef, useEffect } from "react";
import { aiService } from "@/services/ai.service";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const quickActions = [
  { label: "Suggest interview questions", action: "suggest_questions" },
  { label: "Parse a resume", action: "parse_resume" },
  { label: "Generate interview summary", action: "interview_summary" },
  { label: "View AI suggestions", action: "view_suggestions" },
];

const initialConversation: Conversation = {
  id: "1",
  title: "AI Assistant",
  messages: [
    {
      id: "1",
      role: "bot",
      content:
        "Hi! I'm your AI-powered interview assistant. I can help you with:\n\n- **Suggest Questions** - Generate tailored interview questions based on role and skills\n- **Parse Resume** - Extract structured data from resume text\n- **Interview Summary** - Generate a summary of an interview session\n- **View Suggestions** - Browse past AI-generated suggestions\n\nHow can I help you today?",
      timestamp: new Date(Date.now() - 3600000),
    },
  ],
  createdAt: new Date(Date.now() - 3600000),
};

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([initialConversation]);
  const [activeConversationId, setActiveConversationId] = useState("1");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId)!;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isTyping]);

  const addMessage = (role: "user" | "bot", content: string) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
    };
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    );
    return message;
  };

  const handleSuggestQuestions = async (userInput: string) => {
    addMessage("user", userInput);
    setInputValue("");
    setIsTyping(true);

    try {
      // Parse user input for role, skills, type
      const suggestions = await aiService.suggestQuestions({
        interviewType: "TECHNICAL",
        skills: userInput.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
        count: 5,
      });

      let responseText = "**Suggested Interview Questions:**\n\n";
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        suggestions.forEach((s, idx) => {
          const item = s as unknown as Record<string, unknown>;
          responseText += `${idx + 1}. ${item.content || JSON.stringify(s)}\n`;
          if (item.type) responseText += `   *Type: ${item.type}*\n`;
          responseText += "\n";
        });
        responseText += "\nWould you like me to suggest more questions or adjust the difficulty/type?";
      } else {
        responseText = "I generated some suggestions but received an unexpected format. Please try again with more specific details like the role title and required skills.";
      }

      addMessage("bot", responseText);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addMessage("bot", `I encountered an error generating suggestions: ${errMsg}\n\nPlease make sure the backend AI service is running and try again.`);
    } finally {
      setIsTyping(false);
      setActiveMode(null);
    }
  };

  const handleParseResume = async (resumeText: string) => {
    addMessage("user", `Parse this resume:\n\n${resumeText.substring(0, 200)}${resumeText.length > 200 ? "..." : ""}`);
    setInputValue("");
    setIsTyping(true);

    try {
      const result = await aiService.parseResume(resumeText);

      let responseText = "**Resume Parsing Results:**\n\n";
      if (result) {
        if (result.name) responseText += `**Name:** ${result.name}\n`;
        if (result.email) responseText += `**Email:** ${result.email}\n`;
        if (result.phone) responseText += `**Phone:** ${result.phone}\n`;
        if (result.skills && result.skills.length > 0)
          responseText += `**Skills:** ${result.skills.join(", ")}\n`;
        if (result.experience && result.experience.length > 0) {
          responseText += "\n**Experience:**\n";
          result.experience.forEach((exp) => {
            responseText += `- ${exp.role || "Role"} at ${exp.company || "Company"} (${exp.duration || "N/A"})\n`;
          });
        }
        if (result.education && result.education.length > 0) {
          responseText += "\n**Education:**\n";
          result.education.forEach((edu) => {
            responseText += `- ${edu.degree || "Degree"} - ${edu.institution || "Institution"} (${edu.year || "N/A"})\n`;
          });
        }
        responseText += "\nWould you like me to suggest interview questions based on this candidate's profile?";
      } else {
        responseText = "Resume parsed but no structured data was returned. Please try pasting more detailed resume text.";
      }

      addMessage("bot", responseText);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addMessage("bot", `I encountered an error parsing the resume: ${errMsg}\n\nPlease ensure the text contains valid resume content and try again.`);
    } finally {
      setIsTyping(false);
      setActiveMode(null);
    }
  };

  const handleInterviewSummary = async (interviewId: string) => {
    addMessage("user", `Generate summary for interview: ${interviewId}`);
    setInputValue("");
    setIsTyping(true);

    try {
      const rawResult = await aiService.generateInterviewSummary(interviewId.trim());
      const result = rawResult as Record<string, unknown>;

      let responseText = "**Interview Summary:**\n\n";
      if (result) {
        if (result.summary) responseText += result.summary + "\n\n";
        if (result.strengths) responseText += `**Strengths:** ${result.strengths}\n`;
        if (result.weaknesses) responseText += `**Areas for Improvement:** ${result.weaknesses}\n`;
        if (result.recommendation) responseText += `\n**Recommendation:** ${result.recommendation}\n`;
        if (result.overallScore) responseText += `**Overall Score:** ${result.overallScore}/5\n`;
      } else {
        responseText += "Summary generated successfully. Check the interview details page for the full report.";
      }

      addMessage("bot", responseText);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addMessage("bot", `I encountered an error generating the summary: ${errMsg}\n\nPlease verify the interview ID exists and has completed feedback.`);
    } finally {
      setIsTyping(false);
      setActiveMode(null);
    }
  };

  const handleViewSuggestions = async () => {
    addMessage("user", "Show my recent AI suggestions");
    setIsTyping(true);

    try {
      const result = await aiService.getSuggestions(0, 5);

      let responseText = "**Recent AI Suggestions:**\n\n";
      if (result.content && result.content.length > 0) {
        result.content.forEach((s, idx) => {
          responseText += `${idx + 1}. **${s.type || "Suggestion"}** (${s.status || "pending"})\n`;
          if (s.content) responseText += `   ${s.content.substring(0, 100)}...\n`;
          responseText += "\n";
        });
        responseText += `\nShowing ${result.content.length} of ${result.totalElements} total suggestions.`;
      } else {
        responseText = "No AI suggestions found yet. Try generating some interview questions or parsing a resume first!";
      }

      addMessage("bot", responseText);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addMessage("bot", `Could not fetch suggestions: ${errMsg}`);
    } finally {
      setIsTyping(false);
      setActiveMode(null);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "suggest_questions":
        setActiveMode("suggest_questions");
        addMessage("bot", "What role and skills should I generate questions for? For example:\n\n*\"Senior React Developer with TypeScript and Node.js experience\"*\n\nType the role description or required skills:");
        break;
      case "parse_resume":
        setActiveMode("parse_resume");
        addMessage("bot", "Please paste the resume text you'd like me to parse. I'll extract structured information including name, contact details, skills, experience, and education.");
        break;
      case "interview_summary":
        setActiveMode("interview_summary");
        addMessage("bot", "Please provide the Interview ID for which you'd like me to generate a summary. You can find the ID on the interview details page.");
        break;
      case "view_suggestions":
        handleViewSuggestions();
        break;
    }
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    if (activeMode === "suggest_questions") {
      handleSuggestQuestions(content);
    } else if (activeMode === "parse_resume") {
      handleParseResume(content);
    } else if (activeMode === "interview_summary") {
      handleInterviewSummary(content);
    } else {
      // Detect intent from free-form text
      const lower = content.toLowerCase();
      if (lower.includes("suggest") || lower.includes("question") || lower.includes("generate question")) {
        handleSuggestQuestions(content);
      } else if (lower.includes("resume") || lower.includes("parse") || lower.includes("cv")) {
        handleParseResume(content);
      } else if (lower.includes("summary") || lower.includes("summarize") || lower.includes("summarise")) {
        addMessage("user", content);
        setInputValue("");
        setActiveMode("interview_summary");
        addMessage("bot", "I'd be happy to generate an interview summary. Please provide the Interview ID:");
      } else {
        // General fallback - try question suggestion with the input as context
        addMessage("user", content);
        setInputValue("");
        addMessage(
          "bot",
          "I can help you with the following actions:\n\n" +
            "1. **Suggest Questions** - Say something like \"suggest questions for a backend engineer\"\n" +
            "2. **Parse Resume** - Say \"parse resume\" and paste the text\n" +
            "3. **Interview Summary** - Say \"generate summary\" with an interview ID\n" +
            "4. **View Suggestions** - Say \"show my suggestions\"\n\n" +
            "Or use the quick action buttons below!"
        );
      }
    }
  };

  const startNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: Date.now().toString() + "-welcome",
          role: "bot",
          content: "Hi! How can I help you today? You can ask me to suggest interview questions, parse a resume, or generate an interview summary.",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
    setActiveMode(null);
  };

  const formatMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
      if (line.startsWith("# ")) {
        return <h3 key={idx} className="text-lg font-bold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />;
      }
      if (line.startsWith("- ")) {
        return <li key={idx} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={idx} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, "") }} />;
      }
      if (line.trim() === "") {
        return <br key={idx} />;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Left Panel - Conversation History */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                setActiveMode(null);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                activeConversationId === conv.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
            >
              <p className="truncate font-medium">{conv.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {conv.createdAt.toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
        {/* AI powered badge */}
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            Powered by AI Backend
          </p>
          <p className="text-xs text-slate-600 text-center mt-0.5">
            /api/v1/ai/*
          </p>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
          <h2 className="text-white font-medium">AI Interview Assistant</h2>
          {activeMode && (
            <span className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-xs font-medium">
              Mode: {activeMode.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeConversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-100"
                }`}
              >
                <div className="text-sm leading-relaxed space-y-1">
                  {message.role === "bot" ? formatMessage(message.content) : <p>{message.content}</p>}
                </div>
                <p className={`text-xs mt-2 ${message.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="bg-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.action}
                onClick={() => handleAction(qa.action)}
                disabled={isTyping}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-full text-xs font-medium hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              placeholder={
                activeMode === "suggest_questions"
                  ? "Enter role/skills (e.g., Senior React Developer)..."
                  : activeMode === "parse_resume"
                  ? "Paste resume text here..."
                  : activeMode === "interview_summary"
                  ? "Enter interview ID..."
                  : "Type your message..."
              }
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
