"use client";

import { useState } from "react";

interface EmailBlock {
  id: string;
  type: "header" | "text" | "button" | "image" | "divider" | "footer";
  content: string;
  styles?: Record<string, string>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  updatedAt: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Interview Invitation",
    subject: "You're Invited to Interview at {{company}}",
    blocks: [
      { id: "b1", type: "header", content: "Interview Invitation" },
      { id: "b2", type: "text", content: "Dear {{candidate_name}},\n\nWe are pleased to invite you for an interview for the {{position}} role. Please find the details below." },
      { id: "b3", type: "button", content: "Confirm Attendance" },
      { id: "b4", type: "footer", content: "Best regards,\n{{company}} Recruitment Team" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Interview Reminder",
    subject: "Reminder: Your Interview Tomorrow",
    blocks: [
      { id: "b5", type: "header", content: "Interview Reminder" },
      { id: "b6", type: "text", content: "Hi {{candidate_name}},\n\nThis is a friendly reminder that your interview is scheduled for tomorrow." },
      { id: "b7", type: "button", content: "View Details" },
      { id: "b8", type: "divider", content: "" },
      { id: "b9", type: "footer", content: "{{company}} HR Team" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Offer Letter",
    subject: "Congratulations! Your Offer from {{company}}",
    blocks: [
      { id: "b10", type: "header", content: "Congratulations!" },
      { id: "b11", type: "text", content: "Dear {{candidate_name}},\n\nWe are thrilled to extend an offer for the {{position}} role." },
      { id: "b12", type: "button", content: "Review Offer" },
      { id: "b13", type: "footer", content: "Welcome aboard!\n{{company}}" },
    ],
    updatedAt: new Date().toISOString(),
  },
];

const blockTypes: { type: EmailBlock["type"]; label: string; icon: string }[] = [
  { type: "header", label: "Header", icon: "H" },
  { type: "text", label: "Text", icon: "T" },
  { type: "button", label: "Button", icon: "B" },
  { type: "image", label: "Image", icon: "I" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "footer", label: "Footer", icon: "F" },
];

export default function EmailDesignerPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "desktop" | "mobile">("edit");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const addBlock = (type: EmailBlock["type"]) => {
    if (!activeTemplate) return;
    const defaults: Record<string, string> = {
      header: "New Heading",
      text: "Enter your text content here...",
      button: "Click Here",
      image: "",
      divider: "",
      footer: "Company Name | Address | Unsubscribe",
    };
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: defaults[type] || "",
    };
    const updated = {
      ...activeTemplate,
      blocks: [...activeTemplate.blocks, newBlock],
      updatedAt: new Date().toISOString(),
    };
    setActiveTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const updateBlock = (blockId: string, content: string) => {
    if (!activeTemplate) return;
    const updated = {
      ...activeTemplate,
      blocks: activeTemplate.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
      updatedAt: new Date().toISOString(),
    };
    setActiveTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const removeBlock = (blockId: string) => {
    if (!activeTemplate) return;
    const updated = {
      ...activeTemplate,
      blocks: activeTemplate.blocks.filter((b) => b.id !== blockId),
      updatedAt: new Date().toISOString(),
    };
    setActiveTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    if (!activeTemplate) return;
    const blocks = [...activeTemplate.blocks];
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (direction === "up" && idx > 0) {
      [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
    } else if (direction === "down" && idx < blocks.length - 1) {
      [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
    }
    const updated = { ...activeTemplate, blocks, updatedAt: new Date().toISOString() };
    setActiveTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const createTemplate = () => {
    const template: EmailTemplate = {
      id: Date.now().toString(),
      name: "Untitled Template",
      subject: "",
      blocks: [],
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [template, ...prev]);
    setActiveTemplate(template);
    setPreviewMode("edit");
  };

  const handleSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      localStorage.setItem("email-templates", JSON.stringify(templates));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  const handleSendTest = () => {
    alert(`Test email would be sent with subject: "${activeTemplate?.subject}"`);
  };

  const renderBlockPreview = (block: EmailBlock) => {
    switch (block.type) {
      case "header":
        return <h2 className="text-2xl font-bold text-gray-900">{block.content}</h2>;
      case "text":
        return <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{block.content}</p>;
      case "button":
        return (
          <div className="text-center py-2">
            <span className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium">
              {block.content}
            </span>
          </div>
        );
      case "image":
        return (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center text-gray-400 text-sm">
            Image Placeholder (600x200)
          </div>
        );
      case "divider":
        return <hr className="border-gray-200 my-2" />;
      case "footer":
        return <p className="text-xs text-gray-400 text-center whitespace-pre-wrap">{block.content}</p>;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <h1 className="text-lg font-bold text-gray-900">Email Template Designer</h1>
        <div className="flex items-center gap-3">
          {/* Preview Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(["edit", "desktop", "mobile"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  previewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          {/* Save Status */}
          {saveStatus === "saved" && <span className="text-xs text-green-600 font-medium">Saved!</span>}
          {saveStatus === "saving" && <span className="text-xs text-gray-400">Saving...</span>}
          <button
            onClick={handleSendTest}
            disabled={!activeTemplate}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Send Test
          </button>
          <button
            onClick={handleSave}
            disabled={!activeTemplate}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Template List Sidebar */}
        <div className="w-56 border-r bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <button
              onClick={createTemplate}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition mb-3"
            >
              + New Template
            </button>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Templates</h3>
            <div className="space-y-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTemplate(t); setPreviewMode("edit"); }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition ${
                    activeTemplate?.id === t.id
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "hover:bg-white text-gray-700 border border-transparent"
                  }`}
                >
                  <p className="font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.subject || "No subject"}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Block Toolbar (edit mode only) */}
        {previewMode === "edit" && activeTemplate && (
          <div className="w-48 border-r bg-white overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Content Blocks</h3>
              <div className="space-y-2">
                {blockTypes.map((bt) => (
                  <button
                    key={bt.type}
                    onClick={() => addBlock(bt.type)}
                    className="w-full flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition text-xs"
                  >
                    <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {bt.icon}
                    </span>
                    <span className="font-medium text-gray-700">{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {activeTemplate ? (
            <div className={`mx-auto ${previewMode === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
              {/* Subject Line Editor */}
              <div className="bg-white rounded-t-xl border border-b-0 px-6 py-4">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  value={activeTemplate.name}
                  onChange={(e) => {
                    const updated = { ...activeTemplate, name: e.target.value };
                    setActiveTemplate(updated);
                    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                  className="block w-full font-semibold text-gray-900 focus:outline-none mt-1"
                  placeholder="Template Name"
                  readOnly={previewMode !== "edit"}
                />
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 block">Subject Line</label>
                <input
                  type="text"
                  value={activeTemplate.subject}
                  onChange={(e) => {
                    const updated = { ...activeTemplate, subject: e.target.value };
                    setActiveTemplate(updated);
                    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                  className="block w-full text-sm text-gray-600 focus:outline-none mt-1"
                  placeholder="Enter email subject line..."
                  readOnly={previewMode !== "edit"}
                />
              </div>

              {/* Email Content */}
              <div className="bg-white rounded-b-xl border shadow-sm">
                <div className="p-6 space-y-4 min-h-[400px]">
                  {activeTemplate.blocks.map((block, idx) => (
                    <div key={block.id} className="group relative">
                      {previewMode === "edit" && (
                        <div className="absolute -left-10 top-0 hidden group-hover:flex flex-col gap-1">
                          <button
                            onClick={() => moveBlock(block.id, "up")}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-30"
                          >
                            &uarr;
                          </button>
                          <button
                            onClick={() => moveBlock(block.id, "down")}
                            disabled={idx === activeTemplate.blocks.length - 1}
                            className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-30"
                          >
                            &darr;
                          </button>
                        </div>
                      )}
                      {previewMode === "edit" && (
                        <button
                          onClick={() => removeBlock(block.id)}
                          className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] hidden group-hover:flex items-center justify-center hover:bg-red-600 z-10"
                        >
                          &times;
                        </button>
                      )}
                      {previewMode === "edit" ? (
                        <div className="border border-transparent group-hover:border-indigo-200 rounded-lg p-2 transition">
                          {(block.type === "header" || block.type === "text" || block.type === "button" || block.type === "footer") ? (
                            block.type === "text" || block.type === "footer" ? (
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                className={`w-full resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded p-1 ${
                                  block.type === "footer" ? "text-xs text-gray-400 text-center" : "text-sm text-gray-700"
                                }`}
                                rows={block.type === "footer" ? 2 : 3}
                              />
                            ) : (
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                className={`w-full focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded p-1 ${
                                  block.type === "header" ? "text-2xl font-bold" : "text-sm"
                                }`}
                              />
                            )
                          ) : (
                            renderBlockPreview(block)
                          )}
                          <span className="text-[9px] text-gray-300 uppercase mt-1 block">{block.type}</span>
                        </div>
                      ) : (
                        renderBlockPreview(block)
                      )}
                    </div>
                  ))}
                  {activeTemplate.blocks.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <p className="text-lg mb-1">Empty template</p>
                      <p className="text-sm">Add content blocks from the toolbar to start designing.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">No template selected</p>
                <p className="text-sm">Select a template from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
