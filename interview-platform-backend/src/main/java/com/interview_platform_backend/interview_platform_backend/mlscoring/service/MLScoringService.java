package com.interview_platform_backend.interview_platform_backend.mlscoring.service;

import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel.MLModelStatus;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLPrediction;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLPrediction.PredictionOutcome;
import com.interview_platform_backend.interview_platform_backend.mlscoring.repository.MLModelRepository;
import com.interview_platform_backend.interview_platform_backend.mlscoring.repository.MLPredictionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class MLScoringService {

    private static final Logger log = LoggerFactory.getLogger(MLScoringService.class);

    private final MLModelRepository mlModelRepository;
    private final MLPredictionRepository mlPredictionRepository;
    private final ObjectMapper objectMapper;

    public MLScoringService(MLModelRepository mlModelRepository,
                            MLPredictionRepository mlPredictionRepository,
                            ObjectMapper objectMapper) {
        this.mlModelRepository = mlModelRepository;
        this.mlPredictionRepository = mlPredictionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MLModel trainModel(UUID orgId) {
        List<String> featureList = List.of(
                "interview_score", "experience_years", "skill_match_percentage",
                "communication_score", "cultural_fit_score", "education_level",
                "reference_rating", "response_time_hours"
        );

        String featuresJson;
        try {
            featuresJson = objectMapper.writeValueAsString(featureList);
        } catch (JsonProcessingException e) {
            featuresJson = featureList.toString();
        }

        // Simulate model training with computed metrics
        Random random = new Random();
        double accuracy = 0.75 + random.nextDouble() * 0.20;
        double precision = 0.70 + random.nextDouble() * 0.25;
        double recall = 0.70 + random.nextDouble() * 0.25;
        double f1 = 2 * (precision * recall) / (precision + recall);

        MLModel model = MLModel.builder()
                .organizationId(orgId)
                .modelName("CandidateScoring_v" + System.currentTimeMillis() % 1000)
                .modelVersion("1.0." + random.nextInt(100))
                .status(MLModelStatus.TRAINED)
                .accuracy(accuracy)
                .precision(precision)
                .recall(recall)
                .f1Score(f1)
                .trainingDataSize(500 + random.nextInt(5000))
                .features(featuresJson)
                .trainedAt(Instant.now())
                .build();

        MLModel saved = mlModelRepository.save(model);
        log.info("Trained ML model {} for org {} with accuracy {}", saved.getId(), orgId, accuracy);
        return saved;
    }

    @Transactional
    public MLPrediction predict(UUID candidateId, UUID jobId) {
        // Find the latest deployed model (or any trained model)
        MLModel model = mlModelRepository.findAll().stream()
                .filter(m -> m.getStatus() == MLModelStatus.DEPLOYED || m.getStatus() == MLModelStatus.TRAINED)
                .max(Comparator.comparing(MLModel::getCreatedAt))
                .orElseThrow(() -> new IllegalStateException("No trained model available for predictions"));

        // Simulate prediction
        Random random = new Random();
        double score = 20.0 + random.nextDouble() * 80.0;
        double confidence = 0.60 + random.nextDouble() * 0.35;

        PredictionOutcome outcome;
        if (score >= 70) {
            outcome = PredictionOutcome.LIKELY_HIRE;
        } else if (score >= 40) {
            outcome = PredictionOutcome.POSSIBLE_HIRE;
        } else {
            outcome = PredictionOutcome.UNLIKELY_HIRE;
        }

        Map<String, Object> inputFeatures = new LinkedHashMap<>();
        inputFeatures.put("candidateId", candidateId.toString());
        inputFeatures.put("jobPositionId", jobId.toString());
        inputFeatures.put("modelVersion", model.getModelVersion());

        String featuresJson;
        try {
            featuresJson = objectMapper.writeValueAsString(inputFeatures);
        } catch (JsonProcessingException e) {
            featuresJson = inputFeatures.toString();
        }

        MLPrediction prediction = MLPrediction.builder()
                .modelId(model.getId())
                .candidateId(candidateId)
                .jobPositionId(jobId)
                .predictedScore(score)
                .confidence(confidence)
                .features(featuresJson)
                .prediction(outcome)
                .build();

        MLPrediction saved = mlPredictionRepository.save(prediction);
        log.info("ML prediction for candidate {} on job {}: score={}, outcome={}",
                candidateId, jobId, score, outcome);
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getModelMetrics(UUID orgId) {
        List<MLModel> models = mlModelRepository.findByOrganizationId(orgId);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("organizationId", orgId);
        metrics.put("totalModels", models.size());

        if (!models.isEmpty()) {
            MLModel latest = models.stream()
                    .max(Comparator.comparing(MLModel::getCreatedAt))
                    .get();
            metrics.put("latestModel", latest.getModelName());
            metrics.put("latestVersion", latest.getModelVersion());
            metrics.put("accuracy", latest.getAccuracy());
            metrics.put("precision", latest.getPrecision());
            metrics.put("recall", latest.getRecall());
            metrics.put("f1Score", latest.getF1Score());
            metrics.put("status", latest.getStatus().name());
        }

        return metrics;
    }

    @Transactional(readOnly = true)
    public List<MLPrediction> getTopPredictions(UUID jobId, int limit) {
        List<MLPrediction> allPredictions = mlPredictionRepository
                .findByJobPositionIdOrderByPredictedScoreDesc(jobId);
        return allPredictions.stream().limit(limit).toList();
    }

    @Transactional
    public MLModel retrainOnNewData(UUID orgId) {
        log.info("Retraining model for org {} with new data", orgId);

        // Deprecate old models
        List<MLModel> existingModels = mlModelRepository.findByOrganizationId(orgId);
        for (MLModel existing : existingModels) {
            if (existing.getStatus() == MLModelStatus.DEPLOYED) {
                existing.setStatus(MLModelStatus.DEPRECATED);
                mlModelRepository.save(existing);
            }
        }

        // Train new model
        MLModel newModel = trainModel(orgId);
        newModel.setStatus(MLModelStatus.DEPLOYED);
        newModel.setDeployedAt(Instant.now());
        return mlModelRepository.save(newModel);
    }
}
