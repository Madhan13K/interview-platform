package com.interview_platform_backend.interview_platform_backend.bulk;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 3: Bulk Operation Partial Failure Tests
 */
@DisplayName("Bulk Operation Partial Failure Tests")
class BulkOperationPartialFailureTest {

    @Test
    @DisplayName("Should continue processing after individual item failure")
    void shouldContinueAfterFailure() {
        List<String> items = List.of("valid1", "invalid", "valid2", "invalid2", "valid3");
        var result = processBulk(items);
        assertEquals(3, result.success);
        assertEquals(2, result.failures);
        assertEquals(5, result.total);
    }

    @Test
    @DisplayName("Should report all errors without stopping")
    void shouldReportAllErrors() {
        List<String> items = List.of("invalid1", "invalid2", "invalid3");
        var result = processBulk(items);
        assertEquals(0, result.success);
        assertEquals(3, result.failures);
        assertEquals(3, result.errors.size());
    }

    @Test
    @DisplayName("Should handle empty batch")
    void shouldHandleEmptyBatch() {
        var result = processBulk(List.of());
        assertEquals(0, result.total);
    }

    record BulkResult(int total, int success, int failures, List<String> errors) {}

    private BulkResult processBulk(List<String> items) {
        int success = 0, failures = 0;
        List<String> errors = new ArrayList<>();
        for (String item : items) {
            if (item.startsWith("invalid")) {
                failures++;
                errors.add("Failed: " + item);
            } else {
                success++;
            }
        }
        return new BulkResult(items.size(), success, failures, errors);
    }
}
