package com.interview_platform_backend.interview_platform_backend.realtimetranslation.repository;

import com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity.TranslationSession;
import com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity.TranslationSession.TranslationSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TranslationSessionRepository extends JpaRepository<TranslationSession, UUID> {

    Optional<TranslationSession> findByInterviewIdAndStatus(UUID interviewId, TranslationSessionStatus status);

    List<TranslationSession> findByInterviewId(UUID interviewId);
}
