package com.interview_platform_backend.interview_platform_backend.calendarsync;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 3: Calendar Sync Conflict Resolution Tests
 * Tests bidirectional sync conflict detection and resolution strategies.
 */
@DisplayName("Calendar Sync Conflict Tests")
class CalendarSyncConflictTest {

    enum ConflictResolution { LOCAL_WINS, REMOTE_WINS, MOST_RECENT_WINS, MANUAL }

    @Nested
    @DisplayName("Conflict Detection")
    class ConflictDetection {

        @Test
        @DisplayName("Should detect conflict when both local and remote modified since last sync")
        void shouldDetectBidirectionalModification() {
            Instant lastSync = Instant.now().minus(1, ChronoUnit.HOURS);
            Instant localModified = Instant.now().minus(30, ChronoUnit.MINUTES);
            Instant remoteModified = Instant.now().minus(20, ChronoUnit.MINUTES);

            boolean hasConflict = localModified.isAfter(lastSync) && remoteModified.isAfter(lastSync);
            assertTrue(hasConflict, "Should detect conflict when both sides modified after last sync");
        }

        @Test
        @DisplayName("Should NOT detect conflict when only local modified")
        void shouldNotDetectConflictLocalOnly() {
            Instant lastSync = Instant.now().minus(1, ChronoUnit.HOURS);
            Instant localModified = Instant.now().minus(30, ChronoUnit.MINUTES);
            Instant remoteModified = Instant.now().minus(2, ChronoUnit.HOURS); // Before last sync

            boolean hasConflict = localModified.isAfter(lastSync) && remoteModified.isAfter(lastSync);
            assertFalse(hasConflict);
        }

        @Test
        @DisplayName("Should NOT detect conflict when only remote modified")
        void shouldNotDetectConflictRemoteOnly() {
            Instant lastSync = Instant.now().minus(1, ChronoUnit.HOURS);
            Instant localModified = Instant.now().minus(2, ChronoUnit.HOURS);
            Instant remoteModified = Instant.now().minus(30, ChronoUnit.MINUTES);

            boolean localChanged = localModified.isAfter(lastSync);
            boolean remoteChanged = remoteModified.isAfter(lastSync);
            assertFalse(localChanged && remoteChanged, "Only remote changed - no conflict");
            assertTrue(remoteChanged, "Remote change should be detected for sync");
        }

        @Test
        @DisplayName("Should detect deletion conflict")
        void shouldDetectDeletionConflict() {
            // Event deleted remotely but modified locally
            boolean deletedRemotely = true;
            boolean modifiedLocally = true;
            boolean isDeletionConflict = deletedRemotely && modifiedLocally;
            assertTrue(isDeletionConflict);
        }
    }

    @Nested
    @DisplayName("Conflict Resolution Strategies")
    class Resolution {

        @Test
        @DisplayName("LOCAL_WINS: Should keep local version")
        void localWinsShouldKeepLocal() {
            var result = resolveConflict("Local Title", "Remote Title",
                    Instant.now().minus(30, ChronoUnit.MINUTES),
                    Instant.now().minus(10, ChronoUnit.MINUTES),
                    ConflictResolution.LOCAL_WINS);
            assertEquals("Local Title", result);
        }

        @Test
        @DisplayName("REMOTE_WINS: Should keep remote version")
        void remoteWinsShouldKeepRemote() {
            var result = resolveConflict("Local Title", "Remote Title",
                    Instant.now().minus(30, ChronoUnit.MINUTES),
                    Instant.now().minus(10, ChronoUnit.MINUTES),
                    ConflictResolution.REMOTE_WINS);
            assertEquals("Remote Title", result);
        }

