package com.interview_platform_backend.interview_platform_backend.reportbuilder.controller;

import com.interview_platform_backend.interview_platform_backend.reportbuilder.dto.ReportTemplate;
import com.interview_platform_backend.interview_platform_backend.reportbuilder.service.ReportBuilderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/report-builder")
@PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
public class ReportBuilderController {

    private final ReportBuilderService reportBuilderService;

    public ReportBuilderController(ReportBuilderService reportBuilderService) {
        this.reportBuilderService = reportBuilderService;
    }

    @PostMapping
    public ResponseEntity<ReportTemplate> createTemplate(@RequestBody ReportTemplate template) {
        ReportTemplate created = reportBuilderService.createTemplate(template);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<ReportTemplate>> listTemplates() {
        return ResponseEntity.ok(reportBuilderService.listTemplates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportTemplate> getTemplate(@PathVariable UUID id) {
        ReportTemplate template = reportBuilderService.getTemplate(id);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(template);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReportTemplate> updateTemplate(
            @PathVariable UUID id,
            @RequestBody ReportTemplate template) {
        ReportTemplate updated = reportBuilderService.updateTemplate(id, template);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        reportBuilderService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<Map<String, Object>> generateReport(@PathVariable UUID id) {
        Map<String, Object> reportData = reportBuilderService.generateReport(id);
        return ResponseEntity.ok(reportData);
    }
}
