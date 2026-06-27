package com.interview_platform_backend.interview_platform_backend.analytics.repository;

import com.interview_platform_backend.interview_platform_backend.analytics.entity.StageDropoutAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StageDropoutAnalysisRepository extends JpaRepository<StageDropoutAnalysis, UUID> {

    List<StageDropoutAnalysis> findByPipelineIdOrderByStageOrder(UUID pipelineId);

    List<StageDropoutAnalysis> findByOrganizationIdAndPeriodStartBetween(UUID orgId, LocalDate start, LocalDate end);

    void deleteByPipelineId(UUID pipelineId);
}
