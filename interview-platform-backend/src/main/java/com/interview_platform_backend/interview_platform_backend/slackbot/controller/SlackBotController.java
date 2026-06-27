package com.interview_platform_backend.interview_platform_backend.slackbot.controller;

import com.interview_platform_backend.interview_platform_backend.slackbot.service.SlackBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/slack")
@RequiredArgsConstructor
public class SlackBotController {

    private final SlackBotService slackBotService;

    @PostMapping("/commands")
    public ResponseEntity<Map<String, Object>> handleSlashCommand(
            @RequestParam("command") String command,
            @RequestParam Map<String, String> params) {
        Map<String, Object> response = slackBotService.handleSlashCommand(command, params);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interactions")
    public ResponseEntity<Map<String, Object>> handleInteraction(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = slackBotService.processInteraction(payload);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> handleEvent(@RequestBody Map<String, Object> payload) {
        // Handle Slack URL verification challenge
        if ("url_verification".equals(payload.get("type"))) {
            return ResponseEntity.ok(Map.of("challenge", payload.getOrDefault("challenge", "")));
        }

        // Process event
        Map<String, Object> response = slackBotService.processInteraction(payload);
        return ResponseEntity.ok(response);
    }
}
