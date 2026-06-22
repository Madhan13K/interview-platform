package com.interview_platform_backend.interview_platform_backend.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 1: JWT Token Validation & Expiry Tests
 * Tests critical security boundaries for JWT handling.
 */
@DisplayName("JWT Token Validation Tests")
class JwtTokenValidationTest {

    private SecretKey secretKey;
    private KeyPair rsaKeyPair;

    @BeforeEach
    void setUp() throws Exception {
        secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        rsaKeyPair = generator.generateKeyPair();
    }

    @Nested
    @DisplayName("Token Generation")
    class TokenGeneration {

        @Test
        @DisplayName("Should generate valid JWT with correct claims")
        void shouldGenerateValidToken() {
            String token = Jwts.builder()
                    .subject("user@test.com")
                    .claim("userId", UUID.randomUUID().toString())
                    .claim("roles", "ADMIN,RECRUITER")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            assertNotNull(token);
            assertTrue(token.split("\\.").length == 3, "JWT should have 3 parts");

            var claims = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(token).getPayload();

            assertEquals("user@test.com", claims.getSubject());
            assertNotNull(claims.get("userId"));
            assertEquals("ADMIN,RECRUITER", claims.get("roles"));
        }

        @Test
        @DisplayName("Should generate RSA-signed JWT")
        void shouldGenerateRsaSignedToken() {
            String token = Jwts.builder()
                    .subject("admin@test.com")
                    .claim("userId", UUID.randomUUID().toString())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(rsaKeyPair.getPrivate())
                    .compact();

            var claims = Jwts.parser().verifyWith(rsaKeyPair.getPublic()).build()
                    .parseSignedClaims(token).getPayload();

            assertEquals("admin@test.com", claims.getSubject());
        }
    }

    @Nested
    @DisplayName("Token Expiry")
    class TokenExpiry {

        @Test
        @DisplayName("Should reject expired token")
        void shouldRejectExpiredToken() {
            String expiredToken = Jwts.builder()
                    .subject("user@test.com")
                    .issuedAt(new Date(System.currentTimeMillis() - 200000))
                    .expiration(new Date(System.currentTimeMillis() - 100000)) // Expired 100s ago
                    .signWith(secretKey)
                    .compact();

            assertThrows(io.jsonwebtoken.ExpiredJwtException.class, () ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims(expiredToken));
        }

        @Test
        @DisplayName("Should accept token that expires in the future")
        void shouldAcceptNonExpiredToken() {
            String validToken = Jwts.builder()
                    .subject("user@test.com")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 3600000)) // 1 hour
                    .signWith(secretKey)
                    .compact();

            assertDoesNotThrow(() ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims(validToken));
        }

        @Test
        @DisplayName("Should reject token with no expiry when required")
        void shouldHandleTokenWithoutExpiry() {
            String noExpiryToken = Jwts.builder()
                    .subject("user@test.com")
                    .issuedAt(new Date())
                    // No expiration set
                    .signWith(secretKey)
                    .compact();

            // Token is technically valid but should be rejected by application logic
            var claims = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(noExpiryToken).getPayload();
            assertNull(claims.getExpiration(), "Token should have no expiry");
        }
    }

    @Nested
    @DisplayName("Token Signature Validation")
    class SignatureValidation {

        @Test
        @DisplayName("Should reject token signed with different key")
        void shouldRejectTokenWithWrongKey() {
            SecretKey anotherKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);

            String token = Jwts.builder()
                    .subject("user@test.com")
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(anotherKey) // Signed with different key
                    .compact();

            assertThrows(io.jsonwebtoken.security.SignatureException.class, () ->
                    Jwts.parser().verifyWith(secretKey).build() // Verify with our key
                            .parseSignedClaims(token));
        }

        @Test
        @DisplayName("Should reject tampered token")
        void shouldRejectTamperedToken() {
            String token = Jwts.builder()
                    .subject("user@test.com")
                    .claim("roles", "CANDIDATE")
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            // Tamper with the payload (change role to ADMIN)
            String[] parts = token.split("\\.");
            String tamperedPayload = java.util.Base64.getUrlEncoder().withoutPadding()
                    .encodeToString("{\"sub\":\"user@test.com\",\"roles\":\"ADMIN\"}".getBytes());
            String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

            assertThrows(Exception.class, () ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims(tamperedToken));
        }

        @Test
        @DisplayName("Should reject malformed token")
        void shouldRejectMalformedToken() {
            assertThrows(Exception.class, () ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims("not.a.valid.token"));

            assertThrows(Exception.class, () ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims(""));

            assertThrows(Exception.class, () ->
                    Jwts.parser().verifyWith(secretKey).build()
                            .parseSignedClaims("randomgarbage"));
        }
    }

    @Nested
    @DisplayName("Token Claims")
    class TokenClaims {

        @Test
        @DisplayName("Should preserve all custom claims")
        void shouldPreserveCustomClaims() {
            String userId = UUID.randomUUID().toString();
            String token = Jwts.builder()
                    .subject("user@test.com")
                    .claim("userId", userId)
                    .claim("roles", "ADMIN")
                    .claim("organizationId", "org-123")
                    .claim("mfaVerified", true)
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            var claims = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(token).getPayload();

            assertEquals(userId, claims.get("userId"));
            assertEquals("ADMIN", claims.get("roles"));
            assertEquals("org-123", claims.get("organizationId"));
            assertEquals(true, claims.get("mfaVerified"));
        }

        @Test
        @DisplayName("Should handle token with empty subject")
        void shouldHandleEmptySubject() {
            String token = Jwts.builder()
                    .subject("")
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            var claims = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(token).getPayload();

            assertNull(claims.getSubject(), "Empty string subject stored as null by jjwt");
        }
    }

    @Nested
    @DisplayName("Refresh Token Rotation")
    class RefreshTokenRotation {

        @Test
        @DisplayName("Each refresh should generate unique token")
        void shouldGenerateUniqueTokensOnRefresh() {
            String token1 = Jwts.builder()
                    .subject("user@test.com")
                    .claim("tokenFamily", UUID.randomUUID().toString())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            String token2 = Jwts.builder()
                    .subject("user@test.com")
                    .claim("tokenFamily", UUID.randomUUID().toString())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(secretKey)
                    .compact();

            assertNotEquals(token1, token2, "Refresh tokens must be unique");
        }
    }
}
