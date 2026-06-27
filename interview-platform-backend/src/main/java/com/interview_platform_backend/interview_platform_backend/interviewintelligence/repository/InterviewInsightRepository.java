package com.interview_platform_backend.interview_platform_backend.interviewintelligence.repository;

import com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity.InterviewInsight;
import com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity.InterviewInsight.InsightType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewInsightRepository extends JpaRepository<InterviewInsight, UUID> {

    List<InterviewInsight> findByOrganizationIdAndInsightType(UUID organizationId, InsightType insightType);

    List<InterviewInsight> findByOrganizationId(UUID organizationId);

    List<InterviewInsight> findByOrganizationIdAndGeneratedAtAfter(UUID organizationId, Instant since);

    List<InterviewInsight> findByOrganizationIdAndInsightTypeOrderByValueDesc(UUID organizationId, InsightType insightType);
}
