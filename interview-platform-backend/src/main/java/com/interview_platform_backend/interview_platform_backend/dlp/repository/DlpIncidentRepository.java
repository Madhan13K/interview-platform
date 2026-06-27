package com.interview_platform_backend.interview_platform_backend.dlp.repository;

import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DlpIncidentRepository extends JpaRepository<DlpIncident, UUID> {

    List<DlpIncident> findByUserId(UUID userId);

    List<DlpIncident> findByTimestampAfter(Instant since);

    List<DlpIncident> findByPolicyId(UUID policyId);

    long countByTimestampAfter(Instant since);

    long countByBlockedTrue();

    long countByTimestampAfterAndBlockedTrue(Instant since);
}
