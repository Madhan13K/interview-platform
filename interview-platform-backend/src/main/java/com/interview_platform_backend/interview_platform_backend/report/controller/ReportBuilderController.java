package com.interview_platform_backend.interview_platform_backend.report.controller;

import com.interview_platform_backend.interview_platform_backend.report.dto.*;
import com.interview_platform_backend.interview_platform_backend.report.entity.GeneratedReport;
import com.interview_platform_backend.interview_platform_backend.report.entity.ReportSchedule;
import com.interview_platform_backend.interview_platform_backend.report.service.ReportBuilderService;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Report Builder", description = "Custom report templates, on-demand generation (PDF/Excel/CSV), and scheduled reports with email delivery.")
public class ReportBuilderController {

    private final ReportBuilderService reportBuilderService;
    private final UserRepository userRepository;

    public ReportBuilderController(ReportBuilderService reportBuilderService, UserRepository userRepository) {
        this.reportBuilderService = reportBuilderService;
        this.userRepository = userRepository;
    }

    // ---- Templates ----

    @Operation(summary = "Create a report template")
    @PostMapping("/templates")
    public ResponseEntity<ReportTemplateResponse> createTemplate(
            @RequestBody @Valid ReportTemplateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(reportBuilderService.createTemplate(request, userId));
    }

    @Operation(summary = "Update a report template")
    @PutMapping("/templates/{templateId}")
    public ResponseEntity<ReportTemplateResponse> updateTemplate(
            @PathVariable UUID templateId,
            @RequestBody @Valid ReportTemplateRequest request) {
        return ResponseEntity.ok(reportBuilderService.updateTemplate(templateId, request));
    }

    @Operation(summary = "Get a report template by ID")
    @GetMapping("/templates/{templateId}")
    public ResponseEntity<ReportTemplateResponse> getTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(reportBuilderService.getTemplate(templateId));
    }

    @Operation(summary = "List report templates (own + public)")
    @GetMapping("/templates")
    public ResponseEntity<Page<ReportTemplateResponse>> listTemplates(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = getUserId(userDetails);
        return ResponseEntity.ok(reportBuilderService.getTemplates(userId, page, size));
    }

    @Operation(summary = "Delete a report template")
    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID templateId) {
        reportBuilderService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    // ---- Generate ----

    @Operation(summary = "Generate a report from a template", description = "Triggers async report generation. Returns immediately with a report ID to poll status.")
    @PostMapping("/generate")
    public ResponseEntity<GeneratedReport> generateReport(
            @RequestBody @Valid GenerateReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        GeneratedReport report = reportBuilderService.createAndGenerateReport(request, userId);
        return ResponseEntity.accepted().body(report);
    }

    @Operation(summary = "List generated reports for current user")
    @GetMapping("/generated")
    public ResponseEntity<Page<GeneratedReport>> listGenerated(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = getUserId(userDetails);
        return ResponseEntity.ok(reportBuilderService.getGeneratedReports(userId, page, size));
    }

    // ---- Schedules ----

    @Operation(summary = "Schedule a recurring report")
    @PostMapping("/schedules")
    public ResponseEntity<ReportSchedule> createSchedule(
            @RequestBody @Valid ScheduleReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(reportBuilderService.createSchedule(request, userId));
    }

    private UUID getUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
