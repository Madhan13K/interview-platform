package com.interview_platform_backend.interview_platform_backend.videoanalysis.repository;

import com.interview_platform_backend.interview_platform_backend.videoanalysis.entity.VideoAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VideoAnalysisRepository extends JpaRepository<VideoAnalysisResult, UUID> {

    Optional<VideoAnalysisResult> findByInterviewId(UUID interviewId);

    List<VideoAnalysisResult> findByCandidateId(UUID candidateId);

    List<VideoAnalysisResult> findByStatus(VideoAnalysisResult.Status status);
}
