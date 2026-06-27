package com.interview_platform_backend.interview_platform_backend.bugbounty.controller;

import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountyProgram;
import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountySubmission;
import com.interview_platform_backend.interview_platform_backend.bugbounty.service.BugBountyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/bug-bounty")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class BugBountyController {

    private final BugBountyService bugBountyService;

    @PostMapping("/programs")
    public ResponseEntity<BugBountyProgram> createProgram(@RequestBody BugBountyProgram program) {
        log.info("REST: Creating bug bounty program: {}", program.getProgramName());
        BugBountyProgram created = bugBountyService.createProgram(program);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/programs")
    public ResponseEntity<List<BugBountyProgram>> getAllPrograms() {
        return ResponseEntity.ok(bugBountyService.getAllPrograms());
    }

    @GetMapping("/programs/{id}")
    public ResponseEntity<BugBountyProgram> getProgram(@PathVariable UUID id) {
        return bugBountyService.getProgram(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/programs/{id}/activate")
    public ResponseEntity<BugBountyProgram> activateProgram(@PathVariable UUID id) {
        log.info("REST: Activating program {}", id);
        BugBountyProgram activated = bugBountyService.activateProgram(id);
        return ResponseEntity.ok(activated);
    }

    @PostMapping("/programs/{id}/submissions")
    public ResponseEntity<BugBountySubmission> submitReport(
            @PathVariable UUID id,
            @RequestBody BugBountySubmission submission) {
        log.info("REST: New submission for program {}", id);
        BugBountySubmission created = bugBountyService.submitReport(id, submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/programs/{id}/submissions")
    public ResponseEntity<List<BugBountySubmission>> getSubmissions(@PathVariable UUID id) {
        return ResponseEntity.ok(bugBountyService.getSubmissionsByProgram(id));
    }

    @PatchMapping("/submissions/{id}/triage")
    public ResponseEntity<BugBountySubmission> triageSubmission(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        BugBountySubmission.SubmissionStatus status = BugBountySubmission.SubmissionStatus.valueOf(body.get("status"));
        BugBountySubmission triaged = bugBountyService.triageSubmission(id, status);
        return ResponseEntity.ok(triaged);
    }

    @PostMapping("/submissions/{id}/resolve")
    public ResponseEntity<BugBountySubmission> resolveSubmission(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        double reward = ((Number) body.get("reward")).doubleValue();
        BugBountySubmission resolved = bugBountyService.resolveSubmission(id, reward);
        return ResponseEntity.ok(resolved);
    }

    @GetMapping("/programs/{id}/stats")
    public ResponseEntity<Map<String, Object>> getProgramStats(@PathVariable UUID id) {
        return ResponseEntity.ok(bugBountyService.getProgramStats(id));
    }

    @GetMapping("/programs/{id}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@PathVariable UUID id) {
        return ResponseEntity.ok(bugBountyService.getLeaderboard(id));
    }
}
