package com.interview_platform_backend.interview_platform_backend.proctoring;

import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession;
import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession.ProctoringStatus;
import com.interview_platform_backend.interview_platform_backend.proctoring.repository.ProctoringSessionRepository;
import com.interview_platform_backend.interview_platform_backend.proctoring.service.ProctoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Proctoring Service Tests")
class ProctoringServiceV2Test {

    @Mock private ProctoringSessionRepository proctoringSessionRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private ProctoringService service;

    @Test
    @DisplayName("should start proctoring session")
    void startSession() {
        UUID interviewId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        when(proctoringSessionRepository.save(any(ProctoringSession.class))).thenAnswer(invocation -> {
            ProctoringSession saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var session = service.startSession(interviewId, candidateId, true);
        assertThat(session).isNotNull();
        assertThat(session.getInterviewId()).isEqualTo(interviewId);
        assertThat(session.isScreenRecordingConsent()).isTrue();
        assertThat(session.getStatus()).isEqualTo(ProctoringStatus.MONITORING);
        verify(proctoringSessionRepository).save(any(ProctoringSession.class));
    }

    @Test
    @DisplayName("should report tab switch and increment count")
    void reportTabSwitch() {
        UUID sessionId = UUID.randomUUID();
        ProctoringSession session = ProctoringSession.builder()
                .id(sessionId)
                .interviewId(UUID.randomUUID())
                .candidateId(UUID.randomUUID())
                .tabSwitchCount(0)
                .suspiciousEvents("[]")
                .integrityScore(100.0)
                .status(ProctoringStatus.MONITORING)
                .build();

        when(proctoringSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(proctoringSessionRepository.save(any(ProctoringSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.reportTabSwitch(sessionId);
        assertThat(result.getTabSwitchCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("should calculate integrity score on end")
    void endSession() {
        UUID sessionId = UUID.randomUUID();
        ProctoringSession session = ProctoringSession.builder()
                .id(sessionId)
                .interviewId(UUID.randomUUID())
                .candidateId(UUID.randomUUID())
                .tabSwitchCount(2)
                .faceCountViolations(1)
                .suspiciousEvents("[]")
                .integrityScore(100.0)
                .status(ProctoringStatus.MONITORING)
                .build();

        when(proctoringSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(proctoringSessionRepository.save(any(ProctoringSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.endSession(sessionId);
        assertThat(result.getIntegrityScore()).isLessThan(100.0);
        assertThat(result.getIntegrityScore()).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("should flag session when integrity drops below threshold")
    void endSessionFlagsLowIntegrity() {
        UUID sessionId = UUID.randomUUID();
        ProctoringSession session = ProctoringSession.builder()
                .id(sessionId)
                .interviewId(UUID.randomUUID())
                .candidateId(UUID.randomUUID())
                .tabSwitchCount(8)
                .faceCountViolations(4)
                .suspiciousEvents("[]")
                .integrityScore(100.0)
                .status(ProctoringStatus.MONITORING)
                .build();

        when(proctoringSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(proctoringSessionRepository.save(any(ProctoringSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.endSession(sessionId);
        assertThat(result.getStatus()).isEqualTo(ProctoringStatus.FLAGGED);
    }
}
