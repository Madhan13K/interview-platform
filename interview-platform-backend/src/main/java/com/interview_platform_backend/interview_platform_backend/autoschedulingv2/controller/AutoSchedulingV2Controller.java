package com.interview_platform_backend.interview_platform_backend.autoschedulingv2.controller;

import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity.AutoScheduleRequest;
import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.service.AutoSchedulingV2Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auto-scheduling")
@Tag(name = "Auto Scheduling V2", description = "AI-powered interview scheduling automation")
@PreAuthorize("isAuthenticated()")
public class AutoSchedulingV2Controller {

    private final AutoSchedulingV2Service autoSchedulingV2Service;

    public AutoSchedulingV2Controller(AutoSchedulingV2Service autoSchedulingV2Service) {
        this.autoSchedulingV2Service = autoSchedulingV2Service;
    }

    @Operation(summary = "Request auto-scheduling for an interview")
    @PostMapping
    public ResponseEntity<AutoScheduleRequest> requestAutoSchedule(
            @RequestParam UUID interviewId,
            @RequestParam UUID candidateId,
            @RequestParam List<UUID> interviewerIds,
            @RequestParam int duration) {
        AutoScheduleRequest created = autoSchedulingV2Service.requestAutoSchedule(
                interviewId, candidateId, interviewerIds, duration);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Propose a time slot using AI")
    @PostMapping("/{requestId}/propose")
    public ResponseEntity<AutoScheduleRequest> proposeSlot(@PathVariable UUID requestId) {
        return ResponseEntity.ok(autoSchedulingV2Service.proposeSlot(requestId));
    }

    @Operation(summary = "Auto-confirm the proposed slot")
    @PostMapping("/{requestId}/confirm")
    public ResponseEntity<AutoScheduleRequest> autoConfirm(@PathVariable UUID requestId) {
        return ResponseEntity.ok(autoSchedulingV2Service.autoConfirm(requestId));
    }

    @Operation(summary = "Reschedule after decline")
    @PostMapping("/{requestId}/reschedule")
    public ResponseEntity<AutoScheduleRequest> autoReschedule(
            @PathVariable UUID requestId,
            @RequestParam String declineReason) {
        return ResponseEntity.ok(autoSchedulingV2Service.autoReschedule(requestId, declineReason));
    }

    @Operation(summary = "Get scheduling request status")
    @GetMapping("/{requestId}")
    public ResponseEntity<AutoScheduleRequest> getStatus(@PathVariable UUID requestId) {
        return ResponseEntity.ok(autoSchedulingV2Service.getStatus(requestId));
    }
}
