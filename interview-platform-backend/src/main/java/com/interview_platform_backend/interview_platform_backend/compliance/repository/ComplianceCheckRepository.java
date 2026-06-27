package com.interview_platform_backend.interview_platform_backend.compliance.repository;

import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceCheck;
import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceCheck.CheckStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplianceCheckRepository extends JpaRepository<ComplianceCheck, UUID> {

    List<ComplianceCheck> findByAuditRunId(UUID auditRunId);

    List<ComplianceCheck> findByAuditRunIdAndStatus(UUID auditRunId, CheckStatus status);

    long countByAuditRunIdAndStatus(UUID auditRunId, CheckStatus status);
}
