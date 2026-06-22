package com.interview_platform_backend.interview_platform_backend.messaging.controller;

import com.interview_platform_backend.interview_platform_backend.messaging.dto.*;
import com.interview_platform_backend.interview_platform_backend.messaging.service.MessagingService;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messaging")
@PreAuthorize("isAuthenticated()")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ConversationResponse response = messagingService.createConversation(request, UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messagingService.getMyConversations(UUID.fromString(userDetails.getUsername())));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        MessageResponse response = messagingService.sendMessage(conversationId, request, UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messagingService.getMessages(conversationId, UUID.fromString(userDetails.getUsername()), page, size));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID conversationId,
            @RequestParam UUID messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        messagingService.markAsRead(conversationId, UUID.fromString(userDetails.getUsername()), messageId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages/{messageId}/replies")
    public ResponseEntity<List<MessageResponse>> getThreadReplies(@PathVariable UUID messageId) {
        return ResponseEntity.ok(messagingService.getThreadReplies(messageId));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        messagingService.deleteMessage(messageId, UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.noContent().build();
    }
}
