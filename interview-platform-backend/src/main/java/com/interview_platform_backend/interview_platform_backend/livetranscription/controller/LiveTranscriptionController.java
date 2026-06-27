package com.interview_platform_backend.interview_platform_backend.livetranscription.controller;

import com.interview_platform_backend.interview_platform_backend.livetranscription.dto.TranscriptionConfig;
import com.interview_platform_backend.interview_platform_backend.livetranscription.dto.TranscriptionEvent;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSegment;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSession;
import com.interview_platform_backend.interview_platform_backend.livetranscription.service.LiveScoringService;
import com.interview_platform_backend.interview_platform_backend.livetranscription.service.LiveTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/transcription")
@RequiredArgsConstructor
public class LiveTranscriptionController {

    private static final Logger log = LoggerFactory.getLogger(LiveTranscriptionController.class);

    private final LiveTranscriptionService transcriptionService;
    private final LiveScoringService scoringService;

    @PostMapping("/start")
    public ResponseEntity<TranscriptionSession> startSession(@RequestBody TranscriptionConfig config) {
        log.info("Starting transcription session for interview: {}", config.getInterviewId());
        TranscriptionSession session = transcriptionService.startSession(config);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<TranscriptionSession> endSession(@PathVariable UUID sessionId) {
        log.info("Ending transcription session: {}", sessionId);
        TranscriptionSession session = transcriptionService.endSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSession(@PathVariable UUID sessionId) {
        List<TranscriptionSegment> segments = transcriptionService.getTranscript(sessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("segments", segments);
        response.put("totalSegments", segments.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<TranscriptionSession> getByInterview(@PathVariable UUID interviewId) {
        TranscriptionSession session = transcriptionService.getSessionByInterview(interviewId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{sessionId}/segments")
    public ResponseEntity<List<TranscriptionSegment>> getSegments(@PathVariable UUID sessionId) {
        List<TranscriptionSegment> segments = transcriptionService.getTranscript(sessionId);
        return ResponseEntity.ok(segments);
    }

    @PostMapping("/{sessionId}/score")
    public ResponseEntity<Map<String, Object>> scoreLatestSegments(
            @PathVariable UUID sessionId,
            @RequestParam(required = false) String jobTitle) {
        List<TranscriptionSegment> segments = transcriptionService.getTranscript(sessionId);

        if (segments.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No segments to score"));
        }

        List<Map<String, Object>> segmentScores = new ArrayList<>();
        int startIdx = Math.max(0, segments.size() - 5);

        for (int i = startIdx; i < segments.size(); i++) {
            TranscriptionSegment segment = segments.get(i);
            if (segment.isFinal()) {
                Map<String, Object> score = scoringService.scoreSegment(segment, jobTitle);
                segmentScores.add(score);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("scoredSegments", segmentScores.size());
        response.put("scores", segmentScores);

        return ResponseEntity.ok(response);
    }
}
