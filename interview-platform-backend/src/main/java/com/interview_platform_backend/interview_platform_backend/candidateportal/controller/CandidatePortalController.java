package com.interview_platform_backend.interview_platform_backend.candidateportal.controller;

import com.interview_platform_backend.interview_platform_backend.candidateportal.dto.CandidatePortalData;
import com.interview_platform_backend.interview_platform_backend.candidateportal.service.CandidatePortalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/candidate-portal")
@PreAuthorize("hasAnyRole('CANDIDATE','ADMIN')")
public class CandidatePortalController {

    private final CandidatePortalService candidatePortalService;

    public CandidatePortalController(CandidatePortalService candidatePortalService) {
        this.candidatePortalService = candidatePortalService;
    }

    /**
     * Get portal data for the currently authenticated candidate.
     */
    @GetMapping("/me")
    public ResponseEntity<CandidatePortalData> getMyPortalData(Authentication authentication) {
        UUID candidateId = UUID.fromString(authentication.getName());
        CandidatePortalData data = candidatePortalService.getPortalData(candidateId);
        return ResponseEntity.ok(data);
    }

    /**
     * Get AI-generated preparation tips for a specific job.
     */
    @GetMapping("/prep-tips/{jobId}")
    public ResponseEntity<List<String>> getAIPrepTips(
            Authentication authentication,
            @PathVariable UUID jobId) {
        UUID candidateId = UUID.fromString(authentication.getName());
        List<String> tips = candidatePortalService.getAIPrepTips(candidateId, jobId);
        return ResponseEntity.ok(tips);
    }

    /**
     * Get the full interview timeline for the current candidate.
     */
    @GetMapping("/timeline")
    public ResponseEntity<List<Map<String, Object>>> getInterviewTimeline(Authentication authentication) {
        UUID candidateId = UUID.fromString(authentication.getName());
        List<Map<String, Object>> timeline = candidatePortalService.getInterviewTimeline(candidateId);
        return ResponseEntity.ok(timeline);
    }
}
