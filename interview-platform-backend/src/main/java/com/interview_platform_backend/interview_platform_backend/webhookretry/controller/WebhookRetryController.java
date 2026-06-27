package com.interview_platform_backend.interview_platform_backend.webhookretry.controller;

import com.interview_platform_backend.interview_platform_backend.webhookretry.entity.WebhookRetryQueue;
import com.interview_platform_backend.interview_platform_backend.webhookretry.service.WebhookRetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhook-retry")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WebhookRetryController {

    private final WebhookRetryService webhookRetryService;

    @GetMapping("/queue")
    public ResponseEntity<List<WebhookRetryQueue>> getQueue() {
        log.info("GET /api/v1/webhook-retry/queue");
        return ResponseEntity.ok(webhookRetryService.getQueue());
    }

    @GetMapping("/dead-letter")
    public ResponseEntity<List<WebhookRetryQueue>> getDeadLetterQueue() {
        log.info("GET /api/v1/webhook-retry/dead-letter");
        return ResponseEntity.ok(webhookRetryService.getDeadLetterQueue());
    }

    @PostMapping("/{id}/replay")
    public ResponseEntity<WebhookRetryQueue> replayDeadLetter(@PathVariable UUID id) {
        log.info("POST /api/v1/webhook-retry/{}/replay", id);
        WebhookRetryQueue replayed = webhookRetryService.replayDeadLetter(id);
        return ResponseEntity.ok(replayed);
    }
}
