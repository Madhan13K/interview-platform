package com.interview_platform_backend.interview_platform_backend.smartemail.controller;

import com.interview_platform_backend.interview_platform_backend.smartemail.entity.EmailSchedule;
import com.interview_platform_backend.interview_platform_backend.smartemail.service.SmartEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/smart-email")
@RequiredArgsConstructor
public class SmartEmailController {

    private final SmartEmailService smartEmailService;

    @PostMapping("/schedule")
    public ResponseEntity<EmailSchedule> scheduleEmail(@RequestBody Map<String, Object> request) {
        EmailSchedule schedule = smartEmailService.scheduleEmail(
                (String) request.get("recipientEmail"),
                (String) request.get("subject"),
                (String) request.get("templateId"),
                Instant.parse((String) request.get("scheduledAt")),
                (String) request.getOrDefault("timezone", "UTC")
        );
        return ResponseEntity.ok(schedule);
    }

    @PostMapping("/{emailId}/cancel")
    public ResponseEntity<EmailSchedule> cancelScheduled(@PathVariable UUID emailId) {
        EmailSchedule schedule = smartEmailService.cancelScheduled(emailId);
        return ResponseEntity.ok(schedule);
    }

    @GetMapping("/history")
    public ResponseEntity<List<EmailSchedule>> getSendHistory(@RequestParam String recipientEmail) {
        List<EmailSchedule> history = smartEmailService.getSendHistory(recipientEmail);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/optimal-time")
    public ResponseEntity<Map<String, Object>> getOptimalTime(
            @RequestParam String recipientEmail,
            @RequestParam String timezone,
            @RequestParam String requestedTime) {
        Instant optimal = smartEmailService.calculateOptimalTime(
                recipientEmail, timezone, Instant.parse(requestedTime));
        return ResponseEntity.ok(Map.of(
                "recipientEmail", recipientEmail,
                "requestedTime", requestedTime,
                "optimalSendTime", optimal.toString()
        ));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<EmailSchedule>> getPendingEmails() {
        List<EmailSchedule> pending = smartEmailService.getPendingEmails();
        return ResponseEntity.ok(pending);
    }
}
