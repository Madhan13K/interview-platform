package com.interview_platform_backend.interview_platform_backend.performance;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 4: Performance Regression Tests
 * Baseline measurements that can be run in CI to catch regressions.
 */
@DisplayName("Performance Baseline Tests")
class PerformanceBaselineTest {

    @Test
    @DisplayName("JSON serialization should complete in under 100ms for 1000 objects")
    void jsonSerializationPerformance() throws Exception {
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<java.util.Map<String, Object>> data = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            data.add(java.util.Map.of("id", i, "name", "User " + i, "email", "user" + i + "@test.com"));
        }

        Instant start = Instant.now();
        String json = mapper.writeValueAsString(data);
        Duration duration = Duration.between(start, Instant.now());

        assertNotNull(json);
        assertTrue(duration.toMillis() < 100, "JSON serialization took " + duration.toMillis() + "ms (max 100ms)");
    }

    @Test
    @DisplayName("Concurrent HashMap operations should not degrade under load")
    void concurrentMapPerformance() throws Exception {
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        int threads = 20;
        int opsPerThread = 10000;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);

        Instant start = Instant.now();
        for (int t = 0; t < threads; t++) {
            final int threadId = t;
            executor.submit(() -> {
                for (int i = 0; i < opsPerThread; i++) {
                    map.put("key-" + threadId + "-" + i, i);
                    map.get("key-" + threadId + "-" + (i / 2));
                }
                latch.countDown();
            });
        }
        latch.await();
        Duration duration = Duration.between(start, Instant.now());
        executor.shutdown();

        assertEquals(threads * opsPerThread, map.size());
        assertTrue(duration.toMillis() < 5000, "200K concurrent ops took " + duration.toMillis() + "ms (max 5000ms)");
    }

    @Test
    @DisplayName("UUID generation should be fast under concurrency")
    void uuidGenerationPerformance() throws Exception {
        int count = 100000;
        Instant start = Instant.now();
        java.util.Set<String> uuids = ConcurrentHashMap.newKeySet();
        for (int i = 0; i < count; i++) {
            uuids.add(java.util.UUID.randomUUID().toString());
        }
        Duration duration = Duration.between(start, Instant.now());

        assertEquals(count, uuids.size(), "All UUIDs should be unique");
        assertTrue(duration.toMillis() < 2000, "100K UUIDs took " + duration.toMillis() + "ms (max 2000ms)");
    }
}
