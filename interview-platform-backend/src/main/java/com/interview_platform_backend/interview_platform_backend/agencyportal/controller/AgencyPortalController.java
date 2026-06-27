package com.interview_platform_backend.interview_platform_backend.agencyportal.controller;

import com.interview_platform_backend.interview_platform_backend.agencyportal.entity.AgencySubmission;
import com.interview_platform_backend.interview_platform_backend.agencyportal.entity.RecruitingAgency;
import com.interview_platform_backend.interview_platform_backend.agencyportal.service.AgencyPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agency-portal")
@RequiredArgsConstructor
public class AgencyPortalController {

    private final AgencyPortalService agencyPortalService;

    @PostMapping("/agencies")
    public ResponseEntity<RecruitingAgency> registerAgency(@RequestBody Map<String, Object> request) {
        RecruitingAgency agency = agencyPortalService.registerAgency(
                (String) request.get("name"),
                (String) request.get("contactEmail"),
                RecruitingAgency.ContractType.valueOf((String) request.get("contractType")),
                ((Number) request.get("feePercentage")).doubleValue(),
                ((Number) request.get("slaResponseHours")).intValue()
        );
        return ResponseEntity.ok(agency);
    }

    @PostMapping("/submissions")
    public ResponseEntity<AgencySubmission> submitCandidate(@RequestBody Map<String, Object> request) {
        AgencySubmission submission = agencyPortalService.submitCandidate(
                UUID.fromString((String) request.get("agencyId")),
                UUID.fromString((String) request.get("candidateId")),
                UUID.fromString((String) request.get("jobPositionId")),
                ((Number) request.get("fee")).doubleValue()
        );
        return ResponseEntity.ok(submission);
    }

    @PutMapping("/submissions/{submissionId}/review")
    public ResponseEntity<AgencySubmission> reviewSubmission(
            @PathVariable UUID submissionId,
            @RequestParam AgencySubmission.SubmissionStatus status) {
        AgencySubmission submission = agencyPortalService.reviewSubmission(submissionId, status);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/agencies/{agencyId}/fees")
    public ResponseEntity<Map<String, Object>> trackFees(@PathVariable UUID agencyId) {
        double totalFees = agencyPortalService.trackFees(agencyId);
        return ResponseEntity.ok(Map.of("agencyId", agencyId, "totalFees", totalFees));
    }

    @GetMapping("/agencies/{agencyId}/performance")
    public ResponseEntity<Map<String, Object>> getAgencyPerformance(@PathVariable UUID agencyId) {
        Map<String, Object> performance = agencyPortalService.getAgencyPerformance(agencyId);
        return ResponseEntity.ok(performance);
    }
}
