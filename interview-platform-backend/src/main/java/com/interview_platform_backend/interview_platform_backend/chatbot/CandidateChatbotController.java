package com.interview_platform_backend.interview_platform_backend.chatbot;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chatbot")
@PreAuthorize("isAuthenticated()")
public class CandidateChatbotController {

    private final CandidateChatbotService chatbotService;

    public CandidateChatbotController(CandidateChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/message")
    public ResponseEntity<CandidateChatbotService.ChatResponse> sendMessage(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String message = (String) request.get("message");
        List<Map<String, String>> historyRaw = (List<Map<String, String>>) request.get("history");

        List<CandidateChatbotService.ChatMessage> history = historyRaw != null ?
                historyRaw.stream()
                        .map(m -> new CandidateChatbotService.ChatMessage(m.get("role"), m.get("content")))
                        .toList() : List.of();

        var response = chatbotService.processMessage(UUID.fromString(userDetails.getUsername()), message, history);
        return ResponseEntity.ok(response);
    }
}
