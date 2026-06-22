"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: "text" | "file";
  fileName?: string;
}

interface Conversation {
  id: string;
  type: "direct" | "group" | "interview";
  name: string;
  avatarInitials: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
  participants?: string[];
  interviewId?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = "user-1";
const CURRENT_USER_NAME = "You";

const mockContacts: Contact[] = [
  { id: "user-2", name: "Sarah Chen", role: "Senior Engineer", email: "sarah.chen@company.com", avatarInitials: "SC", avatarColor: "bg-indigo-500" },
  { id: "user-3", name: "Michael Torres", role: "Candidate", email: "michael.t@email.com", avatarInitials: "MT", avatarColor: "bg-emerald-500" },
  { id: "user-4", name: "Emily Zhang", role: "Hiring Manager", email: "emily.z@company.com", avatarInitials: "EZ", avatarColor: "bg-purple-500" },
  { id: "user-5", name: "James Wilson", role: "Recruiter", email: "james.w@company.com", avatarInitials: "JW", avatarColor: "bg-amber-500" },
  { id: "user-6", name: "Priya Patel", role: "Candidate", email: "priya.p@email.com", avatarInitials: "PP", avatarColor: "bg-rose-500" },
];

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    type: "direct",
    name: "Sarah Chen",
    avatarInitials: "SC",
    avatarColor: "bg-indigo-500",
    lastMessage: "I'll review the candidate's profile today",
    lastMessageTime: "2 min ago",
    unreadCount: 2,
    online: true,
  },
  {
    id: "conv-2",
    type: "group",
    name: "Frontend Hiring Team",
    avatarInitials: "FH",
    avatarColor: "bg-purple-500",
    lastMessage: "Emily: Let's sync on the pipeline status",
    lastMessageTime: "15 min ago",
    unreadCount: 5,
    participants: ["Sarah Chen", "Emily Zhang", "James Wilson"],
  },
  {
    id: "conv-3",
    type: "interview",
    name: "Interview: Michael Torres",
    avatarInitials: "MT",
    avatarColor: "bg-emerald-500",
    lastMessage: "Feedback submitted. Moving to next round.",
    lastMessageTime: "1 hr ago",
    unreadCount: 0,
    interviewId: "int-101",
  },
  {
    id: "conv-4",
    type: "direct",
    name: "Priya Patel",
    avatarInitials: "PP",
    avatarColor: "bg-rose-500",
    lastMessage: "Thank you for the opportunity!",
    lastMessageTime: "3 hrs ago",
    unreadCount: 0,
    online: false,
  },
  {
    id: "conv-5",
    type: "direct",
    name: "James Wilson",
    avatarInitials: "JW",
    avatarColor: "bg-amber-500",
    lastMessage: "Offer letter is ready for approval",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    online: true,
  },
];

