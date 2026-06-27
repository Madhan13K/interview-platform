package com.interview_platform_backend.interview_platform_backend.videoanalysis.controller;

import com.interview_platform_backend.interview_platform_backend.videoanalysis.dto.VideoAnalysisRequest;
import com.interview_platform_backend.interview_platform_backend.videoanalysis.dto.VideoAnalysisResponse;
import com.interview_platform_backend.interview_platform_backend.videoanalysis.service.VideoAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/video-analysis")
@PreAuthorize("hasAnyRole('ADMIN', 'INTERVIEWER')")
@RequiredArgsConstructor
public class VideoAnalysisController {

    private final VideoAnalysisService videoAnalysisService;

    @PostMapping("/submit")
    public ResponseEntity<VideoAnalysisResponse> submitForAnalysis(@RequestBody VideoAnalysisRequest request) {
        VideoAnalysisResponse response = videoAnalysisService.submitForAnalysis(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoAnalysisResponse> getResult(@PathVariable UUID id) {
        VideoAnalysisResponse response = videoAnalysisService.getResult(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<VideoAnalysisResponse> getResultByInterview(@PathVariable UUID interviewId) {
        VideoAnalysisResponse response = videoAnalysisService.getResultByInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<VideoAnalysisResponse.TimelineEntry>> getEngagementTimeline(@PathVariable UUID id) {
        List<VideoAnalysisResponse.TimelineEntry> timeline = videoAnalysisService.generateEngagementTimeline(id);
        return ResponseEntity.ok(timeline);
    }
}
