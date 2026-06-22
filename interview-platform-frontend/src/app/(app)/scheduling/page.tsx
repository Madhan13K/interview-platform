"use client";

import { useState, useEffect } from "react";
import { schedulingService } from "@/services/scheduling.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AvailabilitySlot, CreateAvailabilityRequest, TimeSuggestion } from "@/types";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-indigo-100 border-indigo-300 text-indigo-800",
  Tuesday: "bg-sky-100 border-sky-300 text-sky-800",
  Wednesday: "bg-emerald-100 border-emerald-300 text-emerald-800",
  Thursday: "bg-amber-100 border-amber-300 text-amber-800",
  Friday: "bg-rose-100 border-rose-300 text-rose-800",
  Saturday: "bg-purple-100 border-purple-300 text-purple-800",
  Sunday: "bg-slate-100 border-slate-300 text-slate-800",
};

export default function SchedulingPage() {
  // Availability state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add availability form state
  const [dayOfWeek, setDayOfWeek] = useState<string>("Monday");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [recurring, setRecurring] = useState<boolean>(true);
  const [specificDate, setSpecificDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Smart scheduling state
  const [interviewerIds, setInterviewerIds] = useState<string>("");
  const [candidateId, setCandidateId] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([]);
  const [findingSlots, setFindingSlots] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    setLoadingSlots(true);
    setError(null);
    try {
      const data = await schedulingService.getMyAvailability();
      setSlots(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load availability slots.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleDeleteSlot(slotId: string) {
    setDeletingSlotId(slotId);
    try {
      await schedulingService.deleteSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete slot.");
    } finally {
      setDeletingSlotId(null);
    }
  }

  async function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const request: CreateAvailabilityRequest = {
        dayOfWeek,
        startTime,
        endTime,
        recurring,
        specificDate: recurring ? undefined : specificDate || undefined,
      };
      await schedulingService.addAvailability(request);
      setFormSuccess("Availability slot added successfully.");
      await fetchAvailability();
    } catch (err: any) {
      setFormError(err?.message || "Failed to add availability.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFindSlots(e: React.FormEvent) {
    e.preventDefault();
    setScheduleError(null);
    setSuggestions([]);
    setFindingSlots(true);

    try {
      const ids = interviewerIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (ids.length === 0) {
        throw new Error("Please provide at least one interviewer ID.");
      }
      if (!candidateId.trim()) {
        throw new Error("Please provide a candidate ID.");
      }
      if (!dateRangeStart || !dateRangeEnd) {
        throw new Error("Please provide both start and end dates.");
      }

      const data = await schedulingService.suggestTimeSlots({
        interviewerIds: ids,
        candidateId: candidateId.trim(),
        duration,
        dateRange: { start: dateRangeStart, end: dateRangeEnd },
      });
      setSuggestions(data);
    } catch (err: any) {
      setScheduleError(err?.message || "Failed to find available slots.");
    } finally {
      setFindingSlots(false);
    }
  }

  // Group slots by day for the week view
  const slotsByDay: Record<string, AvailabilitySlot[]> = {};
  DAYS_OF_WEEK.forEach((day) => {
    slotsByDay[day] = slots.filter((s) => s.dayOfWeek === day);
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Scheduling &amp; Availability
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your availability windows and use smart scheduling to find
          optimal interview times across participants.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* My Availability Section */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">
          My Availability
        </h2>

        {loadingSlots ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading availability...
          </div>
        ) : slots.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No availability slots set. Add your first slot below.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex flex-col">
                <div className="mb-2 text-center text-sm font-medium text-slate-700">
                  {day}
                </div>
                <div className="flex min-h-[120px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  {slotsByDay[day].length === 0 ? (
                    <span className="mt-auto mb-auto text-center text-xs text-slate-400">
                      No slots
                    </span>
                  ) : (
                    slotsByDay[day].map((slot) => (
                      <div
                        key={slot.id}
                        className={`group relative rounded-md border p-2 text-xs ${DAY_COLORS[day]}`}
                      >
                        <div className="font-medium">
                          {slot.startTime} – {slot.endTime}
                        </div>
                        {slot.recurring && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-[10px]"
                          >
                            Recurring
                          </Badge>
                        )}
                        {slot.specificDate && (
                          <div className="mt-1 text-[10px] opacity-75">
                            {slot.specificDate}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={deletingSlotId === slot.id}
                          className="absolute top-1 right-1 hidden h-5 w-5 items-center justify-center rounded bg-red-500 text-[10px] text-white transition hover:bg-red-600 group-hover:flex disabled:opacity-50"
                          title="Delete slot"
                        >
                          {deletingSlotId === slot.id ? "..." : "×"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Availability Form */}
      <section className="mb-10">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">
              Add Availability
            </CardTitle>
            <CardDescription>
              Define a new time window when you are available for interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAvailability} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Day of Week */}
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>

                {/* Specific Date (conditional) */}
                {!recurring && (
                  <div className="space-y-2">
                    <Label htmlFor="specificDate">Specific Date</Label>
                    <Input
                      id="specificDate"
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Recurring Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="recurring"
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="recurring" className="cursor-pointer text-sm">
                  Recurring weekly
                </Label>
              </div>

              {/* Messages */}
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              {formSuccess && (
                <p className="text-sm text-emerald-600">{formSuccess}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding...
                  </span>
                ) : (
                  "Add Availability"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Smart Scheduling Section */}
      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">
              Smart Scheduling
            </CardTitle>
            <CardDescription>
              Find optimal time slots that work for all participants based on
              their availability and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFindSlots} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Interviewer IDs */}
                <div className="space-y-2">
                  <Label htmlFor="interviewerIds">
                    Interviewer IDs (comma separated)
                  </Label>
                  <Input
                    id="interviewerIds"
                    type="text"
                    placeholder="id1, id2, id3"
                    value={interviewerIds}
                    onChange={(e) => setInterviewerIds(e.target.value)}
                    required
                  />
                </div>

                {/* Candidate ID */}
                <div className="space-y-2">
                  <Label htmlFor="candidateId">Candidate ID</Label>
                  <Input
                    id="candidateId"
                    type="text"
                    placeholder="candidate-uuid"
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    required
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    max={480}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Date Range Start */}
                <div className="space-y-2">
                  <Label htmlFor="dateRangeStart">Date Range Start</Label>
                  <Input
                    id="dateRangeStart"
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    required
                  />
                </div>

                {/* Date Range End */}
                <div className="space-y-2">
                  <Label htmlFor="dateRangeEnd">Date Range End</Label>
                  <Input
                    id="dateRangeEnd"
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {scheduleError && (
                <p className="text-sm text-red-600">{scheduleError}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={findingSlots}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {findingSlots ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Finding Slots...
                  </span>
                ) : (
                  "Find Slots"
                )}
              </Button>
            </form>

            {/* Suggestions Results */}
            {suggestions.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Suggested Time Slots
                </h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800">
                          {new Date(suggestion.startTime).toLocaleString()} –{" "}
                          {new Date(suggestion.endTime).toLocaleString()}
                        </span>
                        {suggestion.interviewerIds && suggestion.interviewerIds.length > 0 && (
                          <span className="text-xs text-slate-500">
                            Participants: {suggestion.interviewerIds.join(", ")}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={
                          suggestion.score >= 0.8
                            ? "default"
                            : suggestion.score >= 0.5
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          suggestion.score >= 0.8
                            ? "bg-emerald-100 text-emerald-800"
                            : suggestion.score >= 0.5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }
                      >
                        Score: {Math.round(suggestion.score * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results state */}
            {!findingSlots &&
              suggestions.length === 0 &&
              !scheduleError &&
              dateRangeStart &&
              dateRangeEnd && (
                <p className="mt-4 text-sm text-slate-500">
                  No suggestions yet. Fill out the form and click &quot;Find
                  Slots&quot; to discover available times.
                </p>
              )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
