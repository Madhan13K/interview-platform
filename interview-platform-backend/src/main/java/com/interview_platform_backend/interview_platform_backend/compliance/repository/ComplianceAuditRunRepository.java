package com.interview_platform_backend.interview_platform_backend.compliance.repository;

import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceAuditRun;
import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceAuditRun.AuditStatus;
import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceAuditRun.AuditType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplianceAuditRunRepository extends JpaRepository<ComplianceAuditRun, UUID> {

    List<ComplianceAuditRun> findByAuditType(AuditType auditType);

    Optional<ComplianceAuditRun> findTopByAuditTypeOrderByStartedAtDesc(AuditType auditType);

    List<ComplianceAuditRun> findByStatus(AuditStatus status);
}
