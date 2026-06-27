package com.interview_platform_backend.interview_platform_backend.asyncvideov2.controller;

import com.interview_platform_backend.interview_platform_backend.asyncvideov2.entity.AsyncVideoSession;
import com.interview_platform_backend.interview_platform_backend.asyncvideov2.service.AsyncVideoV2Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/async-video")
@RequiredArgsConstructor
public class AsyncVideoV2Controller {

    private final AsyncVideoV2Service asyncVideoV2Service;

    @PostMapping
    public ResponseEntity<AsyncVideoSession> createSession(@RequestBody AsyncVideoSession session) {
        AsyncVideoSession created = asyncVideoV2Service.createSession(session);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AsyncVideoSession> getSession(@PathVariable UUID id) {
        AsyncVideoSession session = asyncVideoV2Service.getSession(id);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<AsyncVideoSession>> listByCandidateId(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(asyncVideoV2Service.listByCandidateId(candidateId));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<AsyncVideoSession> submitResponse(@PathVariable UUID id, @RequestBody String responseData) {
        return ResponseEntity.ok(asyncVideoV2Service.submitResponse(id, responseData));
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<AsyncVideoSession> scoreWithAI(@PathVariable UUID id) {
        return ResponseEntity.ok(asyncVideoV2Service.scoreWithAI(id));
    }
}
