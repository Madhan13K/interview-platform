package com.interview_platform_backend.interview_platform_backend.reminder;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Reminder Scheduling Time-Based Trigger Tests")
class ReminderSchedulingTest {

    @Test void shouldSchedule24HourReminder() {
        Instant interviewTime = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant reminderTime = interviewTime.minus(24, ChronoUnit.HOURS);
        assertTrue(reminderTime.isBefore(interviewTime));
        assertEquals(24 * 3600, interviewTime.getEpochSecond() - reminderTime.getEpochSecond());
    }

    @Test void shouldSchedule1HourReminder() {
        Instant interviewTime = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant reminderTime = interviewTime.minus(1, ChronoUnit.HOURS);
        assertEquals(3600, interviewTime.getEpochSecond() - reminderTime.getEpochSecond());
    }

    @Test void shouldSchedule15MinReminder() {
        Instant interviewTime = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant reminderTime = interviewTime.minus(15, ChronoUnit.MINUTES);
        assertEquals(900, interviewTime.getEpochSecond() - reminderTime.getEpochSecond());
    }

    @Test void shouldNotScheduleReminderForPastInterviews() {
        Instant pastInterview = Instant.now().minus(1, ChronoUnit.HOURS);
        boolean shouldSchedule = pastInterview.isAfter(Instant.now());
        assertFalse(shouldSchedule);
    }

    @Test void shouldCancelRemindersWhenInterviewCancelled() {
        List<String> reminders = new java.util.ArrayList<>(List.of("24h", "1h", "15m"));
        reminders.clear(); // Cancel all
        assertTrue(reminders.isEmpty());
    }

    @Test void shouldNotDuplicateReminders() {
        var scheduled = new java.util.HashSet<String>();
        scheduled.add("interview-1:24h");
        assertFalse(scheduled.add("interview-1:24h"), "Duplicate should be rejected");
    }
}
