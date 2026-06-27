package com.interview_platform_backend.interview_platform_backend.aicopilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopilotSuggestion {

    private SuggestionType type;

    private String content;

    private SuggestionPriority priority;

    @Builder.Default
    private Instant timestamp = Instant.now();

    private Map<String, Object> metadata;

    public enum SuggestionType {
        FOLLOW_UP_QUESTION,
        BIAS_ALERT,
        TIME_WARNING,
        COMPETENCY_GAP,
        POSITIVE_SIGNAL,
        SCORING_UPDATE
    }

    public enum SuggestionPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
