package com.interview_platform_backend.interview_platform_backend.hipaa.repository;

import com.interview_platform_backend.interview_platform_backend.hipaa.entity.HipaaConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface HipaaConsentRecordRepository extends JpaRepository<HipaaConsentRecord, UUID> {

    List<HipaaConsentRecord> findByPatientIdentifierAndGrantedTrue(String patientIdentifier);

    List<HipaaConsentRecord> findByPatientIdentifier(String patientIdentifier);

    List<HipaaConsentRecord> findByGrantedTrueAndExpiresAtAfter(Instant now);

    List<HipaaConsentRecord> findByPatientIdentifierAndGrantedTrueAndRevokedAtIsNull(String patientIdentifier);
}
