package com.interview_platform_backend.interview_platform_backend.security;

import com.interview_platform_backend.interview_platform_backend.AbstractIntegrationTest;
import com.interview_platform_backend.interview_platform_backend.accountlockout.entity.AccountLockout;
import com.interview_platform_backend.interview_platform_backend.accountlockout.entity.LoginAttempt;
import com.interview_platform_backend.interview_platform_backend.accountlockout.repository.AccountLockoutRepository;
import com.interview_platform_backend.interview_platform_backend.accountlockout.repository.LoginAttemptRepository;
import com.interview_platform_backend.interview_platform_backend.accountlockout.service.AccountLockoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 1: Account Lockout Integration Tests
 * Tests progressive lockout behavior, unlock, and IP blocking.
 */
@SpringBootTest
@ActiveProfiles("integration")
@DisplayName("Account Lockout Integration Tests")
class AccountLockoutServiceTest extends AbstractIntegrationTest {

    @Autowired
    private AccountLockoutService lockoutService;

    @Autowired
    private AccountLockoutRepository lockoutRepository;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    private static final String TEST_EMAIL = "lockout-test@test.com";
    private static final String TEST_IP = "10.0.0.1";

    @BeforeEach
    void setUp() {
        lockoutRepository.deleteAll();
        loginAttemptRepository.deleteAll();
    }

    @Nested
    @DisplayName("Failed Login Tracking")
    class FailedLoginTracking {

        @Test
        @DisplayName("Should record failed login attempt")
        void shouldRecordFailedAttempt() {
            lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Invalid password");

            var attempts = loginAttemptRepository.findAll();
            assertFalse(attempts.isEmpty());
            assertEquals(TEST_EMAIL, attempts.get(0).getEmail());
            assertFalse(attempts.get(0).getSuccessful());
        }

        @Test
        @DisplayName("Should lock account after max failed attempts")
        void shouldLockAfterMaxAttempts() {
            // Default max attempts is 5
            for (int i = 0; i < 5; i++) {
                lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Wrong password");
            }

            assertTrue(lockoutService.isAccountLocked(TEST_EMAIL),
                    "Account should be locked after 5 failed attempts");
        }

        @Test
        @DisplayName("Should not lock before reaching max attempts")
        void shouldNotLockBeforeMax() {
            for (int i = 0; i < 4; i++) {
                lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Wrong password");
            }

            assertFalse(lockoutService.isAccountLocked(TEST_EMAIL),
                    "Account should not be locked after 4 attempts");
        }
    }

    @Nested
    @DisplayName("Account Unlock")
    class AccountUnlock {

        @Test
        @DisplayName("Should unlock account manually")
        void shouldUnlockManually() {
            // Lock the account
            for (int i = 0; i < 5; i++) {
                lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Wrong password");
            }
            assertTrue(lockoutService.isAccountLocked(TEST_EMAIL));

            // Unlock
            lockoutService.unlockAccount(TEST_EMAIL);

            assertFalse(lockoutService.isAccountLocked(TEST_EMAIL),
                    "Account should be unlocked after manual unlock");
        }

        @Test
        @DisplayName("Should reset failed attempts on successful login")
        void shouldResetOnSuccessfulLogin() {
            // Record some failures
            for (int i = 0; i < 3; i++) {
                lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Wrong password");
            }

            // Successful login
            lockoutService.recordSuccessfulLogin(TEST_EMAIL, TEST_IP, "Mozilla/5.0");

            // Should not be locked even after more attempts (counter reset)
            lockoutService.recordFailedAttempt(TEST_EMAIL, TEST_IP, "Mozilla/5.0", "Wrong password");

            assertFalse(lockoutService.isAccountLocked(TEST_EMAIL));
        }
    }

    @Nested
    @DisplayName("IP Blocking")
    class IpBlocking {

        @Test
        @DisplayName("Should block IP after excessive attempts across accounts")
        void shouldBlockIpAfterExcessiveAttempts() {
            // Attempt login on 20+ different accounts from same IP
            for (int i = 0; i < 21; i++) {
                lockoutService.recordFailedAttempt("user" + i + "@test.com", TEST_IP, "Mozilla/5.0", "Wrong password");
            }

            assertTrue(lockoutService.isIpBlocked(TEST_IP),
                    "IP should be blocked after too many attempts");
        }
    }
}
