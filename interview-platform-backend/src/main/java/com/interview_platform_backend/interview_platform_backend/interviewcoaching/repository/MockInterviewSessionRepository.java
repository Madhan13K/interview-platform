package com.interview_platform_backend.interview_platform_backend.interviewcoaching.repository;

import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession;
import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MockInterviewSessionRepository extends JpaRepository<MockInterviewSession, UUID> {

    List<MockInterviewSession> findByCandidateIdOrderByStartedAtDesc(UUID candidateId);

    List<MockInterviewSession> findByCandidateIdAndStatus(UUID candidateId, SessionStatus status);
}
