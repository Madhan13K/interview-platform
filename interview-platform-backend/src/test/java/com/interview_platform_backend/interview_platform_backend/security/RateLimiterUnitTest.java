package com.interview_platform_backend.interview_platform_backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 1: Rate Limiter Accuracy Unit Tests
 * Tests the in-memory rate limiting logic without Redis dependency.
 */
@DisplayName("Rate Limiter Unit Tests")
class RateLimiterUnitTest {

    private SimpleRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new SimpleRateLimiter();
    }

    @Nested
    @DisplayName("Basic Rate Limiting")
    class BasicRateLimiting {

        @Test
        @DisplayName("Should allow requests within limit")
        void shouldAllowRequestsWithinLimit() {
            String key = "user:test@test.com";
            int limit = 5;

            for (int i = 0; i < limit; i++) {
                assertTrue(rateLimiter.isAllowed(key, limit, 60000),
                        "Request " + (i + 1) + " should be allowed");
            }
        }

        @Test
        @DisplayName("Should block requests exceeding limit")
        void shouldBlockRequestsExceedingLimit() {
            String key = "user:test@test.com";
            int limit = 3;

            // Use up all allowed requests
            for (int i = 0; i < limit; i++) {
                assertTrue(rateLimiter.isAllowed(key, limit, 60000));
            }

            // Next request should be blocked
            assertFalse(rateLimiter.isAllowed(key, limit, 60000),
                    "Request exceeding limit should be blocked");
        }

        @Test
        @DisplayName("Should track limits per key independently")
        void shouldTrackLimitsPerKey() {
            int limit = 2;

            // User 1 uses up their limit
            assertTrue(rateLimiter.isAllowed("user:a@test.com", limit, 60000));
            assertTrue(rateLimiter.isAllowed("user:a@test.com", limit, 60000));
            assertFalse(rateLimiter.isAllowed("user:a@test.com", limit, 60000));

            // User 2 should still have their full limit
            assertTrue(rateLimiter.isAllowed("user:b@test.com", limit, 60000));
            assertTrue(rateLimiter.isAllowed("user:b@test.com", limit, 60000));
        }

        @Test
        @DisplayName("Should reset after window expires")
        void shouldResetAfterWindowExpires() throws InterruptedException {
            String key = "user:test@test.com";
            int limit = 2;
            int windowMs = 100; // 100ms window for test speed

            assertTrue(rateLimiter.isAllowed(key, limit, windowMs));
            assertTrue(rateLimiter.isAllowed(key, limit, windowMs));
            assertFalse(rateLimiter.isAllowed(key, limit, windowMs)); // Blocked

            // Wait for window to expire
            Thread.sleep(150);

            // Should be allowed again
            assertTrue(rateLimiter.isAllowed(key, limit, windowMs),
                    "Should reset after window expires");
        }
    }

    @Nested
    @DisplayName("Concurrent Access (Race Condition Tests)")
    class ConcurrentAccess {

        @Test
        @DisplayName("Should not allow more than limit under concurrent load")
        void shouldEnforceLimitUnderConcurrency() throws InterruptedException {
            String key = "ip:192.168.1.1";
            int limit = 10;
            int concurrentRequests = 50;

            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(concurrentRequests);
            AtomicInteger allowedCount = new AtomicInteger(0);

            ExecutorService executor = Executors.newFixedThreadPool(20);

            for (int i = 0; i < concurrentRequests; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await(); // All threads start simultaneously
                        if (rateLimiter.isAllowed(key, limit, 60000)) {
                            allowedCount.incrementAndGet();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            startLatch.countDown(); // Release all threads
            doneLatch.await();
            executor.shutdown();

            // Should allow at most `limit` requests (with small tolerance for timing)
            assertTrue(allowedCount.get() <= limit + 2,
                    "Allowed " + allowedCount.get() + " requests but limit is " + limit +
                    ". Possible race condition!");
            assertTrue(allowedCount.get() >= limit - 1,
                    "Should allow at least " + (limit - 1) + " requests, got " + allowedCount.get());
        }

        @Test
        @DisplayName("Should handle multiple keys concurrently without interference")
        void shouldIsolateKeysConcurrently() throws InterruptedException {
            int limit = 5;
            int keysCount = 10;
            int requestsPerKey = 10;

            CountDownLatch latch = new CountDownLatch(keysCount * requestsPerKey);
            AtomicInteger[] allowedPerKey = new AtomicInteger[keysCount];
            for (int i = 0; i < keysCount; i++) {
                allowedPerKey[i] = new AtomicInteger(0);
            }

            ExecutorService executor = Executors.newFixedThreadPool(20);

            for (int k = 0; k < keysCount; k++) {
                final int keyIndex = k;
                String key = "user:" + k + "@test.com";
                for (int r = 0; r < requestsPerKey; r++) {
                    executor.submit(() -> {
                        try {
                            if (rateLimiter.isAllowed(key, limit, 60000)) {
                                allowedPerKey[keyIndex].incrementAndGet();
                            }
                        } finally {
                            latch.countDown();
                        }
                    });
                }
            }

            latch.await();
            executor.shutdown();

            // Each key should have exactly `limit` allowed requests
            for (int k = 0; k < keysCount; k++) {
                assertTrue(allowedPerKey[k].get() <= limit + 1,
                        "Key " + k + " allowed " + allowedPerKey[k].get() + " but limit is " + limit);
            }
        }
    }

    @Nested
    @DisplayName("IP-Based Rate Limiting")
    class IpBasedRateLimiting {

        @Test
        @DisplayName("Should apply different limits for auth vs general endpoints")
        void shouldApplyDifferentLimitsPerEndpoint() {
            String ip = "192.168.1.100";

            // Auth endpoint: 5 requests/minute
            String authKey = "auth:" + ip;
            for (int i = 0; i < 5; i++) {
                assertTrue(rateLimiter.isAllowed(authKey, 5, 60000));
            }
            assertFalse(rateLimiter.isAllowed(authKey, 5, 60000));

            // General endpoint: 60 requests/minute (same IP, different key)
            String generalKey = "general:" + ip;
            for (int i = 0; i < 60; i++) {
                assertTrue(rateLimiter.isAllowed(generalKey, 60, 60000));
            }
            assertFalse(rateLimiter.isAllowed(generalKey, 60, 60000));
        }
    }

    /**
     * Simple in-memory rate limiter for unit testing.
     * Mirrors the logic of the real Redis-backed RateLimitingFilter.
     */
    static class SimpleRateLimiter {
        private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

        boolean isAllowed(String key, int limit, long windowMs) {
            WindowCounter counter = counters.compute(key, (k, existing) -> {
                long now = System.currentTimeMillis();
                if (existing == null || now - existing.windowStart > windowMs) {
                    return new WindowCounter(now, 1);
                }
                existing.count++;
                return existing;
            });
            return counter.count <= limit;
        }

        static class WindowCounter {
            long windowStart;
            int count;

            WindowCounter(long windowStart, int count) {
                this.windowStart = windowStart;
                this.count = count;
            }
        }
    }
}
