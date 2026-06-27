package com.interview_platform_backend.interview_platform_backend.calibration.controller;

import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport;
import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport.BiasIndicator;
import com.interview_platform_backend.interview_platform_backend.calibration.service.CalibrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calibration")
@RequiredArgsConstructor
public class CalibrationController {

    private final CalibrationService calibrationService;

    @PostMapping("/reports/{interviewerId}")
    public ResponseEntity<CalibrationReport> generateReport(@PathVariable UUID interviewerId) {
        CalibrationReport report = calibrationService.generateReport(interviewerId);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/compare")
    public ResponseEntity<List<CalibrationReport>> compareInterviewers(@RequestBody List<UUID> interviewerIds) {
        List<CalibrationReport> reports = calibrationService.compareInterviewers(interviewerIds);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/bias/{interviewerId}")
    public ResponseEntity<Map<String, String>> detectBias(@PathVariable UUID interviewerId) {
        BiasIndicator bias = calibrationService.detectBias(interviewerId);
        return ResponseEntity.ok(Map.of("interviewerId", interviewerId.toString(), "biasIndicator", bias.name()));
    }

    @GetMapping("/org/{orgId}")
    public ResponseEntity<List<CalibrationReport>> getOrgCalibration(@PathVariable UUID orgId) {
        List<CalibrationReport> reports = calibrationService.getOrgCalibration(orgId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/org/{orgId}/inflation-deflation")
    public ResponseEntity<Map<String, Object>> getInflationDeflation(@PathVariable UUID orgId) {
        Map<String, Object> result = calibrationService.getInflationDeflation(orgId);
        return ResponseEntity.ok(result);
    }
}
