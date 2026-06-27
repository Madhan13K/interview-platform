package com.interview_platform_backend.interview_platform_backend.aijobdescription.controller;

import com.interview_platform_backend.interview_platform_backend.aijobdescription.entity.GeneratedJobDescription;
import com.interview_platform_backend.interview_platform_backend.aijobdescription.service.AIJobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-job-descriptions")
@RequiredArgsConstructor
public class AIJobDescriptionController {

    private final AIJobDescriptionService jobDescriptionService;

    @PostMapping("/generate")
    public ResponseEntity<GeneratedJobDescription> generate(
            @RequestParam String jobTitle,
            @RequestParam String department,
            @RequestParam List<String> requirements,
            @RequestParam(defaultValue = "professional") String tone) {
        GeneratedJobDescription result = jobDescriptionService.generate(jobTitle, department, requirements, tone);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/check-dei")
    public ResponseEntity<Map<String, Object>> checkDeiLanguage(@RequestBody String content) {
        Map<String, Object> result = jobDescriptionService.checkDeiLanguage(content);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/improve-inclusivity")
    public ResponseEntity<Map<String, String>> improveInclusivity(@RequestBody String content) {
        String improved = jobDescriptionService.improveInclusivity(content);
        return ResponseEntity.ok(Map.of("improvedContent", improved));
    }

    @PostMapping("/readability-score")
    public ResponseEntity<Map<String, Double>> getReadabilityScore(@RequestBody String content) {
        double score = jobDescriptionService.getReadabilityScore(content);
        return ResponseEntity.ok(Map.of("readabilityScore", score));
    }
}
