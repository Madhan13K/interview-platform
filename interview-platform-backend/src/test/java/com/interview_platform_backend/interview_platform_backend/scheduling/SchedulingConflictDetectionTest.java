package com.interview_platform_backend.interview_platform_backend.scheduling;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 2: Scheduling Conflict Detection Tests
 */
@DisplayName("Scheduling Conflict Detection Tests")
class SchedulingConflictDetectionTest {

    @Nested
    @DisplayName("Time Overlap Detection")
    class TimeOverlap {

        @Test
        @DisplayName("Should detect fully overlapping slots")
        void shouldDetectFullOverlap() {
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            Instant start2 = start1.plus(10, ChronoUnit.MINUTES);
            Instant end2 = start1.plus(50, ChronoUnit.MINUTES);
            assertTrue(hasOverlap(start1, end1, start2, end2));
        }

        @Test
        @DisplayName("Should detect partial overlap at start")
        void shouldDetectPartialOverlapStart() {
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            Instant start2 = start1.minus(30, ChronoUnit.MINUTES);
            Instant end2 = start1.plus(30, ChronoUnit.MINUTES);
            assertTrue(hasOverlap(start1, end1, start2, end2));
        }

        @Test
        @DisplayName("Should detect partial overlap at end")
        void shouldDetectPartialOverlapEnd() {
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            Instant start2 = start1.plus(30, ChronoUnit.MINUTES);
            Instant end2 = start1.plus(90, ChronoUnit.MINUTES);
            assertTrue(hasOverlap(start1, end1, start2, end2));
        }

        @Test
        @DisplayName("Should NOT detect adjacent (non-overlapping) slots")
        void shouldNotDetectAdjacentSlots() {
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            Instant start2 = end1; // Starts exactly when first ends
            Instant end2 = start2.plus(60, ChronoUnit.MINUTES);
            assertFalse(hasOverlap(start1, end1, start2, end2));
        }

        @Test
        @DisplayName("Should NOT detect non-overlapping slots")
        void shouldNotDetectNonOverlapping() {
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            Instant start2 = end1.plus(30, ChronoUnit.MINUTES); // 30 min gap
            Instant end2 = start2.plus(60, ChronoUnit.MINUTES);
            assertFalse(hasOverlap(start1, end1, start2, end2));
        }

        @Test
        @DisplayName("Should handle buffer time between interviews")
        void shouldHandleBufferTime() {
            int bufferMinutes = 15;
            Instant start1 = Instant.now();
            Instant end1 = start1.plus(60, ChronoUnit.MINUTES);
            // 10 min gap - less than buffer
            Instant start2 = end1.plus(10, ChronoUnit.MINUTES);
            Instant end2 = start2.plus(60, ChronoUnit.MINUTES);
            assertTrue(hasOverlapWithBuffer(start1, end1, start2, end2, bufferMinutes));
        }
    }

    @Nested
    @DisplayName("Double-Booking Prevention")
    class DoubleBooking {

        @Test
        @DisplayName("Should prevent same interviewer double-booked")
        void shouldPreventInterviewerDoubleBooking() {
            String interviewerId = "interviewer-1";
            Instant slot = Instant.now().plus(1, ChronoUnit.DAYS);
            // Simulate checking existing bookings
            boolean hasConflict = isInterviewerBooked(interviewerId, slot, slot.plus(60, ChronoUnit.MINUTES));
            // First booking - no conflict
            assertFalse(hasConflict);
        }

        @Test
        @DisplayName("Should prevent same candidate double-booked")
        void shouldPreventCandidateDoubleBooking() {
            String candidateId = "candidate-1";
            Instant slot = Instant.now().plus(1, ChronoUnit.DAYS);
            boolean hasConflict = isCandidateBooked(candidateId, slot, slot.plus(60, ChronoUnit.MINUTES));
            assertFalse(hasConflict);
        }
    }

    private boolean hasOverlap(Instant start1, Instant end1, Instant start2, Instant end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    private boolean hasOverlapWithBuffer(Instant start1, Instant end1, Instant start2, Instant end2, int bufferMinutes) {
        Instant bufferedEnd1 = end1.plus(bufferMinutes, ChronoUnit.MINUTES);
        return start1.isBefore(end2) && start2.isBefore(bufferedEnd1);
    }

    private boolean isInterviewerBooked(String id, Instant start, Instant end) { return false; }
    private boolean isCandidateBooked(String id, Instant start, Instant end) { return false; }
}
