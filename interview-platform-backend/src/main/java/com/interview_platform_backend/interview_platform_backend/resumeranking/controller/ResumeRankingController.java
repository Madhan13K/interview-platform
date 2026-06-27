package com.interview_platform_backend.interview_platform_backend.resumeranking.controller;

import com.interview_platform_backend.interview_platform_backend.resumeranking.entity.ResumeRank;
import com.interview_platform_backend.interview_platform_backend.resumeranking.service.ResumeRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/resume-ranking")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
public class ResumeRankingController {

    private final ResumeRankingService resumeRankingService;

    @PostMapping("/rank")
    public ResponseEntity<List<ResumeRank>> rankCandidatesForJob(@RequestBody Map<String, Object> request) {
        UUID jobId = UUID.fromString((String) request.get("jobPositionId"));
        @SuppressWarnings("unchecked")
        List<String> candidateIdStrs = (List<String>) request.get("candidateIds");
        List<UUID> candidateIds = candidateIdStrs.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());

        List<ResumeRank> rankings = resumeRankingService.rankCandidatesForJob(jobId, candidateIds);
        return ResponseEntity.ok(rankings);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<List<ResumeRank>> getRankings(@PathVariable UUID jobId) {
        List<ResumeRank> rankings = resumeRankingService.getRankings(jobId);
        return ResponseEntity.ok(rankings);
    }

    @GetMapping("/candidates/{candidateId}/jobs/{jobId}")
    public ResponseEntity<ResumeRank> getCandidateRank(
            @PathVariable UUID candidateId,
            @PathVariable UUID jobId) {
        ResumeRank rank = resumeRankingService.getCandidateRank(candidateId, jobId);
        if (rank == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rank);
    }
}
