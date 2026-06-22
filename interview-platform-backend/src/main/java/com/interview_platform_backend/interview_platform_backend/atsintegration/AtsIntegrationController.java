package com.interview_platform_backend.interview_platform_backend.atsintegration;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/integrations/ats")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
public class AtsIntegrationController {

    private final AtsIntegrationService atsIntegrationService;

    public AtsIntegrationController(AtsIntegrationService atsIntegrationService) {
        this.atsIntegrationService = atsIntegrationService;
    }

    @PostMapping("/{provider}/sync")
    public ResponseEntity<List<Map<String, Object>>> syncCandidates(@PathVariable String provider) {
        return ResponseEntity.ok(atsIntegrationService.syncCandidates(provider));
    }

    @PostMapping("/{provider}/push")
    public ResponseEntity<Map<String, Object>> pushCandidate(
            @PathVariable String provider,
            @RequestBody Map<String, Object> candidateData) {
        return ResponseEntity.ok(atsIntegrationService.pushCandidate(provider, candidateData));
    }
}
