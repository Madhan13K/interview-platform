package com.interview_platform_backend.interview_platform_backend.aicopilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopilotDashboard {

    private UUID sessionId;

    private double interviewProgress;

    private int timeElapsedMin;

    private int timeRemainingMin;

    private Map<String, Double> currentScores;

    private List<CopilotSuggestion> recentSuggestions;

    private Map<String, Boolean> competencyCoverage;

    private List<String> biasAlerts;

    private String nextRecommendedTopic;
}
