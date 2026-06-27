package com.interview_platform_backend.interview_platform_backend.candidateportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidatePortalData {

    private UUID candidateId;
    private String applicationStatus;
    private List<Map<String, Object>> upcomingInterviews;
    private int completedInterviews;
    private List<String> pendingActions;
    private List<String> aiPrepTips;
    private int progressPercent;
    private String nextStep;
}
