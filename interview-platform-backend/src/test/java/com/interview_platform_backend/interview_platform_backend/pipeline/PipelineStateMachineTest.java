package com.interview_platform_backend.interview_platform_backend.pipeline;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 2: Pipeline State Machine Tests
 */
@DisplayName("Pipeline State Machine Tests")
class PipelineStateMachineTest {

    enum CandidateStatus { APPLIED, SCREENING, INTERVIEWING, OFFER, HIRED, REJECTED, WITHDRAWN }

    private static final java.util.Map<CandidateStatus, Set<CandidateStatus>> VALID_TRANSITIONS = java.util.Map.of(
            CandidateStatus.APPLIED, Set.of(CandidateStatus.SCREENING, CandidateStatus.REJECTED, CandidateStatus.WITHDRAWN),
            CandidateStatus.SCREENING, Set.of(CandidateStatus.INTERVIEWING, CandidateStatus.REJECTED, CandidateStatus.WITHDRAWN),
            CandidateStatus.INTERVIEWING, Set.of(CandidateStatus.OFFER, CandidateStatus.REJECTED, CandidateStatus.WITHDRAWN),
            CandidateStatus.OFFER, Set.of(CandidateStatus.HIRED, CandidateStatus.REJECTED, CandidateStatus.WITHDRAWN),
            CandidateStatus.HIRED, Set.of(),
            CandidateStatus.REJECTED, Set.of(),
            CandidateStatus.WITHDRAWN, Set.of()
    );

    @Nested
    @DisplayName("Valid Transitions")
    class ValidTransitions {
        @Test void appliedToScreening() { assertValidTransition(CandidateStatus.APPLIED, CandidateStatus.SCREENING); }
        @Test void screeningToInterviewing() { assertValidTransition(CandidateStatus.SCREENING, CandidateStatus.INTERVIEWING); }
        @Test void interviewingToOffer() { assertValidTransition(CandidateStatus.INTERVIEWING, CandidateStatus.OFFER); }
        @Test void offerToHired() { assertValidTransition(CandidateStatus.OFFER, CandidateStatus.HIRED); }
        @Test void anyToRejected() {
            for (var status : List.of(CandidateStatus.APPLIED, CandidateStatus.SCREENING, CandidateStatus.INTERVIEWING, CandidateStatus.OFFER)) {
                assertValidTransition(status, CandidateStatus.REJECTED);
            }
        }
        @Test void anyToWithdrawn() {
            for (var status : List.of(CandidateStatus.APPLIED, CandidateStatus.SCREENING, CandidateStatus.INTERVIEWING, CandidateStatus.OFFER)) {
                assertValidTransition(status, CandidateStatus.WITHDRAWN);
            }
        }
    }

    @Nested
    @DisplayName("Invalid Transitions")
    class InvalidTransitions {
        @Test void cannotSkipStages() { assertInvalidTransition(CandidateStatus.APPLIED, CandidateStatus.OFFER); }
        @Test void cannotGoBackward() { assertInvalidTransition(CandidateStatus.INTERVIEWING, CandidateStatus.APPLIED); }
        @Test void cannotTransitionFromHired() { assertInvalidTransition(CandidateStatus.HIRED, CandidateStatus.REJECTED); }
        @Test void cannotTransitionFromRejected() { assertInvalidTransition(CandidateStatus.REJECTED, CandidateStatus.SCREENING); }
        @Test void cannotTransitionFromWithdrawn() { assertInvalidTransition(CandidateStatus.WITHDRAWN, CandidateStatus.INTERVIEWING); }
    }

    private void assertValidTransition(CandidateStatus from, CandidateStatus to) {
        assertTrue(isValidTransition(from, to), from + " → " + to + " should be valid");
    }
    private void assertInvalidTransition(CandidateStatus from, CandidateStatus to) {
        assertFalse(isValidTransition(from, to), from + " → " + to + " should be INVALID");
    }
    private boolean isValidTransition(CandidateStatus from, CandidateStatus to) {
        return VALID_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }
}
