package com.interview_platform_backend.interview_platform_backend.emaildigest.controller;

import com.interview_platform_backend.interview_platform_backend.emaildigest.entity.EmailDigest;
import com.interview_platform_backend.interview_platform_backend.emaildigest.service.EmailDigestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/email-digest")
@RequiredArgsConstructor
public class EmailDigestController {

    private final EmailDigestService emailDigestService;

    @GetMapping("/history")
    public ResponseEntity<List<EmailDigest>> getDigestHistory(@RequestParam UUID userId) {
        log.info("GET /api/v1/email-digest/history?userId={}", userId);
        return ResponseEntity.ok(emailDigestService.getDigestHistory(userId));
    }

    @PostMapping("/trigger")
    public ResponseEntity<EmailDigest> triggerDigest(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        String type = request.getOrDefault("type", "DAILY");
        log.info("POST /api/v1/email-digest/trigger userId={} type={}", userId, type);
        EmailDigest digest = emailDigestService.generateDigest(userId, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(digest);
    }
}
