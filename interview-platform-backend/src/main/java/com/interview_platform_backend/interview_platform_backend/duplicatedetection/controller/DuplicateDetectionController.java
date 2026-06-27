package com.interview_platform_backend.interview_platform_backend.duplicatedetection.controller;

import com.interview_platform_backend.interview_platform_backend.duplicatedetection.entity.DuplicateCandidate;
import com.interview_platform_backend.interview_platform_backend.duplicatedetection.service.DuplicateDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/duplicate-detection")
@RequiredArgsConstructor
public class DuplicateDetectionController {

    private final DuplicateDetectionService duplicateDetectionService;

    @PostMapping("/scan/{candidateId}")
    public ResponseEntity<List<DuplicateCandidate>> scanForDuplicates(@PathVariable UUID candidateId) {
        log.info("POST /api/v1/duplicate-detection/scan/{}", candidateId);
        List<DuplicateCandidate> duplicates = duplicateDetectionService.scanForDuplicates(candidateId);
        return ResponseEntity.ok(duplicates);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<DuplicateCandidate>> getPendingDuplicates() {
        log.info("GET /api/v1/duplicate-detection/pending");
        return ResponseEntity.ok(duplicateDetectionService.getPendingDuplicates());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<DuplicateCandidate> resolveDuplicate(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        log.info("PUT /api/v1/duplicate-detection/{}/resolve", id);
        String resolution = body.get("resolution");
        DuplicateCandidate resolved = duplicateDetectionService.resolveDuplicate(id, resolution);
        return ResponseEntity.ok(resolved);
    }

    @PostMapping("/merge")
    public ResponseEntity<DuplicateCandidate> mergeCandidates(@RequestBody Map<String, String> body) {
        log.info("POST /api/v1/duplicate-detection/merge");
        UUID keepId = UUID.fromString(body.get("keepId"));
        UUID mergeId = UUID.fromString(body.get("mergeId"));
        DuplicateCandidate merged = duplicateDetectionService.mergeCandidates(keepId, mergeId);
        return ResponseEntity.ok(merged);
    }
}
