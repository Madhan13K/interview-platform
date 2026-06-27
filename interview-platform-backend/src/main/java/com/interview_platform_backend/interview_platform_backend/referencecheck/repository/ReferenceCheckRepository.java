package com.interview_platform_backend.interview_platform_backend.referencecheck.repository;

import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck;
import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck.ReferenceCheckStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReferenceCheckRepository extends JpaRepository<ReferenceCheck, UUID> {

    List<ReferenceCheck> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);

    long countByStatus(ReferenceCheckStatus status);

    long count();
}
