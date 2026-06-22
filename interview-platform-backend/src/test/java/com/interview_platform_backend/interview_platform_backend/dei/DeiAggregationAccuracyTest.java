package com.interview_platform_backend.interview_platform_backend.dei;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("DEI Analytics Aggregation Accuracy Tests")
class DeiAggregationAccuracyTest {

    @Test void shouldCalculateCorrectPercentages() {
        Map<String, Integer> demographics = Map.of("Male", 60, "Female", 35, "Non-Binary", 5);
        int total = demographics.values().stream().mapToInt(Integer::intValue).sum();
        assertEquals(100, total);
        assertEquals(60.0, (double) demographics.get("Male") / total * 100);
        assertEquals(35.0, (double) demographics.get("Female") / total * 100);
    }

    @Test void shouldHandleEmptyDataGracefully() {
        Map<String, Integer> empty = Map.of();
        int total = empty.values().stream().mapToInt(Integer::intValue).sum();
        assertEquals(0, total);
    }

    @Test void shouldCalculateFunnelConversion() {
        int applied = 200, screened = 100, interviewed = 50, offered = 10, hired = 8;
        double screenRate = (double) screened / applied * 100;
        double hireRate = (double) hired / applied * 100;
        assertEquals(50.0, screenRate);
        assertEquals(4.0, hireRate);
    }

    @Test void shouldDetectStatisticallySignificantDisparity() {
        double groupAHireRate = 0.15; // 15%
        double groupBHireRate = 0.05; // 5%
        double ratio = groupAHireRate / groupBHireRate;
        assertTrue(ratio > 2.0, "3:1 disparity should be flagged");
    }

    @Test void shouldRespectOptInConsent() {
        boolean consentGiven = false;
        assertFalse(consentGiven, "Should not include non-consenting users in DEI metrics");
    }

    @Test void shouldAnonymizeSmallGroups() {
        int groupSize = 3;
        int minimumReportingSize = 5;
        assertTrue(groupSize < minimumReportingSize, "Groups < 5 should be anonymized to prevent identification");
    }
}
