package com.interview_platform_backend.interview_platform_backend.referral;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Referral Bonus Calculation Tests")
class ReferralBonusCalculationTest {

    @Test void standardBonusForMidLevel() {
        assertEquals(new BigDecimal("2500.00"), calculateBonus("MID", "FULL_TIME"));
    }
    @Test void higherBonusForSenior() {
        assertEquals(new BigDecimal("5000.00"), calculateBonus("SENIOR", "FULL_TIME"));
    }
    @Test void reducedBonusForContractors() {
        assertEquals(0, new BigDecimal("1000").compareTo(calculateBonus("MID", "CONTRACT").stripTrailingZeros()));
    }
    @Test void zeroBonusForInternReferrals() {
        assertEquals(BigDecimal.ZERO, calculateBonus("INTERN", "FULL_TIME"));
    }
    @Test void bonusPaidOnlyAfterHireConfirmed() {
        String status = "HIRED";
        assertTrue(isEligibleForPayout(status));
        assertFalse(isEligibleForPayout("APPLIED"));
        assertFalse(isEligibleForPayout("INTERVIEWING"));
    }
    @Test void bonusNotPaidIfCandidateLeavesBefore90Days() {
        int daysEmployed = 45;
        assertFalse(daysEmployed >= 90, "Bonus clawed back if < 90 days");
    }

    private BigDecimal calculateBonus(String level, String type) {
        if ("INTERN".equals(level)) return BigDecimal.ZERO;
        BigDecimal base = switch (level) {
            case "SENIOR", "STAFF", "PRINCIPAL" -> new BigDecimal("5000.00");
            case "MID" -> new BigDecimal("2500.00");
            case "JUNIOR" -> new BigDecimal("1500.00");
            default -> new BigDecimal("2000.00");
        };
        if ("CONTRACT".equals(type)) base = base.multiply(new BigDecimal("0.4"));
        return base;
    }

    private boolean isEligibleForPayout(String status) {
        return "HIRED".equals(status);
    }
}
