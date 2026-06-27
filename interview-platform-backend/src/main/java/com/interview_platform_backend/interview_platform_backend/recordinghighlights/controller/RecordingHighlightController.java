package com.interview_platform_backend.interview_platform_backend.recordinghighlights.controller;

import com.interview_platform_backend.interview_platform_backend.recordinghighlights.entity.RecordingHighlight;
import com.interview_platform_backend.interview_platform_backend.recordinghighlights.service.RecordingHighlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recording-highlights")
@RequiredArgsConstructor
public class RecordingHighlightController {

    private final RecordingHighlightService recordingHighlightService;

    @PostMapping("/generate")
    public ResponseEntity<List<RecordingHighlight>> generateHighlights(@RequestBody Map<String, Object> request) {
        List<RecordingHighlight> highlights = recordingHighlightService.generateHighlights(
                UUID.fromString((String) request.get("recordingId")),
                UUID.fromString((String) request.get("interviewId")),
                (String) request.get("transcript")
        );
        return ResponseEntity.ok(highlights);
    }

    @GetMapping("/recordings/{recordingId}")
    public ResponseEntity<List<RecordingHighlight>> getHighlights(@PathVariable UUID recordingId) {
        List<RecordingHighlight> highlights = recordingHighlightService.getHighlights(recordingId);
        return ResponseEntity.ok(highlights);
    }

    @GetMapping("/interviews/{interviewId}")
    public ResponseEntity<List<RecordingHighlight>> getByInterview(@PathVariable UUID interviewId) {
        List<RecordingHighlight> highlights = recordingHighlightService.getByInterview(interviewId);
        return ResponseEntity.ok(highlights);
    }

    @PostMapping("/bookmark")
    public ResponseEntity<RecordingHighlight> bookmarkClip(@RequestBody Map<String, Object> request) {
        RecordingHighlight highlight = recordingHighlightService.bookmarkClip(
                UUID.fromString((String) request.get("recordingId")),
                UUID.fromString((String) request.get("interviewId")),
                RecordingHighlight.HighlightType.valueOf((String) request.get("type")),
                ((Number) request.get("startTimeMs")).longValue(),
                ((Number) request.get("endTimeMs")).longValue(),
                (String) request.get("transcript"),
                (String) request.get("reason")
        );
        return ResponseEntity.ok(highlight);
    }
}
