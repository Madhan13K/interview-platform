"use client";

import { useState, useEffect } from "react";
import { talentCommunityService } from "@/services/talent-community.service";

interface Member {
  id: string;
  name: string;
  email: string;
  interests: string[];
  joinedAt: string;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  attendees: number;
}

export default function TalentCommunityPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "events">("members");

  useEffect(() => {
    Promise.all([
      talentCommunityService.getMembers().catch(() => []),
      talentCommunityService.getEvents().catch(() => []),
    ]).then(([m, e]) => {
      setMembers(m || []);
      setEvents(e || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading talent community...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Talent Community</h1>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{members.length}</p>
          <p className="text-sm text-slate-500">Total Members</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{events.length}</p>
          <p className="text-sm text-slate-500">Events</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {events.reduce((sum, e) => sum + e.attendees, 0)}
          </p>
          <p className="text-sm text-slate-500">Total Registrations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "members" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "events" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Events
        </button>
      </div>

      {/* Members List */}
      {activeTab === "members" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="divide-y">
            {members.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.email}</p>
                </div>
                <div className="flex gap-1">
                  {m.interests.map((i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{i}</span>
                  ))}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-12 text-slate-400">No members yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Events Grid */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <div key={e.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {e.type}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(e.date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{e.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{e.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{e.attendees} registered</span>
                <button
                  onClick={() => talentCommunityService.register(e.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Register
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">No events scheduled.</div>
          )}
        </div>
      )}
    </div>
  );
}
