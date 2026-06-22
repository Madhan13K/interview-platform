package com.interview_platform_backend.interview_platform_backend.plagiarism;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/plagiarism")
@PreAuthorize("hasAnyRole('ADMIN', 'INTERVIEWER')")
public class PlagiarismController {

    private final PlagiarismDetectionService plagiarismService;

    public PlagiarismController(PlagiarismDetectionService plagiarismService) {
        this.plagiarismService = plagiarismService;
    }

    @PostMapping("/check")
    public ResponseEntity<PlagiarismDetectionService.PlagiarismResult> checkPlagiarism(
            @RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        String language = (String) request.getOrDefault("language", "java");
        List<String> corpus = (List<String>) request.getOrDefault("corpus", List.of());

        return ResponseEntity.ok(plagiarismService.checkSubmission(code, language, corpus));
    }

    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareTwoSubmissions(@RequestBody Map<String, String> request) {
        double similarity = plagiarismService.compareTwoSubmissions(
                request.get("code1"),
                request.get("code2"),
                request.getOrDefault("language", "java")
        );
        return ResponseEntity.ok(Map.of(
                "similarity", Math.round(similarity * 1000.0) / 10.0,
                "flagged", similarity >= 0.85
        ));
    }
}
