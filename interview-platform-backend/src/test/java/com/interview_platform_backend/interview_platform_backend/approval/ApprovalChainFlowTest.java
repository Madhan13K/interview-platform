package com.interview_platform_backend.interview_platform_backend.approval;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 3: Approval Chain Flow Tests
 */
@DisplayName("Approval Chain Flow Tests")
class ApprovalChainFlowTest {

    enum ApprovalMode { SEQUENTIAL, PARALLEL }
    enum Decision { APPROVED, REJECTED, PENDING }

    @Test void sequentialRequiresAllInOrder() {
        List<Decision> decisions = List.of(Decision.APPROVED, Decision.APPROVED, Decision.APPROVED);
        assertEquals(Decision.APPROVED, evaluateChain(decisions, ApprovalMode.SEQUENTIAL));
    }

    @Test void sequentialRejectsOnFirstRejection() {
        List<Decision> decisions = List.of(Decision.APPROVED, Decision.REJECTED, Decision.PENDING);
        assertEquals(Decision.REJECTED, evaluateChain(decisions, ApprovalMode.SEQUENTIAL));
    }

    @Test void parallelApprovesOnMajority() {
        List<Decision> decisions = List.of(Decision.APPROVED, Decision.APPROVED, Decision.REJECTED);
        assertEquals(Decision.APPROVED, evaluateChain(decisions, ApprovalMode.PARALLEL));
    }

    @Test void parallelPendingIfNotEnoughVotes() {
        List<Decision> decisions = List.of(Decision.APPROVED, Decision.PENDING, Decision.PENDING);
        assertEquals(Decision.PENDING, evaluateChain(decisions, ApprovalMode.PARALLEL));
    }

    private Decision evaluateChain(List<Decision> decisions, ApprovalMode mode) {
        if (mode == ApprovalMode.SEQUENTIAL) {
            for (Decision d : decisions) {
                if (d == Decision.REJECTED) return Decision.REJECTED;
                if (d == Decision.PENDING) return Decision.PENDING;
            }
            return Decision.APPROVED;
        } else {
            long approved = decisions.stream().filter(d -> d == Decision.APPROVED).count();
            long rejected = decisions.stream().filter(d -> d == Decision.REJECTED).count();
            if (approved > decisions.size() / 2) return Decision.APPROVED;
            if (rejected > decisions.size() / 2) return Decision.REJECTED;
            return Decision.PENDING;
        }
    }
}
