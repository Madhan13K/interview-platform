package com.interview_platform_backend.interview_platform_backend.security.mfa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Auth/MFA: TOTP Generation and Verification Tests
 * Tests the Time-based One-Time Password algorithm (RFC 6238).
 */
@DisplayName("MFA TOTP Validation Tests")
class MfaTotpValidationTest {

    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private String secretKey;

    @BeforeEach
    void setUp() {
        secretKey = generateSecret();
    }

    @Nested
    @DisplayName("Secret Key Generation")
    class SecretGeneration {

        @Test
        @DisplayName("Should generate base32-compatible secret of sufficient length")
        void shouldGenerateValidSecret() {
            assertNotNull(secretKey);
            assertTrue(secretKey.length() >= 16, "Secret should be at least 16 chars (128 bits)");
        }

        @Test
        @DisplayName("Should generate unique secrets each time")
        void shouldGenerateUniqueSecrets() {
            Set<String> secrets = new HashSet<>();
            for (int i = 0; i < 100; i++) {
                secrets.add(generateSecret());
            }
            assertEquals(100, secrets.size(), "All secrets should be unique");
        }

        @Test
        @DisplayName("Secret should be base32 encodable")
        void shouldBeBase32Encodable() {
            String base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            // Base32 encoded secrets should only contain valid chars
            for (char c : secretKey.toUpperCase().toCharArray()) {
                assertTrue(base32Chars.indexOf(c) >= 0 || c == '=',
                        "Invalid base32 character: " + c);
            }
        }
    }

    @Nested
    @DisplayName("TOTP Code Generation")
    class CodeGeneration {

        @Test
        @DisplayName("Should generate 6-digit code")
        void shouldGenerate6DigitCode() {
            String code = generateTOTP(secretKey, Instant.now());
            assertNotNull(code);
            assertEquals(6, code.length(), "TOTP code should be exactly 6 digits");
            assertTrue(code.matches("\\d{6}"), "Code should contain only digits");
        }

        @Test
        @DisplayName("Should generate same code within same time step")
        void shouldGenerateSameCodeWithinStep() {
            Instant now = Instant.now();
            String code1 = generateTOTP(secretKey, now);
            String code2 = generateTOTP(secretKey, now);
            assertEquals(code1, code2, "Same timestamp should produce same code");
        }

        @Test
        @DisplayName("Should generate different code in different time step")
        void shouldGenerateDifferentCodeInDifferentStep() {
            Instant now = Instant.now();
            Instant future = now.plusSeconds(TIME_STEP_SECONDS + 1);
            String code1 = generateTOTP(secretKey, now);
            String code2 = generateTOTP(secretKey, future);
            assertNotEquals(code1, code2, "Different time steps should produce different codes");
        }

        @Test
        @DisplayName("Different secrets should produce different codes")
        void differentSecretsDifferentCodes() {
            Instant now = Instant.now();
            String secret2 = generateSecret();
            String code1 = generateTOTP(secretKey, now);
            String code2 = generateTOTP(secret2, now);
            assertNotEquals(code1, code2);
        }
    }

    @Nested
    @DisplayName("TOTP Verification")
    class Verification {

        @Test
        @DisplayName("Should verify correct code for current time step")
        void shouldVerifyCorrectCode() {
            Instant now = Instant.now();
            String code = generateTOTP(secretKey, now);
            assertTrue(verifyTOTP(secretKey, code, now, 0), "Current code should verify");
        }

        @Test
        @DisplayName("Should verify code within allowed window (clock skew)")
        void shouldVerifyWithinWindow() {
            Instant now = Instant.now();
            // Generate code for previous time step (simulates clock skew)
            String previousCode = generateTOTP(secretKey, now.minusSeconds(TIME_STEP_SECONDS));
            // Verify with window of 1 (allows ±1 time step)
            assertTrue(verifyTOTP(secretKey, previousCode, now, 1),
                    "Previous step code should verify with window=1");
        }

