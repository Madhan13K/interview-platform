package com.interview_platform_backend.interview_platform_backend.mlscoring;

import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLModel.MLModelStatus;
import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLPrediction;
import com.interview_platform_backend.interview_platform_backend.mlscoring.repository.MLModelRepository;
import com.interview_platform_backend.interview_platform_backend.mlscoring.repository.MLPredictionRepository;
import com.interview_platform_backend.interview_platform_backend.mlscoring.service.MLScoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ML Scoring Service Tests")
class MLScoringServiceTest {

    @Mock private MLModelRepository mlModelRepository;
    @Mock private MLPredictionRepository mlPredictionRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private MLScoringService service;

    @Test
    @DisplayName("should train model for organization")
    void trainModel() {
        UUID orgId = UUID.randomUUID();

        when(mlModelRepository.save(any(MLModel.class))).thenAnswer(invocation -> {
            MLModel saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedAt(Instant.now());
            return saved;
        });

        var model = service.trainModel(orgId);
        assertThat(model).isNotNull();
        assertThat(model.getOrganizationId()).isEqualTo(orgId);
        assertThat(model.getStatus()).isEqualTo(MLModelStatus.TRAINED);
        assertThat(model.getAccuracy()).isBetween(0.75, 0.95);
        verify(mlModelRepository).save(any(MLModel.class));
    }

    @Test
    @DisplayName("should generate prediction for candidate")
    void predict() {
        UUID candidateId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        UUID modelId = UUID.randomUUID();

        MLModel existingModel = MLModel.builder()
                .id(modelId)
                .organizationId(UUID.randomUUID())
                .modelName("TestModel")
                .modelVersion("1.0.1")
                .status(MLModelStatus.DEPLOYED)
                .accuracy(0.85)
                .precision(0.80)
                .recall(0.82)
                .f1Score(0.81)
                .trainingDataSize(1000)
                .createdAt(Instant.now())
                .build();

        when(mlModelRepository.findAll()).thenReturn(List.of(existingModel));
        when(mlPredictionRepository.save(any(MLPrediction.class))).thenAnswer(invocation -> {
            MLPrediction saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var prediction = service.predict(candidateId, jobId);
        assertThat(prediction).isNotNull();
        assertThat(prediction.getPredictedScore()).isBetween(0.0, 100.0);
        assertThat(prediction.getModelId()).isEqualTo(modelId);
        verify(mlPredictionRepository).save(any(MLPrediction.class));
    }
}
