package com.interview_platform_backend.interview_platform_backend.asyncvideov3.repository;

import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession;
import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIInterviewSessionRepository extends JpaRepository<AIInterviewSession, UUID> {

    List<AIInterviewSession> findByCandidateId(UUID candidateId);

    List<AIInterviewSession> findByJobPositionId(UUID jobPositionId);

    List<AIInterviewSession> findByStatus(SessionStatus status);
}
