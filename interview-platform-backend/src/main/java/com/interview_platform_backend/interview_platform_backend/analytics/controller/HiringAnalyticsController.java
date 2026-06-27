package com.interview_platform_backend.interview_platform_backend.analytics.controller;

import com.interview_platform_backend.interview_platform_backend.analytics.dto.*;
import com.interview_platform_backend.interview_platform_backend.analytics.service.HiringAnalyticsService;
import com.interview_platform_backend.interview_platform_backend.analytics.service.MLPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Hiring Analytics", description = "Hiring funnel analytics, conversion rates, dropout analysis, and ML predictions")
public class HiringAnalyticsController {

    private final HiringAnalyticsService analyticsService;
    private final MLPredictionService mlPredictionService;

    public HiringAnalyticsController(HiringAnalyticsService analyticsService,
                                     MLPredictionService mlPredictionService) {
        this.analyticsService = analyticsService;
        this.mlPredictionService = mlPredictionService;
    }

    @GetMapping("/funnel")
    @Operation(summary = "Get funnel overview", description = "Returns hiring funnel metrics overview for an organization filtered by period type")
    public ResponseEntity<FunnelOverviewResponse> getFunnelOverview(
            @RequestParam UUID organizationId,
            @RequestParam(defaultValue = "DAILY") String periodType) {
        return ResponseEntity.ok(analyticsService.getFunnelOverview(organizationId, periodType));
    }

    @GetMapping("/funnel/{pipelineId}")
    @Operation(summary = "Get pipeline funnel", description = "Returns hiring funnel metrics for a specific pipeline")
    public ResponseEntity<FunnelOverviewResponse> getPipelineFunnel(
            @PathVariable UUID pipelineId,
            @RequestParam(defaultValue = "DAILY") String periodType) {
        return ResponseEntity.ok(analyticsService.getPipelineFunnel(pipelineId, periodType));
    }

    @GetMapping("/conversion-rates")
    @Operation(summary = "Get conversion rates", description = "Returns stage-to-stage conversion rates for a pipeline within a date range")
    public ResponseEntity<Map<String, BigDecimal>> getConversionRates(
            @RequestParam UUID pipelineId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getConversionRates(pipelineId, startDate, endDate));
    }

    @GetMapping("/dropouts")
    @Operation(summary = "Get stage dropout analysis", description = "Returns dropout analysis per stage for a pipeline")
    public ResponseEntity<List<StageDropoutResponse>> getStageDropouts(@RequestParam UUID pipelineId) {
        return ResponseEntity.ok(analyticsService.getStageDropouts(pipelineId));
    }

    @GetMapping("/time-to-hire")
    @Operation(summary = "Get time-to-hire metrics", description = "Returns average time-to-hire and time spent in each stage")
    public ResponseEntity<Map<String, BigDecimal>> getTimeToHire(
            @RequestParam UUID organizationId,
            @RequestParam(defaultValue = "DAILY") String periodType) {
        return ResponseEntity.ok(analyticsService.getTimeToHire(organizationId, periodType));
    }

    @PostMapping("/compute")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Trigger metrics recomputation", description = "Admin endpoint to manually trigger hiring analytics metrics recomputation")
    public ResponseEntity<Map<String, String>> triggerComputation() {
        analyticsService.triggerComputation();
        return ResponseEntity.ok(Map.of("status", "Metrics computation triggered successfully"));
    }

    // ==================== ML Prediction Endpoints ====================

    @GetMapping("/predict/{candidateId}")
    @Operation(summary = "Predict hiring success", description = "Uses ML model to predict candidate hiring success probability")
    public ResponseEntity<HiringPrediction> predictHiringSuccess(@PathVariable UUID candidateId) {
        HiringPrediction prediction = mlPredictionService.predictHiringSuccess(candidateId);
        return ResponseEntity.ok(prediction);
    }

    @PostMapping("/predict/interviewer-match")
    @Operation(summary = "Predict best interviewer match", description = "Scores and ranks interviewers for optimal candidate-interviewer pairing")
    public ResponseEntity<Map<String, Object>> predictInterviewerMatch(
            @RequestBody @Valid InterviewerMatchRequest request) {
        Map<String, Object> result = mlPredictionService.predictInterviewerMatch(
                request.getCandidateId(), request.getInterviewerIds());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/model/metrics")
    @Operation(summary = "Get model performance metrics", description = "Returns accuracy, precision, recall, and other model performance metrics")
    public ResponseEntity<ModelMetrics> getModelMetrics() {
        ModelMetrics metrics = mlPredictionService.getModelMetrics();
        return ResponseEntity.ok(metrics);
    }
}
