package com.interview_platform_backend.interview_platform_backend.livetranscription.repository;

import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSession;
import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSession.TranscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TranscriptionSessionRepository extends JpaRepository<TranscriptionSession, UUID> {

    Optional<TranscriptionSession> findByInterviewId(UUID interviewId);

    List<TranscriptionSession> findByStatus(TranscriptionStatus status);
}
