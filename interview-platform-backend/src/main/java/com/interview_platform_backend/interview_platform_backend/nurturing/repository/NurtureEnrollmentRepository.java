package com.interview_platform_backend.interview_platform_backend.nurturing.repository;

import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface NurtureEnrollmentRepository extends JpaRepository<NurtureEnrollment, UUID> {

    List<NurtureEnrollment> findBySequenceId(UUID sequenceId);

    List<NurtureEnrollment> findBySequenceIdAndStatus(UUID sequenceId, EnrollmentStatus status);

    List<NurtureEnrollment> findByCandidateId(UUID candidateId);

    List<NurtureEnrollment> findByStatusAndNextStepAtBefore(EnrollmentStatus status, Instant now);
}
