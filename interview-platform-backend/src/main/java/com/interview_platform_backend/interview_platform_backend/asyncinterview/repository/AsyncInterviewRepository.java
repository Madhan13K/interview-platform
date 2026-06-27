package com.interview_platform_backend.interview_platform_backend.asyncinterview.repository;

import com.interview_platform_backend.interview_platform_backend.asyncinterview.entity.AsyncInterview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsyncInterviewRepository extends JpaRepository<AsyncInterview, UUID> {

    List<AsyncInterview> findByCreatedById(UUID userId);

    List<AsyncInterview> findByOrganizationId(UUID organizationId);

    List<AsyncInterview> findByStatus(String status);
}
