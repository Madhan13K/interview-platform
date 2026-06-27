package com.interview_platform_backend.interview_platform_backend.analytics.repository;

import com.interview_platform_backend.interview_platform_backend.analytics.entity.HiringFunnelMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HiringFunnelMetricRepository extends JpaRepository<HiringFunnelMetric, UUID> {

    List<HiringFunnelMetric> findByOrganizationIdAndPeriodType(UUID orgId, String periodType);

    List<HiringFunnelMetric> findByPipelineIdAndPeriodStartBetween(UUID pipelineId, LocalDate start, LocalDate end);

    Optional<HiringFunnelMetric> findTopByOrganizationIdOrderByPeriodStartDesc(UUID orgId);

    List<HiringFunnelMetric> findByPipelineIdAndPeriodType(UUID pipelineId, String periodType);

    void deleteByPipelineIdAndPeriodType(UUID pipelineId, String periodType);
}
