package com.interview_platform_backend.interview_platform_backend.nurturing;

import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureEnrollment.EnrollmentStatus;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence;
import com.interview_platform_backend.interview_platform_backend.nurturing.entity.NurtureSequence.SequenceStatus;
import com.interview_platform_backend.interview_platform_backend.nurturing.repository.NurtureEnrollmentRepository;
import com.interview_platform_backend.interview_platform_backend.nurturing.repository.NurtureSequenceRepository;
import com.interview_platform_backend.interview_platform_backend.nurturing.service.NurturingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Nurturing Service Tests")
class NurturingServiceTest {

    @Mock private NurtureSequenceRepository sequenceRepository;
    @Mock private NurtureEnrollmentRepository enrollmentRepository;
    @InjectMocks private NurturingService service;

    @Test
    @DisplayName("should create nurture sequence")
    void createSequence() {
        NurtureSequence sequence = NurtureSequence.builder()
                .name("Tech Talent Pipeline")
                .organizationId(UUID.randomUUID())
                .targetSegment("senior_engineers")
                .createdBy(UUID.randomUUID())
                .build();

        when(sequenceRepository.save(any(NurtureSequence.class))).thenAnswer(invocation -> {
            NurtureSequence saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.createSequence(sequence);
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Tech Talent Pipeline");
        assertThat(result.getStatus()).isEqualTo(SequenceStatus.DRAFT);
        verify(sequenceRepository).save(any(NurtureSequence.class));
    }

    @Test
    @DisplayName("should enroll candidate in sequence")
    void enrollCandidate() {
        UUID seqId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        NurtureSequence sequence = NurtureSequence.builder()
                .id(seqId)
                .name("Pipeline")
                .organizationId(UUID.randomUUID())
                .enrolledCount(0)
                .build();

        when(sequenceRepository.findById(seqId)).thenReturn(Optional.of(sequence));
        when(enrollmentRepository.save(any(NurtureEnrollment.class))).thenAnswer(invocation -> {
            NurtureEnrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(sequenceRepository.save(any(NurtureSequence.class))).thenReturn(sequence);

        var enrollment = service.enrollCandidate(seqId, candidateId);
        assertThat(enrollment).isNotNull();
        assertThat(enrollment.getCandidateId()).isEqualTo(candidateId);
        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
        verify(enrollmentRepository).save(any(NurtureEnrollment.class));
    }

    @Test
    @DisplayName("should set enrollment current step to zero on creation")
    void enrollCandidateStartsAtStepZero() {
        UUID seqId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        NurtureSequence sequence = NurtureSequence.builder()
                .id(seqId)
                .name("Pipeline")
                .organizationId(UUID.randomUUID())
                .enrolledCount(0)
                .build();

        when(sequenceRepository.findById(seqId)).thenReturn(Optional.of(sequence));
        when(enrollmentRepository.save(any(NurtureEnrollment.class))).thenAnswer(invocation -> {
            NurtureEnrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(sequenceRepository.save(any(NurtureSequence.class))).thenReturn(sequence);

        var enrollment = service.enrollCandidate(seqId, candidateId);
        assertThat(enrollment.getCurrentStep()).isEqualTo(0);
    }
}
