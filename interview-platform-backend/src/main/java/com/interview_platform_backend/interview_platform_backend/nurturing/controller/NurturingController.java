package com.interview_platform_backend.interview_platform_backend.nurturing.controller;

import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence;
import com.interview_platform_backend.interview_platform_backend.nurturing.service.NurturingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nurturing")
@RequiredArgsConstructor
public class NurturingController {

    private final NurturingService nurturingService;

    @PostMapping("/sequences")
    public ResponseEntity<NurtureSequence> createSequence(@RequestBody NurtureSequence sequence) {
        NurtureSequence saved = nurturingService.createSequence(sequence);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/sequences/{sequenceId}/enroll")
    public ResponseEntity<NurtureEnrollment> enrollCandidate(@PathVariable UUID sequenceId,
                                                              @RequestParam UUID candidateId) {
        NurtureEnrollment enrollment = nurturingService.enrollCandidate(sequenceId, candidateId);
        return ResponseEntity.ok(enrollment);
    }

    @PostMapping("/enrollments/{enrollmentId}/unsubscribe")
    public ResponseEntity<NurtureEnrollment> unsubscribe(@PathVariable UUID enrollmentId) {
        NurtureEnrollment enrollment = nurturingService.unsubscribe(enrollmentId);
        return ResponseEntity.ok(enrollment);
    }

    @GetMapping("/sequences/{sequenceId}/stats")
    public ResponseEntity<Map<String, Object>> getSequenceStats(@PathVariable UUID sequenceId) {
        Map<String, Object> stats = nurturingService.getSequenceStats(sequenceId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/sequences/{sequenceId}/enrollments/active")
    public ResponseEntity<List<NurtureEnrollment>> getActiveEnrollments(@PathVariable UUID sequenceId) {
        List<NurtureEnrollment> enrollments = nurturingService.getActiveEnrollments(sequenceId);
        return ResponseEntity.ok(enrollments);
    }
}