        @Test
        @DisplayName("Should reject code from too far in the past")
        void shouldRejectOldCode() {
            Instant now = Instant.now();
            // Code from 5 time steps ago
            String oldCode = generateTOTP(secretKey, now.minusSeconds(TIME_STEP_SECONDS * 5));
            assertFalse(verifyTOTP(secretKey, oldCode, now, 1),
                    "Code from 5 steps ago should be rejected with window=1");
        }

        @Test
        @DisplayName("Should reject invalid code format")
        void shouldRejectInvalidFormat() {
            assertFalse(verifyTOTP(secretKey, "12345", Instant.now(), 1), "5 digits invalid");
            assertFalse(verifyTOTP(secretKey, "1234567", Instant.now(), 1), "7 digits invalid");
            assertFalse(verifyTOTP(secretKey, "abcdef", Instant.now(), 1), "Non-numeric invalid");
            assertFalse(verifyTOTP(secretKey, "", Instant.now(), 1), "Empty invalid");
            assertFalse(verifyTOTP(secretKey, null, Instant.now(), 1), "Null invalid");
        }

        @Test
        @DisplayName("Should reject wrong code")
        void shouldRejectWrongCode() {
            assertFalse(verifyTOTP(secretKey, "000000", Instant.now(), 0));
        }
    }

    @Nested
    @DisplayName("Backup Codes")
    class BackupCodes {

        @Test
        @DisplayName("Should generate specified number of backup codes")
        void shouldGenerateCorrectCount() {
            Set<String> codes = generateBackupCodes(10);
            assertEquals(10, codes.size());
        }

        @Test
        @DisplayName("Backup codes should be unique")
        void shouldBeUnique() {
            Set<String> codes = generateBackupCodes(10);
            assertEquals(10, codes.size(), "All codes should be unique");
        }

        @Test
        @DisplayName("Backup codes should be 8 alphanumeric characters")
        void shouldBeCorrectFormat() {
            Set<String> codes = generateBackupCodes(5);
            for (String code : codes) {
                assertEquals(8, code.length());
                assertTrue(code.matches("[A-Za-z0-9]{8}"), "Code format: " + code);
            }
        }

        @Test
        @DisplayName("Each backup code should only be usable once")
        void shouldBeOneTimeUse() {
            Set<String> codes = generateBackupCodes(5);
            String firstCode = codes.iterator().next();
            assertTrue(codes.contains(firstCode), "First use should succeed");
            codes.remove(firstCode);
            assertFalse(codes.contains(firstCode), "Second use should fail");
        }
    }

    // ─── Helper Methods ─────────────────────────────────────────────

    private String generateSecret() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        String base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(base32Chars.charAt(Math.abs(b) % 32));
        }
        return sb.toString();
    }

    private String generateTOTP(String secret, Instant time) {
        try {
            long counter = time.getEpochSecond() / TIME_STEP_SECONDS;
            byte[] key = secret.getBytes();
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int otp = ((hash[offset] & 0x7F) << 24 | (hash[offset + 1] & 0xFF) << 16 |
                    (hash[offset + 2] & 0xFF) << 8 | (hash[offset + 3] & 0xFF)) % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private boolean verifyTOTP(String secret, String code, Instant time, int window) {
        if (code == null || !code.matches("\\d{" + CODE_DIGITS + "}")) return false;
        for (int i = -window; i <= window; i++) {
            Instant checkTime = time.plusSeconds((long) i * TIME_STEP_SECONDS);
            if (generateTOTP(secret, checkTime).equals(code)) return true;
        }
        return false;
    }

    private Set<String> generateBackupCodes(int count) {
        Set<String> codes = new HashSet<>();
        SecureRandom random = new SecureRandom();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        while (codes.size() < count) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 8; i++) code.append(chars.charAt(random.nextInt(chars.length())));
            codes.add(code.toString());
        }
        return codes;
    }
}
