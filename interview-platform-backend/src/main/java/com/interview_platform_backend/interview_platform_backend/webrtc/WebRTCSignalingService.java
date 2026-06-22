package com.interview_platform_backend.interview_platform_backend.webrtc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Native WebRTC Signaling Service.
 * Provides built-in video interviewing without Zoom/Meet dependency.
 * Handles:
 * - ICE candidate exchange
 * - SDP offer/answer negotiation
 * - Room management (participants, media tracks)
 * - TURN/STUN server configuration
 */
@Service
public class WebRTCSignalingService {

    private static final Logger log = LoggerFactory.getLogger(WebRTCSignalingService.class);

    private final SimpMessagingTemplate messagingTemplate;

    // Room -> Set of participant session IDs
    private final ConcurrentHashMap<String, Set<String>> rooms = new ConcurrentHashMap<>();

    // Session ID -> User info
    private final ConcurrentHashMap<String, ParticipantInfo> participants = new ConcurrentHashMap<>();

    public WebRTCSignalingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Join a video room (creates room if doesn't exist).
     */
    public RoomInfo joinRoom(String roomId, String sessionId, String userId, String displayName) {
        rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        rooms.get(roomId).add(sessionId);

        participants.put(sessionId, new ParticipantInfo(userId, displayName, roomId));

        // Notify existing participants about new joiner
        broadcastToRoom(roomId, sessionId, Map.of(
                "type", "peer-joined",
                "sessionId", sessionId,
                "userId", userId,
                "displayName", displayName
        ));

        log.info("User {} joined room {} (session: {})", displayName, roomId, sessionId);

        Set<String> roomParticipants = rooms.get(roomId);
        List<Map<String, String>> participantList = roomParticipants.stream()
                .filter(s -> !s.equals(sessionId))
                .map(s -> {
                    ParticipantInfo info = participants.get(s);
                    return info != null ? Map.of("sessionId", s, "userId", info.userId(), "displayName", info.displayName())
                            : Map.of("sessionId", s, "userId", "unknown", "displayName", "Unknown");
                })
                .toList();

        return new RoomInfo(roomId, participantList, getIceServers());
    }

    /**
     * Leave a video room.
     */
    public void leaveRoom(String roomId, String sessionId) {
        Set<String> room = rooms.get(roomId);
        if (room != null) {
            room.remove(sessionId);
            if (room.isEmpty()) {
                rooms.remove(roomId);
            }
        }

        ParticipantInfo info = participants.remove(sessionId);

        broadcastToRoom(roomId, sessionId, Map.of(
                "type", "peer-left",
                "sessionId", sessionId,
                "userId", info != null ? info.userId() : "unknown"
        ));

        log.info("Session {} left room {}", sessionId, roomId);
    }

    /**
     * Relay an SDP offer/answer between peers.
     */
    public void relaySignal(String roomId, String fromSession, String toSession, Map<String, Object> signal) {
        signal.put("from", fromSession);
        messagingTemplate.convertAndSend(
                "/topic/interview/" + roomId + "/signal/" + toSession,
                (Object) signal
        );
    }

    /**
     * Relay ICE candidate between peers.
     */
    public void relayIceCandidate(String roomId, String fromSession, String toSession, Map<String, Object> candidate) {
        candidate.put("from", fromSession);
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("type", "ice-candidate");
        payload.put("candidate", candidate);
        payload.put("from", fromSession);
        messagingTemplate.convertAndSend(
                "/topic/interview/" + roomId + "/signal/" + toSession,
                (Object) payload
        );
    }

    /**
     * Get TURN/STUN server configuration for clients.
     */
    public List<Map<String, Object>> getIceServers() {
        // Public STUN servers + configurable TURN server
        return List.of(
                Map.of("urls", List.of("stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302")),
                Map.of("urls", List.of("stun:stun.services.mozilla.com"))
                // Add TURN server config from environment in production:
                // Map.of("urls", "turn:your-turn-server.com:3478", "username", "...", "credential", "...")
        );
    }

    /**
     * Get current room status.
     */
    public Map<String, Object> getRoomStatus(String roomId) {
        Set<String> room = rooms.get(roomId);
        if (room == null) return Map.of("exists", false, "participants", 0);
        return Map.of(
                "exists", true,
                "participants", room.size(),
                "participantIds", room.stream().toList()
        );
    }

    private void broadcastToRoom(String roomId, String excludeSession, Map<String, Object> message) {
        messagingTemplate.convertAndSend("/topic/interview/" + roomId + "/signal", (Object) message);
    }

    public record ParticipantInfo(String userId, String displayName, String roomId) {}
    public record RoomInfo(String roomId, List<Map<String, String>> existingParticipants, List<Map<String, Object>> iceServers) {}
}
