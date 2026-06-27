package com.interview_platform_backend.interview_platform_backend.campusrecruiting.controller;

import com.interview_platform_backend.interview_platform_backend.campusrecruiting.entity.CampusEvent;
import com.interview_platform_backend.interview_platform_backend.campusrecruiting.service.CampusRecruitingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campus-recruiting")
@RequiredArgsConstructor
public class CampusRecruitingController {

    private final CampusRecruitingService campusRecruitingService;

    @PostMapping("/events")
    public ResponseEntity<CampusEvent> createEvent(@RequestBody Map<String, Object> request) {
        CampusEvent event = campusRecruitingService.createEvent(
                (String) request.get("universityName"),
                Instant.parse((String) request.get("eventDate")),
                (String) request.get("location"),
                UUID.fromString((String) request.get("coordinatorId")),
                (Integer) request.get("maxCandidates"),
                (String) request.get("cohortTag"),
                (String) request.get("notes")
        );
        return ResponseEntity.ok(event);
    }

    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<CampusEvent> registerCandidate(
            @PathVariable UUID eventId,
            @RequestParam UUID candidateId) {
        CampusEvent event = campusRecruitingService.registerCandidate(eventId, candidateId);
        return ResponseEntity.ok(event);
    }

    @PostMapping("/events/{eventId}/bulk-schedule")
    public ResponseEntity<Void> bulkScheduleInterviews(
            @PathVariable UUID eventId,
            @RequestBody List<UUID> candidateIds) {
        campusRecruitingService.bulkScheduleInterviews(eventId, candidateIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cohorts/{cohortTag}")
    public ResponseEntity<List<CampusEvent>> getCohort(@PathVariable String cohortTag) {
        List<CampusEvent> events = campusRecruitingService.getCohort(cohortTag);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/universities/{universityName}")
    public ResponseEntity<List<CampusEvent>> listByUniversity(@PathVariable String universityName) {
        List<CampusEvent> events = campusRecruitingService.listByUniversity(universityName);
        return ResponseEntity.ok(events);
    }
}
