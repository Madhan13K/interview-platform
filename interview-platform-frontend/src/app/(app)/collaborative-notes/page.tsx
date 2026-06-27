"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Participant {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  lastSeen: string;
}

interface NoteVersion {
  id: string;
  content: string;
  editedBy: string;
  timestamp: string;
}

interface Note {
  id: string;
  interviewId: string;
  title: string;
  content: string;
  updatedAt: string;
  participants: Participant[];
  versions: NoteVersion[];
}

interface Interview {
  id: string;
  title: string;
  candidateName: string;
  date: string;
}

const mockInterviews: Interview[] = [
  { id: "int-1", title: "Frontend Developer", candidateName: "Alice Johnson", date: "2024-01-15" },
  { id: "int-2", title: "Backend Engineer", candidateName: "Bob Smith", date: "2024-01-16" },
  { id: "int-3", title: "Product Manager", candidateName: "Carol Davis", date: "2024-01-17" },
  { id: "int-4", title: "UX Designer", candidateName: "Dave Wilson", date: "2024-01-18" },
];

const mockParticipants: Participant[] = [
  { id: "u1", name: "You", color: "#6366f1", isActive: true, lastSeen: new Date().toISOString() },
  { id: "u2", name: "Sarah Kim", color: "#ec4899", isActive: true, lastSeen: new Date().toISOString() },
  { id: "u3", name: "Mike Chen", color: "#f59e0b", isActive: false, lastSeen: new Date(Date.now() - 300000).toISOString() },
];

export default function CollaborativeNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load notes for selected interview
  useEffect(() => {
    if (!selectedInterview) {
      setNotes([]);
      setActiveNote(null);
      return;
    }
    // Simulate loading notes
    const mockNotes: Note[] = [
      {
        id: `note-${selectedInterview}-1`,
        interviewId: selectedInterview,
        title: "Technical Assessment Notes",
        content: "## Technical Assessment\n\n- Candidate demonstrated strong knowledge of React hooks\n- Good understanding of state management patterns\n- Could improve on system design explanations\n\n### Questions Asked\n1. Explain the difference between useMemo and useCallback\n2. Design a real-time notification system\n3. Implement a debounce function",
        updatedAt: new Date().toISOString(),
        participants: mockParticipants,
        versions: [
          { id: "v1", content: "Initial notes", editedBy: "You", timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: "v2", content: "Added technical questions", editedBy: "Sarah Kim", timestamp: new Date(Date.now() - 1800000).toISOString() },
        ],
      },
      {
        id: `note-${selectedInterview}-2`,
        interviewId: selectedInterview,
        title: "Behavioral Assessment",
        content: "## Behavioral Notes\n\n- Strong communication skills\n- Provided clear STAR format responses\n- Shows good team collaboration experience",
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        participants: [mockParticipants[0], mockParticipants[2]],
        versions: [
          { id: "v3", content: "Initial behavioral notes", editedBy: "You", timestamp: new Date(Date.now() - 86400000).toISOString() },
        ],
      },
    ];
    setNotes(mockNotes);
    setActiveNote(mockNotes[0]);
    setContent(mockNotes[0].content);
  }, [selectedInterview]);

  // Auto-save with debounce
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      // Simulate save
      setTimeout(() => {
        if (activeNote) {
          const updated = { ...activeNote, content: newContent, updatedAt: new Date().toISOString() };
          setActiveNote(updated);
          setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        }
        setSaveStatus("saved");
      }, 500);
    }, 1000);
  }, [activeNote]);

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setContent(note.content);
    setSaveStatus("saved");
    setShowHistory(false);
  };

  const handleCreateNote = () => {
    if (!selectedInterview) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      interviewId: selectedInterview,
      title: "New Note",
      content: "",
      updatedAt: new Date().toISOString(),
      participants: [mockParticipants[0]],
      versions: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNote(newNote);
    setContent("");
    setSaveStatus("saved");
    textareaRef.current?.focus();
  };

  const handleRestoreVersion = (version: NoteVersion) => {
    setContent(version.content);
    setSaveStatus("unsaved");
    setShowHistory(false);
  };

  const filteredNotes = notes.filter(
    (n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveStatusDisplay = {
    saved: { text: "All changes saved", color: "text-green-600", bg: "bg-green-50" },
    saving: { text: "Saving...", color: "text-yellow-600", bg: "bg-yellow-50" },
    unsaved: { text: "Unsaved changes", color: "text-orange-600", bg: "bg-orange-50" },
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Collaborative Notes</h1>
          {/* Interview Selector */}
          <select
            value={selectedInterview}
            onChange={(e) => setSelectedInterview(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[250px]"
          >
            <option value="">Select an interview...</option>
            {mockInterviews.map((interview) => (
              <option key={interview.id} value={interview.id}>
                {interview.candidateName} - {interview.title} ({interview.date})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${saveStatusDisplay[saveStatus].color} ${saveStatusDisplay[saveStatus].bg}`}>
            {saveStatusDisplay[saveStatus].text}
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition ${
              showHistory ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Notes List Sidebar */}
        <div className="w-64 border-r bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <button
              onClick={handleCreateNote}
              disabled={!selectedInterview}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition mb-3"
            >
              + New Note
            </button>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-3"
            />
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    activeNote?.id === note.id
                      ? "bg-indigo-100 border border-indigo-200"
                      : "hover:bg-white border border-transparent"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-900 truncate">{note.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">{note.content.slice(0, 60) || "Empty note"}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {note.participants.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="w-4 h-4 rounded-full border border-white text-[8px] flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      >
                        {p.name.charAt(0)}
                      </div>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
              {filteredNotes.length === 0 && selectedInterview && (
                <p className="text-xs text-gray-400 text-center py-4">No notes found.</p>
              )}
              {!selectedInterview && (
                <p className="text-xs text-gray-400 text-center py-4">Select an interview to view notes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeNote ? (
            <div className="flex-1 flex flex-col">
              {/* Note Title */}
              <div className="px-6 py-3 border-b bg-white flex-shrink-0">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => {
                    const updated = { ...activeNote, title: e.target.value };
                    setActiveNote(updated);
                    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                  }}
                  className="text-lg font-semibold text-gray-900 w-full focus:outline-none"
                  placeholder="Note title..."
                />
              </div>
              {/* Textarea Editor */}
              <div className="flex-1 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-800 leading-relaxed"
                  placeholder="Start typing your notes here... (Markdown supported)"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">No note selected</p>
                <p className="text-sm">
                  {selectedInterview ? "Select a note or create a new one." : "Select an interview first."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Participants / History Sidebar */}
        <div className="w-56 border-l bg-white overflow-y-auto flex-shrink-0">
          <div className="p-3">
            {!showHistory ? (
              <>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Participants ({activeNote?.participants.length || 0})
                </h3>
                <div className="space-y-2">
                  {activeNote?.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name.charAt(0)}
                        </div>
                        {p.isActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {p.isActive ? "Editing now" : `Last seen ${new Date(p.lastSeen).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {!activeNote && (
                  <p className="text-xs text-gray-400 text-center py-4">No active note.</p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Version History
                </h3>
                <div className="space-y-2">
                  {activeNote?.versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => handleRestoreVersion(version)}
                      className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition"
                    >
                      <p className="text-xs font-medium text-gray-700 truncate">{version.content.slice(0, 40)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">{version.editedBy}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(version.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </button>
                  ))}
                  {(!activeNote?.versions || activeNote.versions.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-4">No version history.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