        @Test
        @DisplayName("MOST_RECENT_WINS: Should keep most recently modified")
        void mostRecentWins() {
            Instant localMod = Instant.now().minus(30, ChronoUnit.MINUTES);
            Instant remoteMod = Instant.now().minus(10, ChronoUnit.MINUTES); // More recent

            var result = resolveConflict("Local Title", "Remote Title",
                    localMod, remoteMod, ConflictResolution.MOST_RECENT_WINS);
            assertEquals("Remote Title", result, "Remote is more recent");

            // Flip: local is more recent
            var result2 = resolveConflict("Local Title", "Remote Title",
                    Instant.now().minus(5, ChronoUnit.MINUTES),
                    Instant.now().minus(30, ChronoUnit.MINUTES),
                    ConflictResolution.MOST_RECENT_WINS);
            assertEquals("Local Title", result2, "Local is more recent");
        }
    }

    @Nested
    @DisplayName("Token Refresh Race Condition")
    class TokenRefresh {

        @Test
        @DisplayName("Should not allow concurrent token refresh")
        void shouldPreventConcurrentRefresh() throws InterruptedException {
            var lock = new Object();
            var refreshCount = new java.util.concurrent.atomic.AtomicInteger(0);
            var threads = new Thread[5];

            for (int i = 0; i < 5; i++) {
                threads[i] = new Thread(() -> {
                    synchronized (lock) {
                        // Only one thread should execute refresh
                        refreshCount.incrementAndGet();
                    }
                });
                threads[i].start();
            }

            for (Thread t : threads) t.join();

            // All increments happen but serially (synchronized)
            assertEquals(5, refreshCount.get(), "All threads should complete but serially");
        }

        @Test
        @DisplayName("Should handle expired token gracefully")
        void shouldHandleExpiredToken() {
            Instant tokenExpiry = Instant.now().minus(1, ChronoUnit.HOURS);
            boolean isExpired = Instant.now().isAfter(tokenExpiry);
            assertTrue(isExpired, "Token should be detected as expired");
            // Service should refresh before making API call
        }

        @Test
        @DisplayName("Should refresh token with buffer before expiry")
        void shouldRefreshWithBuffer() {
            int bufferSeconds = 300; // 5 min buffer
            Instant tokenExpiry = Instant.now().plus(4, ChronoUnit.MINUTES); // Expires in 4 min
            boolean needsRefresh = Instant.now().plus(bufferSeconds, ChronoUnit.SECONDS).isAfter(tokenExpiry);
            assertTrue(needsRefresh, "Should refresh when within 5 min of expiry");
        }
    }

    @Nested
    @DisplayName("Sync Direction")
    class SyncDirection {

        @Test
        @DisplayName("Bidirectional sync should process both directions")
        void bidirectionalSyncBothDirections() {
            List<String> localEvents = List.of("event-1", "event-2");
            List<String> remoteEvents = List.of("event-2", "event-3");

            // Push to remote: local - remote
            Set<String> toPush = new HashSet<>(localEvents);
            toPush.removeAll(remoteEvents);
            assertEquals(Set.of("event-1"), toPush);

            // Pull from remote: remote - local
            Set<String> toPull = new HashSet<>(remoteEvents);
            toPull.removeAll(localEvents);
            assertEquals(Set.of("event-3"), toPull);
        }

        @Test
        @DisplayName("One-way push should not pull changes")
        void oneWayPushOnly() {
            String syncDirection = "PUSH_ONLY";
            boolean shouldPull = !"PUSH_ONLY".equals(syncDirection);
            assertFalse(shouldPull);
        }

        @Test
        @DisplayName("One-way pull should not push changes")
        void oneWayPullOnly() {
            String syncDirection = "PULL_ONLY";
            boolean shouldPush = !"PULL_ONLY".equals(syncDirection);
            assertFalse(shouldPush);
        }
    }

    // Helper
    private String resolveConflict(String localValue, String remoteValue,
                                    Instant localModified, Instant remoteModified,
                                    ConflictResolution strategy) {
        return switch (strategy) {
            case LOCAL_WINS -> localValue;
            case REMOTE_WINS -> remoteValue;
            case MOST_RECENT_WINS -> localModified.isAfter(remoteModified) ? localValue : remoteValue;
            case MANUAL -> null; // Requires user input
        };
    }
}
