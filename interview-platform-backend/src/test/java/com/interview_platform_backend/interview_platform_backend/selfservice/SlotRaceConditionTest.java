package com.interview_platform_backend.interview_platform_backend.selfservice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Self-Service Slot Race Condition Tests")
class SlotRaceConditionTest {

    @Test
    @DisplayName("Only one candidate should book a given slot")
    void onlyOneShouldBook() throws Exception {
        AtomicInteger bookings = new AtomicInteger(0);
        int maxSlotCapacity = 1;
        Object lock = new Object();
        int contenders = 10;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(contenders);
        ExecutorService executor = Executors.newFixedThreadPool(contenders);

        for (int i = 0; i < contenders; i++) {
            executor.submit(() -> {
                try {
                    start.await();
                    synchronized (lock) {
                        if (bookings.get() < maxSlotCapacity) {
                            bookings.incrementAndGet();
                        }
                    }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                finally { done.countDown(); }
            });
        }
        start.countDown();
        done.await();
        executor.shutdown();
        assertEquals(1, bookings.get(), "Only 1 booking should succeed for capacity=1");
    }

    @Test
    @DisplayName("Should handle concurrent slot submissions without data corruption")
    void noConcurrentCorruption() throws Exception {
        ConcurrentHashMap<String, String> slots = new ConcurrentHashMap<>();
        int threads = 20;
        CountDownLatch latch = new CountDownLatch(threads);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        AtomicInteger conflicts = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final int idx = i;
            executor.submit(() -> {
                String result = slots.putIfAbsent("slot-1", "candidate-" + idx);
                if (result != null) conflicts.incrementAndGet();
                latch.countDown();
            });
        }
        latch.await();
        executor.shutdown();
        assertEquals(1, slots.size());
        assertEquals(threads - 1, conflicts.get(), "All but 1 should get conflict");
    }
}
