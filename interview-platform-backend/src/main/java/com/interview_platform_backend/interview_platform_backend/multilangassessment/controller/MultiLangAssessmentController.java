package com.interview_platform_backend.interview_platform_backend.multilangassessment.controller;

import com.interview_platform_backend.interview_platform_backend.multilangassessment.entity.AssessmentLanguage;
import com.interview_platform_backend.interview_platform_backend.multilangassessment.service.MultiLangAssessmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/assessment-languages")
@RequiredArgsConstructor
public class MultiLangAssessmentController {

    private final MultiLangAssessmentService multiLangAssessmentService;

    @GetMapping
    public ResponseEntity<List<AssessmentLanguage>> getSupportedLanguages() {
        log.info("GET /api/v1/assessment-languages");
        return ResponseEntity.ok(multiLangAssessmentService.getSupportedLanguages());
    }

    @GetMapping("/{code}")
    public ResponseEntity<AssessmentLanguage> getLanguageConfig(@PathVariable String code) {
        log.info("GET /api/v1/assessment-languages/{}", code);
        return ResponseEntity.ok(multiLangAssessmentService.getLanguageConfig(code));
    }

    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeCode(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String language = request.get("language");
        String input = request.getOrDefault("input", "");
        log.info("POST /api/v1/assessment-languages/execute language={}", language);
        Map<String, Object> result = multiLangAssessmentService.executeCode(code, language, input);
        return ResponseEntity.ok(result);
    }
}