const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    { id: "m1", senderId: "user-2", senderName: "Sarah Chen", content: "Hey! Did you get a chance to look at the new candidate applications?", timestamp: "10:30 AM", read: true, type: "text" },
    { id: "m2", senderId: CURRENT_USER_ID, senderName: CURRENT_USER_NAME, content: "Yes, I shortlisted 3 candidates for the frontend role. Their profiles look strong.", timestamp: "10:32 AM", read: true, type: "text" },
    { id: "m3", senderId: "user-2", senderName: "Sarah Chen", content: "Great! Can you share the shortlist? I'd like to review their technical backgrounds.", timestamp: "10:33 AM", read: true, type: "text" },
    { id: "m4", senderId: CURRENT_USER_ID, senderName: CURRENT_USER_NAME, content: "Sure, I've attached the summary document.", timestamp: "10:35 AM", read: true, type: "file", fileName: "shortlist-summary.pdf" },
    { id: "m5", senderId: "user-2", senderName: "Sarah Chen", content: "Perfect. I'll review the candidate's profile today", timestamp: "10:45 AM", read: false, type: "text" },
    { id: "m6", senderId: "user-2", senderName: "Sarah Chen", content: "Also, should we schedule a debrief for Thursday?", timestamp: "10:46 AM", read: false, type: "text" },
  ],
  "conv-2": [
    { id: "m7", senderId: "user-4", senderName: "Emily Zhang", content: "Team, let's review our hiring pipeline this week.", timestamp: "9:00 AM", read: true, type: "text" },
    { id: "m8", senderId: "user-5", senderName: "James Wilson", content: "I have 5 new applications that came in from the job board.", timestamp: "9:05 AM", read: true, type: "text" },
    { id: "m9", senderId: CURRENT_USER_ID, senderName: CURRENT_USER_NAME, content: "I'll take a look at them this afternoon and add notes.", timestamp: "9:10 AM", read: true, type: "text" },
    { id: "m10", senderId: "user-2", senderName: "Sarah Chen", content: "I've completed technical assessments for 2 candidates. Both scored well.", timestamp: "9:30 AM", read: true, type: "text" },
    { id: "m11", senderId: "user-4", senderName: "Emily Zhang", content: "Let's sync on the pipeline status", timestamp: "9:45 AM", read: false, type: "text" },
  ],
  "conv-3": [
    { id: "m12", senderId: "user-2", senderName: "Sarah Chen", content: "Interview with Michael Torres completed. Strong technical skills.", timestamp: "Yesterday", read: true, type: "text" },
    { id: "m13", senderId: CURRENT_USER_ID, senderName: CURRENT_USER_NAME, content: "How was the culture fit portion?", timestamp: "Yesterday", read: true, type: "text" },
    { id: "m14", senderId: "user-2", senderName: "Sarah Chen", content: "Very positive. He communicated clearly and showed enthusiasm.", timestamp: "Yesterday", read: true, type: "text" },
    { id: "m15", senderId: "user-4", senderName: "Emily Zhang", content: "Feedback submitted. Moving to next round.", timestamp: "Yesterday", read: true, type: "text" },
  ],
  "conv-4": [
    { id: "m16", senderId: CURRENT_USER_ID, senderName: CURRENT_USER_NAME, content: "Hi Priya, congratulations on passing the first round! We'd like to schedule your technical interview.", timestamp: "Yesterday", read: true, type: "text" },
    { id: "m17", senderId: "user-6", senderName: "Priya Patel", content: "Thank you for the opportunity! I'm available next Tuesday or Wednesday.", timestamp: "Yesterday", read: true, type: "text" },
  ],
  "conv-5": [
    { id: "m18", senderId: "user-5", senderName: "James Wilson", content: "The compensation package for the senior frontend role has been finalized.", timestamp: "Yesterday", read: true, type: "text" },
    { id: "m19", senderId: "user-5", senderName: "James Wilson", content: "Offer letter is ready for approval", timestamp: "Yesterday", read: false, type: "text" },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;
  const currentMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = mockContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(composeSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(composeSearch.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  function handleSelectConversation(convId: string) {
    setSelectedConversationId(convId);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  }

  function handleSendMessage() {
    if (!messageInput.trim() || !selectedConversationId) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "text",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId
          ? { ...c, lastMessage: messageInput.trim(), lastMessageTime: "Just now" }
          : c
      )
    );

    setMessageInput("");
  }

  function handleStartConversation(contact: Contact) {
    const existingConv = conversations.find(
      (c) => c.type === "direct" && c.name === contact.name
    );
    if (existingConv) {
      setSelectedConversationId(existingConv.id);
    } else {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        type: "direct",
        name: contact.name,
        avatarInitials: contact.avatarInitials,
        avatarColor: contact.avatarColor,
        lastMessage: "",
        lastMessageTime: "Now",
        unreadCount: 0,
        online: true,
      };
      setConversations((prev) => [newConv, ...prev]);
      setMessages((prev) => ({ ...prev, [newConv.id]: [] }));
      setSelectedConversationId(newConv.id);
    }
    setShowComposeDialog(false);
    setComposeSearch("");
  }

  function getConversationTypeBadge(type: Conversation["type"]) {
    switch (type) {
      case "direct":
        return null;
      case "group":
        return <Badge variant="purple" className="text-[10px] px-1.5 py-0">Group</Badge>;
      case "interview":
        return <Badge variant="info" className="text-[10px] px-1.5 py-0">Interview</Badge>;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Left Panel - Conversation List */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
            <Button
              size="sm"
              onClick={() => setShowComposeDialog(true)}
              className="h-8 w-8 p-0"
              title="New message"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-slate-100 ${
                selectedConversationId === conv.id ? "bg-indigo-50 border-r-2 border-indigo-500" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`h-10 w-10 rounded-full ${conv.avatarColor} flex items-center justify-center text-white text-xs font-medium`}>
                  {conv.avatarInitials}
                </div>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-slate-900 truncate">{conv.name}</span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{conv.lastMessageTime}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {getConversationTypeBadge(conv.type)}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
              </div>

              {/* Unread Badge */}
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 h-5 min-w-[20px] rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Center Panel - Message Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full ${selectedConversation.avatarColor} flex items-center justify-center text-white text-xs font-medium`}>
                  {selectedConversation.avatarInitials}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{selectedConversation.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedConversation.online ? (
                      <span className="text-emerald-600">Online</span>
                    ) : selectedConversation.type === "group" ? (
                      `${selectedConversation.participants?.length || 0} members`
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  title="Toggle details panel"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/30">
              {currentMessages.map((msg, idx) => {
                const isSent = msg.senderId === CURRENT_USER_ID;
                const showTimeSeparator =
                  idx === 0 ||
                  currentMessages[idx - 1].timestamp !== msg.timestamp;

                return (
                  <div key={msg.id}>
                    {showTimeSeparator && idx > 0 && currentMessages[idx - 1].timestamp !== msg.timestamp && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isSent ? "order-2" : ""}`}>
                        {!isSent && (
                          <span className="text-[10px] text-slate-500 ml-1 mb-0.5 block">
                            {msg.senderName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            isSent
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm"
                          }`}
                        >
                          {msg.type === "file" ? (
                            <div className="flex items-center gap-2">
                              <svg className={`h-4 w-4 flex-shrink-0 ${isSent ? "text-indigo-200" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="underline">{msg.fileName}</span>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                          {isSent && msg.read && (
                            <svg className="h-3 w-3 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m0 0l4-4m-4 4L9 4" />
                            </svg>
                          )}
                          {isSent && !msg.read && (
                            <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator Placeholder */}
            {selectedConversation.online && (
              <div className="px-5 py-1">
                <span className="text-xs text-slate-400 italic">
                  {/* Typing indicator would show here */}
                </span>
              </div>
            )}

            {/* Message Input */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" title="Attach file">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" title="Emoji">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-slate-50/30">
            <div className="text-center max-w-sm">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No conversation selected</h3>
              <p className="text-sm text-slate-500 mb-4">
                Choose a conversation from the left panel or start a new one.
              </p>
              <Button size="sm" onClick={() => setShowComposeDialog(true)}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Contact Details (Collapsible) */}
      {showRightPanel && selectedConversation && (
        <div className="w-64 border-l border-slate-200 flex flex-col bg-white overflow-y-auto">
          {/* Contact Info */}
          <div className="p-4 border-b border-slate-200 text-center">
            <div className={`mx-auto h-16 w-16 rounded-full ${selectedConversation.avatarColor} flex items-center justify-center text-white text-lg font-semibold mb-3`}>
              {selectedConversation.avatarInitials}
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{selectedConversation.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedConversation.type === "direct"
                ? mockContacts.find((c) => c.name === selectedConversation.name)?.role || "Team Member"
                : selectedConversation.type === "group"
                ? "Group Chat"
                : "Interview Channel"}
            </p>
            {selectedConversation.online && (
              <Badge variant="success" className="mt-2 text-[10px]">Online</Badge>
            )}
          </div>

          {/* Participants (for groups) */}
          {selectedConversation.type === "group" && selectedConversation.participants && (
            <div className="p-4 border-b border-slate-200">
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Members</h5>
              <div className="space-y-2">
                {selectedConversation.participants.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600">
                      {name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-xs text-slate-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Files */}
          <div className="p-4 border-b border-slate-200">
            <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Shared Files</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <svg className="h-4 w-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">shortlist-summary.pdf</p>
                  <p className="text-[10px] text-slate-400">245 KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <svg className="h-4 w-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">resume-michael.pdf</p>
                  <p className="text-[10px] text-slate-400">1.2 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Link */}
          {selectedConversation.type === "interview" && selectedConversation.interviewId && (
            <div className="p-4">
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Interview</h5>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Interview Details
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 mt-auto">
            <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Actions</h5>
            <div className="space-y-1.5">
              <button className="w-full text-left text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                Mute notifications
              </button>
              <button className="w-full text-left text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                Search in conversation
              </button>
              <button className="w-full text-left text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                Delete conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose New Message Dialog */}
      {showComposeDialog && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowComposeDialog(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative z-50 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">New Message</h3>
                <button
                  onClick={() => setShowComposeDialog(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Input
                placeholder="Search contacts..."
                value={composeSearch}
                onChange={(e) => setComposeSearch(e.target.value)}
                className="mb-3"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`h-9 w-9 rounded-full ${contact.avatarColor} flex items-center justify-center text-white text-xs font-medium`}>
                      {contact.avatarInitials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.role} &middot; {contact.email}</p>
                    </div>
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No contacts found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
