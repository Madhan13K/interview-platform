package com.interview_platform_backend.interview_platform_backend.marketplace;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketplace/assessments")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'INTERVIEWER')")
public class AssessmentMarketplaceController {

    private final AssessmentMarketplaceService marketplaceService;

    public AssessmentMarketplaceController(AssessmentMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/providers")
    public ResponseEntity<List<AssessmentMarketplaceService.AssessmentProvider>> listProviders(
            @RequestParam(required = false) String category) {
        if (category != null) {
            return ResponseEntity.ok(marketplaceService.listProvidersByCategory(category));
        }
        return ResponseEntity.ok(marketplaceService.listProviders());
    }

    @GetMapping("/providers/{providerId}/assessments")
    public ResponseEntity<List<AssessmentMarketplaceService.Assessment>> getAssessments(@PathVariable String providerId) {
        return ResponseEntity.ok(marketplaceService.getAvailableAssessments(providerId));
    }

    @PostMapping("/order")
    public ResponseEntity<AssessmentMarketplaceService.AssessmentOrder> orderAssessment(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(marketplaceService.orderAssessment(
                request.get("providerId"),
                request.get("assessmentId"),
                request.get("candidateEmail"),
                request.get("candidateName")
        ));
    }

    @GetMapping("/orders/{orderId}/result")
    public ResponseEntity<AssessmentMarketplaceService.AssessmentResult> getResult(
            @PathVariable String orderId,
            @RequestParam String providerId) {
        return ResponseEntity.ok(marketplaceService.getResult(providerId, orderId));
    }
}
