package com.interview_platform_backend.interview_platform_backend.mlscoring.repository;

import com.interview_platform_backend.interview_platform_backend.mlscoring.entity.MLPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MLPredictionRepository extends JpaRepository<MLPrediction, UUID> {

    List<MLPrediction> findByJobPositionIdOrderByPredictedScoreDesc(UUID jobPositionId);

    List<MLPrediction> findByCandidateId(UUID candidateId);

    List<MLPrediction> findByModelId(UUID modelId);
}
