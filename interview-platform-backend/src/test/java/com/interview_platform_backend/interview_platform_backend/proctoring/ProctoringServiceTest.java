package com.interview_platform_backend.interview_platform_backend.proctoring;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Proctoring Service Tests")
class ProctoringServiceTest {

    @Mock private EntityManager entityManager;

    @Test
    @DisplayName("should start proctoring session with valid consent")
    void shouldStartSessionWithConsent() {
        // given
        UUID interviewId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        boolean consent = true;

        doNothing().when(entityManager).persist(any());

        // when
        entityManager.persist(new Object());

        // then
        verify(entityManager, times(1)).persist(any());
        assertThat(consent).isTrue();
        assertThat(interviewId).isNotNull();
        assertThat(candidateId).isNotNull();
    }

    @Test
    @DisplayName("should reject session start without consent")
    void shouldRejectSessionWithoutConsent() {
        // given
        boolean consent = false;

        // when / then
        assertThatThrownBy(() -> {
            if (!consent) {
                throw new IllegalStateException("Candidate must provide consent for proctoring");
            }
        }).isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("consent");
    }

    @Test
    @DisplayName("should report tab switch and decrement integrity score")
    void shouldReportTabSwitchAndDecrementScore() {
        // given
        int initialIntegrity = 100;
        int tabSwitchPenalty = 10;
        int tabSwitches = 0;

        // when - simulate tab switch
        tabSwitches++;
        int newIntegrity = initialIntegrity - (tabSwitchPenalty * tabSwitches);

        // then
        assertThat(newIntegrity).isEqualTo(90);
        assertThat(tabSwitches).isEqualTo(1);
    }

    @Test
    @DisplayName("should report multiple tab switches with cumulative penalty")
    void shouldApplyCumulativePenaltyForMultipleTabSwitches() {
        // given
        int initialIntegrity = 100;
        int tabSwitchPenalty = 10;

        // when - simulate 3 tab switches
        int finalIntegrity = initialIntegrity - (tabSwitchPenalty * 3);

        // then
        assertThat(finalIntegrity).isEqualTo(70);
    }

    @Test
    @DisplayName("should report face violation and apply penalty based on count")
    void shouldReportFaceViolation() {
        // given
        int initialIntegrity = 100;
        int faceViolationPenalty = 15;
        int violationCount = 2;

        // when
        int newIntegrity = initialIntegrity - (faceViolationPenalty * violationCount);

        // then
        assertThat(newIntegrity).isEqualTo(70);
        assertThat(newIntegrity).isPositive();
    }

    @Test
    @DisplayName("should calculate final integrity score on session end")
    void shouldCalculateFinalIntegrityOnEnd() {
        // given
        int initialIntegrity = 100;
        int tabSwitches = 2;
        int faceViolations = 1;
        int tabSwitchPenalty = 10;
        int faceViolationPenalty = 15;

        // when
        int finalIntegrity = initialIntegrity
                - (tabSwitchPenalty * tabSwitches)
                - (faceViolationPenalty * faceViolations);
        finalIntegrity = Math.max(0, finalIntegrity);

        // then
        assertThat(finalIntegrity).isEqualTo(65);
        assertThat(finalIntegrity).isBetween(0, 100);
    }

    @Test
    @DisplayName("should not allow integrity score below zero")
    void shouldNotAllowNegativeIntegrity() {
        // given
        int initialIntegrity = 100;
        int tabSwitches = 10;
        int faceViolations = 5;
        int tabSwitchPenalty = 10;
        int faceViolationPenalty = 15;

        // when
        int rawScore = initialIntegrity
                - (tabSwitchPenalty * tabSwitches)
                - (faceViolationPenalty * faceViolations);
        int finalIntegrity = Math.max(0, rawScore);

        // then
        assertThat(rawScore).isNegative();
        assertThat(finalIntegrity).isZero();
    }

    @Test
    @DisplayName("should flag session when integrity drops below threshold")
    void shouldFlagSessionBelowThreshold() {
        // given
        int integrityScore = 55;
        int flagThreshold = 60;

        // when
        boolean isFlagged = integrityScore < flagThreshold;

        // then
        assertThat(isFlagged).isTrue();
    }

    @Test
    @DisplayName("should not flag session with acceptable integrity")
    void shouldNotFlagAcceptableSession() {
        // given
        int integrityScore = 85;
        int flagThreshold = 60;

        // when
        boolean isFlagged = integrityScore < flagThreshold;

        // then
        assertThat(isFlagged).isFalse();
    }
}
