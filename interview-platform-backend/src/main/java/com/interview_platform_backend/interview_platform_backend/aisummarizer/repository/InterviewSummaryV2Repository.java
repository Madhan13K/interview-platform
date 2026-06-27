package com.interview_platform_backend.interview_platform_backend.aisummarizer.repository;

import com.interview_platform_backend.interview_platform_backend.aisummarizer.entity.InterviewSummaryV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSummaryV2Repository extends JpaRepository<InterviewSummaryV2, UUID> {

    Optional<InterviewSummaryV2> findByInterviewId(UUID interviewId);
}
