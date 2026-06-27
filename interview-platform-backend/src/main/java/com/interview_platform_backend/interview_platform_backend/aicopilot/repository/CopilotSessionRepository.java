package com.interview_platform_backend.interview_platform_backend.aicopilot.repository;

import com.interview_platform_backend.interview_platform_backend.aicopilot.entity.CopilotSession;
import com.interview_platform_backend.interview_platform_backend.aicopilot.entity.CopilotSession.CopilotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CopilotSessionRepository extends JpaRepository<CopilotSession, UUID> {

    Optional<CopilotSession> findByInterviewId(UUID interviewId);

    List<CopilotSession> findByInterviewerIdAndStatus(UUID interviewerId, CopilotStatus status);
}
