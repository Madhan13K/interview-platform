"use client";

import { useEffect, useState, useCallback } from "react";
import { interviewService } from "@/services/interview.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InterviewResponse, InterviewType } from "@/types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeBadgeStyles: Record<InterviewType, string> = {
  TECHNICAL: "bg-purple-100 text-purple-800 border-purple-200",
  BEHAVIORAL: "bg-sky-100 text-sky-800 border-sky-200",
  SYSTEM_DESIGN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CODING: "bg-emerald-100 text-emerald-800 border-emerald-200",
  HR: "bg-pink-100 text-pink-800 border-pink-200",
  CASE_STUDY: "bg-orange-100 text-orange-800 border-orange-200",
};

const typeDotColors: Record<InterviewType, string> = {
  TECHNICAL: "bg-purple-500",
  BEHAVIORAL: "bg-sky-500",
  SYSTEM_DESIGN: "bg-indigo-500",
  CODING: "bg-emerald-500",
  HR: "bg-pink-500",
  CASE_STUDY: "bg-orange-500",
};

const typeLabels: Record<InterviewType, string> = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  HR: "HR",
  CASE_STUDY: "Case Study",
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  // Padding from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday:
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear(),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    });
  }

  // Padding from next month to fill the grid
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }
  }

  return days;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarPage() {
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interviewService.filterByStatus("SCHEDULED");
      setInterviews(data);
    } catch {
      // Fallback to getAll
      try {
        const data = await interviewService.getAll();
        setInterviews(data);
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Map interviews by date key
  const interviewsByDate: Record<string, InterviewResponse[]> = {};
  interviews.forEach((interview) => {
    const dateKey = interview.scheduledAt.slice(0, 10); // "YYYY-MM-DD"
    if (!interviewsByDate[dateKey]) {
      interviewsByDate[dateKey] = [];
    }
    interviewsByDate[dateKey].push(interview);
  });

  const calendarDays = getCalendarDays(year, month);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(formatDateKey(new Date()));
  };

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedInterviews = selectedDate ? interviewsByDate[selectedDate] || [] : [];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            View all scheduled interviews in a monthly calendar view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 ml-4">
            {(Object.keys(typeDotColors) as InterviewType[]).map((type) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`h-2.5 w-2.5 rounded-full ${typeDotColors[type]}`} />
                <span className="text-xs text-slate-500">{typeLabels[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{monthLabel}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-semibold text-slate-500 uppercase"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const dateKey = formatDateKey(day.date);
                    const dayInterviews = interviewsByDate[dateKey] || [];
                    const isSelected = selectedDate === dateKey;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        className={`relative flex flex-col items-center rounded-lg p-1 min-h-[4rem] transition-all ${
                          !day.isCurrentMonth
                            ? "text-slate-300"
                            : day.isToday
                            ? "bg-indigo-50 font-bold text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        } ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/50" : ""}`}
                      >
                        <span
                          className={`text-sm ${
                            day.isToday
                              ? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold"
                              : ""
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                        {dayInterviews.length > 0 && (
                          <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                            {dayInterviews.slice(0, 3).map((interview, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${typeDotColors[interview.type] || "bg-slate-400"}`}
                                title={`${interview.title} (${typeLabels[interview.type]})`}
                              />
                            ))}
                            {dayInterviews.length > 3 && (
                              <span className="text-[9px] text-slate-500 font-medium">
                                +{dayInterviews.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Selected Day Details */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a Day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-slate-500">
                Click on a day in the calendar to view scheduled interviews.
              </p>
            ) : selectedInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No interviews scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="rounded-lg border border-slate-200 p-3 space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 leading-tight">
                        {interview.title}
                      </p>
                      <Badge className={`${typeBadgeStyles[interview.type]} text-xs shrink-0`}>
                        {typeLabels[interview.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(interview.scheduledAt)}</span>
                      <span className="text-slate-300">|</span>
                      <span>{formatDuration(interview.duration)}</span>
                    </div>
                    {interview.candidateName && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{interview.candidateName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
