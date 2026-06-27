package com.interview_platform_backend.interview_platform_backend.mlscoring.controller;

import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLPrediction;
import com.interview_platform_backend.interview_platform_backend.mlscoring.service.MLScoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ml-scoring")
@Tag(name = "ML Scoring", description = "Machine learning candidate scoring and predictions")
@PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
public class MLScoringController {

    private final MLScoringService mlScoringService;

    public MLScoringController(MLScoringService mlScoringService) {
        this.mlScoringService = mlScoringService;
    }

    @Operation(summary = "Train a new ML model for an organization")
    @PostMapping("/train")
    public ResponseEntity<MLModel> trainModel(@RequestParam UUID orgId) {
        MLModel model = mlScoringService.trainModel(orgId);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Get prediction for a candidate on a job position")
    @PostMapping("/predict")
    public ResponseEntity<MLPrediction> predict(
            @RequestParam UUID candidateId,
            @RequestParam UUID jobId) {
        MLPrediction prediction = mlScoringService.predict(candidateId, jobId);
        return ResponseEntity.ok(prediction);
    }

    @Operation(summary = "Get model metrics for an organization")
    @GetMapping("/metrics/{orgId}")
    public ResponseEntity<Map<String, Object>> getModelMetrics(@PathVariable UUID orgId) {
        return ResponseEntity.ok(mlScoringService.getModelMetrics(orgId));
    }

    @Operation(summary = "Get top predictions for a job position")
    @GetMapping("/top-predictions/{jobId}")
    public ResponseEntity<List<MLPrediction>> getTopPredictions(
            @PathVariable UUID jobId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(mlScoringService.getTopPredictions(jobId, limit));
    }

    @Operation(summary = "Retrain model with new data")
    @PostMapping("/retrain")
    public ResponseEntity<MLModel> retrainOnNewData(@RequestParam UUID orgId) {
        MLModel model = mlScoringService.retrainOnNewData(orgId);
        return ResponseEntity.ok(model);
    }
}
