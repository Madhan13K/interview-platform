package com.interview_platform_backend.interview_platform_backend.iso27001.repository;

import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {

    List<RiskAssessment> findByRiskScoreGreaterThanEqual(int score);

    List<RiskAssessment> findByStatus(RiskAssessment.RiskStatus status);

    List<RiskAssessment> findByReviewDateBeforeOrderByReviewDateAsc(Instant date);

    List<RiskAssessment> findByResidualRiskIn(List<RiskAssessment.ResidualRisk> risks);
}
