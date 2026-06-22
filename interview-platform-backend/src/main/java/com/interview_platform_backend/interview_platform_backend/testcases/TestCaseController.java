package com.interview_platform_backend.interview_platform_backend.testcases;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test-cases")
@PreAuthorize("isAuthenticated()")
public class TestCaseController {

    private final TestCaseValidationService validationService;

    public TestCaseController(TestCaseValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/validate")
    public ResponseEntity<TestCaseValidationService.ValidationResult> validateSubmission(
            @RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        String language = (String) request.getOrDefault("language", "python");
        int timeLimit = (int) request.getOrDefault("timeLimitMs", 10000);

        List<Map<String, Object>> testCasesRaw = (List<Map<String, Object>>) request.get("testCases");
        List<TestCaseValidationService.TestCase> testCases = testCasesRaw.stream()
                .map(tc -> new TestCaseValidationService.TestCase(
                        (String) tc.getOrDefault("input", ""),
                        (String) tc.getOrDefault("expectedOutput", ""),
                        Boolean.TRUE.equals(tc.get("isHidden")),
                        (String) tc.getOrDefault("description", ""),
                        (int) tc.getOrDefault("points", 1)
                ))
                .toList();

        return ResponseEntity.ok(validationService.validateSubmission(code, language, testCases, timeLimit));
    }
}
