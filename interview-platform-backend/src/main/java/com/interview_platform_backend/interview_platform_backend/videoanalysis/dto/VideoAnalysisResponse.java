package com.interview_platform_backend.interview_platform_backend.videoanalysis.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoAnalysisResponse {

    private UUID id;

    private UUID interviewId;

    private String status;

    private double engagementScore;

    private double confidenceScore;

    private double eyeContactScore;

    private double bodyLanguageScore;

    private double overallScore;

    private Map<String, Double> emotionBreakdown;

    private List<String> gestureNotes;

    private List<TimelineEntry> timeline;

    private long processingDurationMs;

    private Instant completedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimelineEntry {
        private long timestamp;
        private String event;
        private double score;
    }
}
