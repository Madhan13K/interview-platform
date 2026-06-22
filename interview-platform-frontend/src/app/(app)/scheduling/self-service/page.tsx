"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { SELF_SERVICE_ENDPOINTS } from "@/lib/api-endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PreferredSlotResponse } from "@/types";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

interface SelectedSlot {
  day: number;
  hour: number;
}

function getNextWeekDate(dayIndex: number, hour: number): Date {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon...
  const targetDay = dayIndex + 1; // Convert 0=Mon to 1=Mon for getDay()
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-100 text-green-800 border-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-amber-100 text-amber-800 border-amber-300";
  }
}

export default function SelfServicePage() {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [existingSlots, setExistingSlots] = useState<PreferredSlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExistingSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<PreferredSlotResponse[]>(SELF_SERVICE_ENDPOINTS.getMySlots);
      setExistingSlots(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load your preferred slots";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingSlots();
  }, [fetchExistingSlots]);

  const toggleSlot = (day: number, hour: number) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.day === day && s.hour === hour);
      if (exists) {
        return prev.filter((s) => !(s.day === day && s.hour === hour));
      }
      return [...prev, { day, hour }];
    });
  };

  const isSlotSelected = (day: number, hour: number): boolean => {
    return selectedSlots.some((s) => s.day === day && s.hour === hour);
  };

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      setError("Please select at least one time slot");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const slots = selectedSlots.map((s) => {
        const start = getNextWeekDate(s.day, s.hour);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        return {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      });

      await api.post(SELF_SERVICE_ENDPOINTS.submitSlots, { slots });
      setSuccess(`Successfully submitted ${slots.length} preferred time slot(s)`);
      setSelectedSlots([]);
      await fetchExistingSlots();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit preferences";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      setDeletingId(slotId);
      await api.delete(SELF_SERVICE_ENDPOINTS.deleteSlot(slotId));
      setExistingSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete slot";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Select Your Preferred Time Slots</h1>
        <p className="mt-1 text-slate-600">
          Choose the times when you&apos;re available for interviews. Click on the calendar grid
          below to select or deselect time blocks, then submit your preferences.
        </p>
      </div>

      {/* Error / Success alerts */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Weekly Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Click on time blocks to select your preferred slots. Selected slots are highlighted in
            indigo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div className="text-xs font-medium text-slate-500" />
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-slate-700 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                  <div className="text-xs text-slate-500 flex items-center justify-end pr-2">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {DAYS_OF_WEEK.map((_, dayIndex) => {
                    const selected = isSlotSelected(dayIndex, hour);
                    return (
                      <button
                        key={`${dayIndex}-${hour}`}
                        type="button"
                        onClick={() => toggleSlot(dayIndex, hour)}
                        className={`h-10 rounded border transition-colors cursor-pointer ${
                          selected
                            ? "bg-indigo-500 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:bg-indigo-100 hover:border-indigo-300"
                        }`}
                        aria-label={`${DAYS_OF_WEEK[dayIndex]} ${hour}:00`}
                      >
                        {selected && (
                          <span className="text-xs font-medium">&#10003;</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""} selected
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedSlots.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? "Submitting..." : "Submit Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Submitted Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submitted Slots</CardTitle>
          <CardDescription>
            View the status of your previously submitted time preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span className="ml-2 text-sm text-slate-500">Loading your slots...</span>
            </div>
          ) : existingSlots.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              You haven&apos;t submitted any preferred slots yet.
            </p>
          ) : (
            <div className="space-y-3">
              {existingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusBadgeClass(slot.status)}>
                      {slot.status}
                    </Badge>
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">
                        {new Date(slot.startTime).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {" "}
                      {new Date(slot.startTime).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(slot.endTime).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {slot.note && (
                      <span className="text-xs text-slate-400 italic">{slot.note}</span>
                    )}
                  </div>
                  {slot.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      disabled={deletingId === slot.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {deletingId === slot.id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
