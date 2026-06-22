package com.interview_platform_backend.interview_platform_backend.webrtc;

import com.interview_platform_backend.interview_platform_backend.security.jwt.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/video/webrtc")
@PreAuthorize("isAuthenticated()")
public class WebRTCController {

    private final WebRTCSignalingService signalingService;

    public WebRTCController(WebRTCSignalingService signalingService) {
        this.signalingService = signalingService;
    }

    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<WebRTCSignalingService.RoomInfo> joinRoom(
            @PathVariable String roomId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        var roomInfo = signalingService.joinRoom(
                roomId,
                request.getOrDefault("sessionId", java.util.UUID.randomUUID().toString()),
                userDetails.getUserId().toString(),
                request.getOrDefault("displayName", userDetails.getUsername())
        );
        return ResponseEntity.ok(roomInfo);
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable String roomId,
            @RequestBody Map<String, String> request) {
        signalingService.leaveRoom(roomId, request.get("sessionId"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomId}/status")
    public ResponseEntity<Map<String, Object>> getRoomStatus(@PathVariable String roomId) {
        return ResponseEntity.ok(signalingService.getRoomStatus(roomId));
    }

    @GetMapping("/ice-servers")
    public ResponseEntity<List<Map<String, Object>>> getIceServers() {
        return ResponseEntity.ok(signalingService.getIceServers());
    }
}
