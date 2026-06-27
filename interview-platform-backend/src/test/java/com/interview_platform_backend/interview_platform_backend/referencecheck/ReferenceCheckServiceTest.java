package com.interview_platform_backend.interview_platform_backend.referencecheck;

import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck;
import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck.ReferenceCheckStatus;
import com.interview_platform_backend.interview_platform_backend.referencecheck.repository.ReferenceCheckRepository;
import com.interview_platform_backend.interview_platform_backend.referencecheck.service.ReferenceCheckService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Reference Check Service Tests")
class ReferenceCheckServiceTest {

    @Mock private ReferenceCheckRepository referenceCheckRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private ReferenceCheckService service;

    @Test
    @DisplayName("should create reference check")
    void createCheck() {
        UUID candidateId = UUID.randomUUID();

        when(referenceCheckRepository.save(any(ReferenceCheck.class))).thenAnswer(invocation -> {
            ReferenceCheck saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var check = service.createCheck(candidateId, "Jane Manager", "jane@company.com", "Manager");
        assertThat(check).isNotNull();
        assertThat(check.getCandidateId()).isEqualTo(candidateId);
        assertThat(check.getReferenceName()).isEqualTo("Jane Manager");
        assertThat(check.getStatus()).isEqualTo(ReferenceCheckStatus.PENDING);
        assertThat(check.getReferenceEmail()).isEqualTo("jane@company.com");
        verify(referenceCheckRepository).save(any(ReferenceCheck.class));
    }

    @Test
    @DisplayName("should set expiry date on creation")
    void createCheckSetsExpiry() {
        UUID candidateId = UUID.randomUUID();

        when(referenceCheckRepository.save(any(ReferenceCheck.class))).thenAnswer(invocation -> {
            ReferenceCheck saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var check = service.createCheck(candidateId, "John Peer", "john@company.com", "Peer");
        assertThat(check.getExpiresAt()).isNotNull();
    }
}
