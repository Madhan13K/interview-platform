package com.interview_platform_backend.interview_platform_backend.livetranscription.repository;

import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TranscriptionSegmentRepository extends JpaRepository<TranscriptionSegment, UUID> {

    List<TranscriptionSegment> findBySessionIdOrderBySequenceNumberAsc(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
