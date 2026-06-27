package com.interview_platform_backend.interview_platform_backend.proctoring.repository;

import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession;
import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession.ProctoringStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProctoringSessionRepository extends JpaRepository<ProctoringSession, UUID> {

    Optional<ProctoringSession> findByInterviewIdAndStatus(UUID interviewId, ProctoringStatus status);

    List<ProctoringSession> findByStatus(ProctoringStatus status);

    List<ProctoringSession> findByCandidateId(UUID candidateId);
}
