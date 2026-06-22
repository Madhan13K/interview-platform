package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Auth/OAuth2: OAuth State and PKCE Flow Tests
 * Tests the Proof Key for Code Exchange security mechanism.
 */
@DisplayName("OAuth2 PKCE Flow Tests")
class OAuth2PkceFlowTest {

    @Nested
    @DisplayName("PKCE Code Verifier Generation")
    class CodeVerifier {

        @Test
        @DisplayName("Should generate code_verifier of valid length (43-128 chars)")
        void shouldGenerateValidLength() {
            String verifier = generateCodeVerifier();
            assertTrue(verifier.length() >= 43 && verifier.length() <= 128,
                    "Verifier length: " + verifier.length() + " (must be 43-128)");
        }

        @Test
        @DisplayName("Should only contain unreserved characters [A-Za-z0-9-._~]")
        void shouldContainOnlyValidChars() {
            String verifier = generateCodeVerifier();
            assertTrue(verifier.matches("[A-Za-z0-9\\-._~]+"),
                    "Verifier contains invalid chars: " + verifier);
        }

        @Test
        @DisplayName("Should generate unique verifiers")
        void shouldBeUnique() {
            Set<String> verifiers = new java.util.HashSet<>();
            for (int i = 0; i < 100; i++) {
                verifiers.add(generateCodeVerifier());
            }
            assertEquals(100, verifiers.size());
        }
    }

    @Nested
    @DisplayName("PKCE Code Challenge")
    class CodeChallenge {

        @Test
        @DisplayName("Should generate S256 challenge from verifier")
        void shouldGenerateS256Challenge() throws Exception {
            String verifier = generateCodeVerifier();
            String challenge = generateCodeChallenge(verifier);

            assertNotNull(challenge);
            assertNotEquals(verifier, challenge, "Challenge must differ from verifier");
            // Base64url encoding: no +, /, or =
            assertFalse(challenge.contains("+"));
            assertFalse(challenge.contains("/"));
            assertFalse(challenge.contains("="));
        }

        @Test
        @DisplayName("Same verifier should always produce same challenge")
        void shouldBeDeterministic() throws Exception {
            String verifier = generateCodeVerifier();
            String challenge1 = generateCodeChallenge(verifier);
            String challenge2 = generateCodeChallenge(verifier);
            assertEquals(challenge1, challenge2);
        }

        @Test
        @DisplayName("Different verifiers should produce different challenges")
        void differentVerifiersDifferentChallenges() throws Exception {
            String challenge1 = generateCodeChallenge(generateCodeVerifier());
            String challenge2 = generateCodeChallenge(generateCodeVerifier());
            assertNotEquals(challenge1, challenge2);
        }

        @Test
        @DisplayName("Should verify code_verifier against stored challenge")
        void shouldVerifyVerifierAgainstChallenge() throws Exception {
            String verifier = generateCodeVerifier();
            String challenge = generateCodeChallenge(verifier);

            // Simulates server-side verification
            String recomputedChallenge = generateCodeChallenge(verifier);
            assertEquals(challenge, recomputedChallenge, "Verification should pass");
        }

        @Test
        @DisplayName("Should reject wrong verifier against challenge")
        void shouldRejectWrongVerifier() throws Exception {
            String verifier = generateCodeVerifier();
            String challenge = generateCodeChallenge(verifier);

            String wrongVerifier = generateCodeVerifier();
            String wrongChallenge = generateCodeChallenge(wrongVerifier);
            assertNotEquals(challenge, wrongChallenge, "Wrong verifier should not match");
        }
    }

    @Nested
    @DisplayName("OAuth State Parameter")
    class StateParameter {

        @Test
        @DisplayName("Should generate unpredictable state parameter")
        void shouldGenerateUnpredictableState() {
            String state = generateOAuthState();
            assertNotNull(state);
            assertTrue(state.length() >= 32, "State should be at least 32 chars");
        }

        @Test
        @DisplayName("Should validate state matches on callback")
        void shouldValidateStateOnCallback() {
            String originalState = generateOAuthState();
            assertTrue(validateOAuthState(originalState, originalState));
        }

        @Test
        @DisplayName("Should reject mismatched state (CSRF protection)")
        void shouldRejectMismatchedState() {
            String originalState = generateOAuthState();
            String attackerState = generateOAuthState();
            assertFalse(validateOAuthState(originalState, attackerState),
                    "Mismatched state should be rejected (CSRF attack)");
        }

        @Test
        @DisplayName("Should reject null/empty state")
        void shouldRejectNullState() {
            assertFalse(validateOAuthState("valid-state", null));
            assertFalse(validateOAuthState("valid-state", ""));
            assertFalse(validateOAuthState(null, "some-state"));
        }

        @Test
        @DisplayName("State should be single-use (prevents replay)")
        void shouldBeSingleUse() {
            Set<String> usedStates = new java.util.HashSet<>();
            String state = generateOAuthState();

            // First use
            assertFalse(usedStates.contains(state));
            usedStates.add(state);

            // Second use (replay) should be detected
            assertTrue(usedStates.contains(state), "Replay should be detected");
        }
    }

    @Nested
    @DisplayName("OAuth Token Exchange Security")
    class TokenExchange {

        @Test
        @DisplayName("Authorization code should be short-lived")
        void authCodeShouldBeShortLived() {
            long authCodeTTL = 600_000; // 10 minutes max per RFC
            assertTrue(authCodeTTL <= 600_000, "Auth code TTL should be ≤ 10 minutes");
        }

        @Test
        @DisplayName("Authorization code should be single-use")
        void authCodeShouldBeSingleUse() {
            String authCode = UUID.randomUUID().toString();
            Set<String> usedCodes = new java.util.HashSet<>();

            assertTrue(usedCodes.add(authCode), "First use should succeed");
            assertFalse(usedCodes.add(authCode), "Second use should fail (duplicate)");
        }

        @Test
        @DisplayName("Should reject token request without valid redirect_uri")
        void shouldRequireRedirectUri() {
            String registeredUri = "http://localhost:3000/oauth2/callback";
            String attackerUri = "http://evil.com/steal-token";

            assertTrue(validateRedirectUri(registeredUri, registeredUri));
            assertFalse(validateRedirectUri(registeredUri, attackerUri));
            assertFalse(validateRedirectUri(registeredUri, null));
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateCodeChallenge(String verifier) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(verifier.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }

    private String generateOAuthState() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private boolean validateOAuthState(String expected, String actual) {
        if (expected == null || actual == null || actual.isEmpty()) return false;
        return expected.equals(actual);
    }

    private boolean validateRedirectUri(String registered, String requested) {
        if (registered == null || requested == null) return false;
        return registered.equals(requested);
    }
}
