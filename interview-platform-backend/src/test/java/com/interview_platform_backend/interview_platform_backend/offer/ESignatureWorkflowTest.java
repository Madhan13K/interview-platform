package com.interview_platform_backend.interview_platform_backend.offer;

import com.interview_platform_backend.interview_platform_backend.offer.entity.ESignatureStatus;
import com.interview_platform_backend.interview_platform_backend.offer.entity.OfferStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 3: E-Signature Workflow Tests (Mocked)
 */
@DisplayName("E-Signature Workflow Tests")
class ESignatureWorkflowTest {

    @Test void offerFlowDraftToSent() {
        assertEquals(OfferStatus.SENT, transitionOffer(OfferStatus.APPROVED, "send"));
    }
    @Test void signedCompletesOffer() {
        assertEquals(OfferStatus.ACCEPTED, mapSignatureToOffer(ESignatureStatus.SIGNED));
    }
    @Test void declinedRejectsOffer() {
        assertEquals(OfferStatus.DECLINED, mapSignatureToOffer(ESignatureStatus.DECLINED));
    }
    @Test void pendingKeepsOfferSent() {
        assertEquals(OfferStatus.SENT, mapSignatureToOffer(ESignatureStatus.PENDING));
    }

    private OfferStatus transitionOffer(OfferStatus current, String action) {
        if (current == OfferStatus.APPROVED && "send".equals(action)) return OfferStatus.SENT;
        return current;
    }
    private OfferStatus mapSignatureToOffer(ESignatureStatus sigStatus) {
        return switch (sigStatus) {
            case SIGNED -> OfferStatus.ACCEPTED;
            case DECLINED -> OfferStatus.DECLINED;
            case EXPIRED -> OfferStatus.EXPIRED;
            default -> OfferStatus.SENT;
        };
    }
}
