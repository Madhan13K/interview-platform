package com.interview_platform_backend.interview_platform_backend.debrief.controller;

import com.interview_platform_backend.interview_platform_backend.debrief.entity.DebriefSession;
import com.interview_platform_backend.interview_platform_backend.debrief.entity.DebriefVote;
import com.interview_platform_backend.interview_platform_backend.debrief.service.DebriefService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/debrief")
@RequiredArgsConstructor
public class DebriefController {

    private final DebriefService debriefService;

    @PostMapping
    public ResponseEntity<DebriefSession> createSession(@RequestBody DebriefSession session) {
        return ResponseEntity.ok(debriefService.createSession(session));
    }

    @PostMapping("/{sessionId}/vote")
    public ResponseEntity<DebriefVote> submitVote(@PathVariable UUID sessionId, @RequestBody DebriefVote vote) {
        vote.setSessionId(sessionId);
        return ResponseEntity.ok(debriefService.submitVote(vote));
    }

    @PutMapping("/{sessionId}/calibrate")
    public ResponseEntity<DebriefSession> calibrate(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(debriefService.calibrate(sessionId));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<DebriefSession> getResults(@PathVariable UUID sessionId) {
        DebriefSession session = debriefService.getResults(sessionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }
}
