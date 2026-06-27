package com.interview_platform_backend.interview_platform_backend.videoanalysis.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoAnalysisRequest {

    private UUID interviewId;

    private String videoUrl;

    private UUID candidateId;

    @Builder.Default
    private boolean analyzeEmotions = true;

    @Builder.Default
    private boolean analyzeGestures = true;

    @Builder.Default
    private boolean analyzeEngagement = true;
}
