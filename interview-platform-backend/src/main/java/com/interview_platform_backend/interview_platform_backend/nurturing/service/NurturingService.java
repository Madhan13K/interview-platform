package com.interview_platform_backend.interview_platform_backend.nurturing.service;

import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment.EnrollmentStatus;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence.SequenceStatus;
import com.interview_platform_backend.interview_platform_backend.nurturing.repository.NurtureEnrollmentRepository;
import com.interview_platform_backend.interview_platform_backend.nurturing.repository.NurtureSequenceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NurturingService {

    private static final Logger log = LoggerFactory.getLogger(NurturingService.class);

    private final NurtureSequenceRepository sequenceRepository;
    private final NurtureEnrollmentRepository enrollmentRepository;

    public NurtureSequence createSequence(NurtureSequence sequence) {
        log.info("Creating nurture sequence: name={}, targetSegment={}",
                sequence.getName(), sequence.getTargetSegment());

        sequence.setStatus(SequenceStatus.DRAFT);
        sequence.setCreatedAt(Instant.now());

        NurtureSequence saved = sequenceRepository.save(sequence);
        log.info("Nurture sequence [{}] created", saved.getId());
        return saved;
    }

    public NurtureEnrollment enrollCandidate(UUID sequenceId, UUID candidateId) {
        log.info("Enrolling candidate [{}] in sequence [{}]", candidateId, sequenceId);

        NurtureSequence sequence = sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new RuntimeException("Sequence not found: " + sequenceId));

        NurtureEnrollment enrollment = NurtureEnrollment.builder()
                .sequenceId(sequenceId)
                .candidateId(candidateId)
                .currentStep(0)
                .status(EnrollmentStatus.ACTIVE)
                .enrolledAt(Instant.now())
                .nextStepAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();

        NurtureEnrollment saved = enrollmentRepository.save(enrollment);

        sequence.setEnrolledCount(sequence.getEnrolledCount() + 1);
        sequenceRepository.save(sequence);

        log.info("Candidate [{}] enrolled in sequence [{}] as enrollment [{}]",
                candidateId, sequenceId, saved.getId());
        return saved;
    }

    @Scheduled(fixedRate = 60000)
    public void processNextStep() {
        log.debug("Processing nurture steps due for execution");

        List<NurtureEnrollment> dueEnrollments = enrollmentRepository
                .findByStatusAndNextStepAtBefore(EnrollmentStatus.ACTIVE, Instant.now());

        for (NurtureEnrollment enrollment : dueEnrollments) {
            try {
                processEnrollmentStep(enrollment);
            } catch (Exception e) {
                log.error("Error processing enrollment [{}]: {}", enrollment.getId(), e.getMessage(), e);
            }
        }

        log.debug("Processed {} nurture steps", dueEnrollments.size());
    }

    private void processEnrollmentStep(NurtureEnrollment enrollment) {
        log.info("Processing step {} for enrollment [{}]", enrollment.getCurrentStep() + 1, enrollment.getId());

        enrollment.setCurrentStep(enrollment.getCurrentStep() + 1);
        enrollment.setLastStepAt(Instant.now());
        enrollment.setNextStepAt(Instant.now().plus(3, ChronoUnit.DAYS));

        NurtureSequence sequence = sequenceRepository.findById(enrollment.getSequenceId()).orElse(null);
        if (sequence != null && enrollment.getCurrentStep() >= sequence.getEnrolledCount()) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setNextStepAt(null);
            sequence.setCompletedCount(sequence.getCompletedCount() + 1);
            sequenceRepository.save(sequence);
        }

        enrollmentRepository.save(enrollment);
    }

    public NurtureEnrollment unsubscribe(UUID enrollmentId) {
        log.info("Unsubscribing enrollment [{}]", enrollmentId);

        NurtureEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.UNSUBSCRIBED);
        enrollment.setNextStepAt(null);

        NurtureEnrollment saved = enrollmentRepository.save(enrollment);
        log.info("Enrollment [{}] unsubscribed", enrollmentId);
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSequenceStats(UUID sequenceId) {
        log.debug("Fetching stats for sequence [{}]", sequenceId);

        NurtureSequence sequence = sequenceRepository.findById(sequenceId)
                .orElseThrow(() -> new RuntimeException("Sequence not found: " + sequenceId));

        List<NurtureEnrollment> enrollments = enrollmentRepository.findBySequenceId(sequenceId);
        long active = enrollments.stream().filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE).count();
        long completed = enrollments.stream().filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED).count();
        long unsubscribed = enrollments.stream().filter(e -> e.getStatus() == EnrollmentStatus.UNSUBSCRIBED).count();

        return Map.of(
                "sequenceId", sequenceId.toString(),
                "name", sequence.getName(),
                "status", sequence.getStatus().name(),
                "enrolledCount", sequence.getEnrolledCount(),
                "activeCount", active,
                "completedCount", completed,
                "unsubscribedCount", unsubscribed,
                "openRate", sequence.getOpenRate(),
                "clickRate", sequence.getClickRate()
        );
    }

    @Transactional(readOnly = true)
    public List<NurtureEnrollment> getActiveEnrollments(UUID sequenceId) {
        return enrollmentRepository.findBySequenceIdAndStatus(sequenceId, EnrollmentStatus.ACTIVE);
    }
}
