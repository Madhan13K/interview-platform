package com.interview_platform_backend.interview_platform_backend.iso27001.repository;

import com.interview_platform_backend.interview_platform_backend.iso27001.entity.IsmsPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface IsmsPolicyRepository extends JpaRepository<IsmsPolicy, UUID> {

    List<IsmsPolicy> findByCategory(IsmsPolicy.PolicyCategory category);

    List<IsmsPolicy> findByStatus(IsmsPolicy.PolicyStatus status);

    List<IsmsPolicy> findByReviewDateBeforeOrderByReviewDateAsc(Instant date);
}
