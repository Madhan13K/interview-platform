"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  onSelect: (datetime: string) => void;
  selectedDate?: string;
  availableSlots?: string[];
  minDate?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

const DEFAULT_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export function CalendarPicker({
  onSelect,
  selectedDate,
  availableSlots,
  minDate,
}: CalendarPickerProps) {
  const today = new Date();
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const initialDate = selectedDate ? new Date(selectedDate) : today;
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    selectedDate ? selectedDate.split("T")[0] : null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    selectedDate && selectedDate.includes("T")
      ? selectedDate.split("T")[1]?.slice(0, 5) ?? null
      : null
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slots = availableSlots
    ? availableSlots.map((s) => {
        if (s.includes("T")) {
          return s.split("T")[1]?.slice(0, 5) ?? s;
        }
        return s.slice(0, 5);
      })
    : DEFAULT_SLOTS;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  const navigateMonth = (direction: -1 | 1) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === -1) {
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
        } else {
          setCurrentMonth(currentMonth - 1);
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
        } else {
          setCurrentMonth(currentMonth + 1);
        }
      }
      setIsTransitioning(false);
    }, 150);
  };

  const goToToday = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentMonth(today.getMonth());
      setCurrentYear(today.getFullYear());
      setIsTransitioning(false);
    }, 150);
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);

    if (minDate && dateStr < minDate) return;

    setSelectedDay(dateStr);

    if (selectedTime) {
      onSelect(`${dateStr}T${selectedTime}:00`);
    }
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);

    if (selectedDay) {
      onSelect(`${selectedDay}T${time}:00`);
    }
  };

  const isDateDisabled = (dateStr: string): boolean => {
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Build calendar grid cells
  const calendarCells: Array<{
    day: number;
    isCurrentMonth: boolean;
    dateStr: string;
  }> = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({
      day,
      isCurrentMonth: false,
      dateStr: formatDate(y, m, day),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      day,
      isCurrentMonth: true,
      dateStr: formatDate(currentYear, currentMonth, day),
    });
  }

  // Next month leading days
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({
      day,
      isCurrentMonth: false,
      dateStr: formatDate(y, m, day),
    });
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Previous month"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Today
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Next month"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day of week headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className={cn(
          "grid grid-cols-7 gap-1 transition-opacity duration-150",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {calendarCells.map((cell, index) => {
          const isToday = isSameDay(cell.dateStr, todayStr);
          const isSelected = selectedDay
            ? isSameDay(cell.dateStr, selectedDay)
            : false;
          const disabled = isDateDisabled(cell.dateStr);

          return (
            <button
              key={`${cell.dateStr}-${index}`}
              type="button"
              disabled={disabled || !cell.isCurrentMonth}
              onClick={() => {
                if (cell.isCurrentMonth) {
                  handleDayClick(cell.day);
                }
              }}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200",
                cell.isCurrentMonth
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-300 dark:text-gray-600",
                cell.isCurrentMonth &&
                  !isSelected &&
                  !disabled &&
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                isSelected &&
                  "bg-indigo-600 text-white shadow-md hover:bg-indigo-700",
                isToday &&
                  !isSelected &&
                  "ring-2 ring-indigo-400 ring-offset-1 dark:ring-indigo-500 dark:ring-offset-gray-900",
                disabled && "cursor-not-allowed opacity-40"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Time slots */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Available Times
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => handleTimeClick(time)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-all duration-200",
                selectedTime === time
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                  : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Selection summary */}
      {selectedDay && selectedTime && (
        <div className="mt-4 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Selected: {selectedDay} at {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
}
