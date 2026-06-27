package com.interview_platform_backend.interview_platform_backend.hipaa.repository;

import com.interview_platform_backend.interview_platform_backend.hipaa.entity.HipaaAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface HipaaAuditLogRepository extends JpaRepository<HipaaAuditLog, UUID> {

    List<HipaaAuditLog> findByPatientIdentifierAndTimestampAfter(String patientIdentifier, Instant since);

    List<HipaaAuditLog> findByPatientIdentifier(String patientIdentifier);

    List<HipaaAuditLog> findByUserId(UUID userId);

    List<HipaaAuditLog> findByAction(HipaaAuditLog.AuditAction action);

    List<HipaaAuditLog> findByTimestampAfter(Instant since);

    long countByTimestampAfter(Instant since);
}
