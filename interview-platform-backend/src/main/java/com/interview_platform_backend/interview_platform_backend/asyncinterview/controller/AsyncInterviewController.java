package com.interview_platform_backend.interview_platform_backend.asyncinterview.controller;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.dto.*;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewInvitation;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewResponse;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterviewReview;
import com.interview_platform_backend.interview_platform_backend.asyncinterview.service.AsyncInterviewService;
import com.interview_platform_backend.interview_platform_backend.security.util.SecurityHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/async-interviews")
@Tag(name = "Async Video Interviews", description = "Manage asynchronous one-way video interviews")
public class AsyncInterviewController {

    private final AsyncInterviewService asyncInterviewService;
    private final SecurityHelper securityHelper;

    public AsyncInterviewController(AsyncInterviewService asyncInterviewService,
                                    SecurityHelper securityHelper) {
        this.asyncInterviewService = asyncInterviewService;
        this.securityHelper = securityHelper;
    }

    @Operation(summary = "Create a new async interview",
            description = "Creates a new async video interview with questions")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Interview created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    @PostMapping
    public ResponseEntity<AsyncInterviewResponseDto> createInterview(
            @RequestBody @Valid AsyncInterviewRequest request) {
        UUID userId = securityHelper.getCurrentUserId();
        AsyncInterviewResponseDto response = asyncInterviewService.createAsyncInterview(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Publish an async interview",
            description = "Changes interview status from DRAFT to PUBLISHED, making it available for invitations")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interview published successfully"),
            @ApiResponse(responseCode = "400", description = "Interview is not in DRAFT status"),
            @ApiResponse(responseCode = "404", description = "Interview not found")
    })
    @PostMapping("/{id}/publish")
    public ResponseEntity<AsyncInterviewResponseDto> publishInterview(@PathVariable UUID id) {
        return ResponseEntity.ok(asyncInterviewService.publishInterview(id));
    }

    @Operation(summary = "Invite a candidate to an async interview",
            description = "Sends an invitation to a candidate to complete the async interview")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Candidate invited successfully"),
            @ApiResponse(responseCode = "400", description = "Interview is not published or invalid email"),
            @ApiResponse(responseCode = "404", description = "Interview or candidate not found")
    })
    @PostMapping("/{id}/invite")
    public ResponseEntity<Map<String, Object>> inviteCandidate(
            @PathVariable UUID id,
            @RequestBody @Valid InviteCandidateRequest request) {
        UUID userId = securityHelper.getCurrentUserId();
        AsyncInterviewInvitation invitation = asyncInterviewService.inviteCandidate(
                id, request.getCandidateEmail(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "invitationId", invitation.getId(),
                "inviteToken", invitation.getInviteToken(),
                "candidateEmail", invitation.getCandidateEmail(),
                "status", invitation.getStatus()
        ));
    }

    @Operation(summary = "Get async interview details",
            description = "Returns full details of an async interview including questions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interview details retrieved"),
            @ApiResponse(responseCode = "404", description = "Interview not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<AsyncInterviewResponseDto> getInterview(@PathVariable UUID id) {
        return ResponseEntity.ok(asyncInterviewService.getInterview(id));
    }

    @Operation(summary = "List async interviews",
            description = "Returns a list of async interviews, optionally filtered by status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interviews retrieved successfully")
    })
    @GetMapping
    public ResponseEntity<List<AsyncInterviewResponseDto>> listInterviews(
            @RequestParam(required = false) String status) {
        UUID userId = securityHelper.getCurrentUserId();
        List<AsyncInterviewResponseDto> interviews;
        if (status != null && !status.isBlank()) {
            interviews = asyncInterviewService.getInterviewsByStatus(status);
        } else {
            interviews = asyncInterviewService.getInterviewsByCreator(userId);
        }
        return ResponseEntity.ok(interviews);
    }

    @Operation(summary = "Get interview questions for candidate",
            description = "Public endpoint - returns questions for a candidate using their invite token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Questions retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Invalid invite token")
    })
    @GetMapping("/respond/{token}")
    public ResponseEntity<AsyncInterviewResponseDto> getQuestionsForCandidate(
            @PathVariable String token) {
        return ResponseEntity.ok(asyncInterviewService.getInterviewByToken(token));
    }

    @Operation(summary = "Start recording session",
            description = "Marks the candidate's interview as STARTED")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interview started successfully"),
            @ApiResponse(responseCode = "400", description = "Interview already started or completed"),
            @ApiResponse(responseCode = "404", description = "Invalid invite token")
    })
    @PostMapping("/respond/{token}/start")
    public ResponseEntity<Map<String, String>> startInterview(@PathVariable String token) {
        asyncInterviewService.startInterview(token);
        return ResponseEntity.ok(Map.of("status", "STARTED", "message", "Interview started successfully"));
    }

    @Operation(summary = "Submit a video response",
            description = "Submits a recorded video response for a specific question")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Response submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Interview not started or retake limit exceeded"),
            @ApiResponse(responseCode = "404", description = "Invalid token or question not found")
    })
    @PostMapping("/respond/{token}/submit")
    public ResponseEntity<Map<String, Object>> submitResponse(
            @PathVariable String token,
            @RequestBody @Valid SubmitResponseRequest request) {
        AsyncInterviewResponse response = asyncInterviewService.submitResponse(
                token, request.getQuestionId(), request.getVideoS3Key(), request.getDurationSeconds());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "responseId", response.getId(),
                "questionId", request.getQuestionId(),
                "retakeNumber", response.getRetakeNumber(),
                "status", "SUBMITTED"
        ));
    }

    @Operation(summary = "Complete the async interview",
            description = "Marks the candidate's interview as COMPLETED")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interview completed successfully"),
            @ApiResponse(responseCode = "400", description = "Interview not in STARTED status"),
            @ApiResponse(responseCode = "404", description = "Invalid invite token")
    })
    @PostMapping("/respond/{token}/complete")
    public ResponseEntity<Map<String, String>> completeInterview(@PathVariable String token) {
        asyncInterviewService.completeInterview(token);
        return ResponseEntity.ok(Map.of("status", "COMPLETED", "message", "Interview completed successfully"));
    }

    @Operation(summary = "Get all responses for an interview",
            description = "Returns all video responses for a specific invitation (for reviewers)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Responses retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Invitation not found")
    })
    @GetMapping("/{id}/responses")
    public ResponseEntity<List<Map<String, Object>>> getResponses(@PathVariable UUID id) {
        List<AsyncInterviewResponse> responses = asyncInterviewService.getInterviewResponses(id);
        List<Map<String, Object>> responseMaps = responses.stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "questionId", r.getQuestion().getId(),
                        "videoS3Key", r.getVideoS3Key(),
                        "durationSeconds", r.getDurationSeconds() != null ? r.getDurationSeconds() : 0,
                        "retakeNumber", r.getRetakeNumber(),
                        "createdAt", r.getCreatedAt().toString()
                ))
                .toList();
        return ResponseEntity.ok(responseMaps);
    }

    @Operation(summary = "Submit a review for a candidate's responses",
            description = "Allows a reviewer to rate and provide feedback on a candidate's interview")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Review submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid review data"),
            @ApiResponse(responseCode = "404", description = "Invitation not found")
    })
    @PostMapping("/responses/{invitationId}/review")
    public ResponseEntity<Map<String, Object>> submitReview(
            @PathVariable UUID invitationId,
            @RequestBody @Valid SubmitReviewRequest request) {
        UUID reviewerId = securityHelper.getCurrentUserId();
        AsyncInterviewReview review = asyncInterviewService.submitReview(invitationId, reviewerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "reviewId", review.getId(),
                "overallRating", review.getOverallRating(),
                "decision", review.getDecision() != null ? review.getDecision() : "",
                "reviewedAt", review.getReviewedAt().toString()
        ));
    }

    @Operation(summary = "Close an async interview",
            description = "Marks a published interview as CLOSED, preventing new invitations")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Interview closed successfully"),
            @ApiResponse(responseCode = "400", description = "Interview is not in PUBLISHED status"),
            @ApiResponse(responseCode = "404", description = "Interview not found")
    })
    @PostMapping("/{id}/close")
    public ResponseEntity<AsyncInterviewResponseDto> closeInterview(@PathVariable UUID id) {
        return ResponseEntity.ok(asyncInterviewService.closeInterview(id));
    }
}
