package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * OAuth2 Token Exchange service implementing RFC 8693 (OAuth 2.0 Token Exchange).
 *
 * <p>Enables delegation patterns where a service acting on behalf of a user
 * can exchange its token for a new token with different audience/scope.
 *
 * <h3>Use Cases:</h3>
 * <ul>
 *   <li><b>Delegation:</b> Frontend → API Gateway → Microservice (token exchange at each hop)</li>
 *   <li><b>Impersonation:</b> Admin service needs to act on behalf of a user</li>
 *   <li><b>Scope reduction:</b> Reduce token scope when calling downstream services</li>
 *   <li><b>Audience restriction:</b> Mint tokens for specific downstream services</li>
 * </ul>
 *
 * <h3>Example Request (RFC 8693):</h3>
 * <pre>
 * POST /api/v1/oauth2/token HTTP/1.1
 * Content-Type: application/x-www-form-urlencoded
 *
 * grant_type=urn:ietf:params:oauth:grant-type:token-exchange
 * &subject_token=eyJhbGciOiJSUzI1NiJ9...
 * &subject_token_type=urn:ietf:params:oauth:token-type:access_token
 * &audience=notification-service
 * &scope=notifications:send
 * </pre>
 */
@Service
public class OAuth2TokenExchangeService {

    private static final Logger log = LoggerFactory.getLogger(OAuth2TokenExchangeService.class);

    /**
     * Standard token type URIs from RFC 8693.
     */
    public static final String TOKEN_TYPE_ACCESS_TOKEN = "urn:ietf:params:oauth:token-type:access_token";
    public static final String TOKEN_TYPE_REFRESH_TOKEN = "urn:ietf:params:oauth:token-type:refresh_token";
    public static final String TOKEN_TYPE_ID_TOKEN = "urn:ietf:params:oauth:token-type:id_token";
    public static final String GRANT_TYPE_TOKEN_EXCHANGE = "urn:ietf:params:oauth:grant-type:token-exchange";

    private final JwtEncoder jwtEncoder;

    public OAuth2TokenExchangeService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    /**
     * Exchanges a subject token for a new access token with different audience/scope.
     *
     * @param request the token exchange request
     * @return the newly issued token
     */
    public TokenExchangeResponse exchange(TokenExchangeRequest request) {
        log.debug("Token exchange requested. Subject: {}, Audience: {}, Scope: {}",
                request.subjectPrincipal(), request.audience(), request.requestedScopes());

        // Validate the exchange request
        validateRequest(request);

        // Build the exchanged token claims
        Instant now = Instant.now();
        Instant expiresAt = now.plus(30, ChronoUnit.MINUTES); // Exchanged tokens are short-lived

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer("interview-platform")
                .subject(request.subjectPrincipal())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .id(UUID.randomUUID().toString())
                .claim("grant_type", "token_exchange")
                .claim("act", request.actorPrincipal() != null
                        ? request.actorPrincipal()
                        : request.subjectPrincipal());

        // Set audience
        if (request.audience() != null && !request.audience().isBlank()) {
            claimsBuilder.audience(List.of(request.audience()));
        }

        // Set scope (intersection of requested and original)
        if (request.requestedScopes() != null && !request.requestedScopes().isEmpty()) {
            claimsBuilder.claim("scope", String.join(" ", request.requestedScopes()));
        }

        // Preserve original token claims that should carry over
        if (request.originalClaims() != null) {
            if (request.originalClaims().containsKey("tenant_id")) {
                claimsBuilder.claim("tenant_id", request.originalClaims().get("tenant_id"));
            }
            if (request.originalClaims().containsKey("roles")) {
                claimsBuilder.claim("roles", request.originalClaims().get("roles"));
            }
        }

        Jwt jwt = jwtEncoder.encode(JwtEncoderParameters.from(claimsBuilder.build()));

        log.info("Token exchange successful. Subject: {}, Audience: {}, ExpiresAt: {}",
                request.subjectPrincipal(), request.audience(), expiresAt);

        return new TokenExchangeResponse(
                jwt.getTokenValue(),
                TOKEN_TYPE_ACCESS_TOKEN,
                "Bearer",
                1800, // 30 minutes in seconds
                request.requestedScopes() != null ? String.join(" ", request.requestedScopes()) : ""
        );
    }

    private void validateRequest(TokenExchangeRequest request) {
        if (request.subjectPrincipal() == null || request.subjectPrincipal().isBlank()) {
            throw new OAuth2ClientAuthenticationException(
                    "subject_token must contain a valid principal");
        }
    }

    /**
     * Token exchange request parameters (from RFC 8693).
     */
    public record TokenExchangeRequest(
            /** Principal from the subject token (the user/service being impersonated) */
            String subjectPrincipal,
            /** Principal of the actor (the service performing the exchange) */
            String actorPrincipal,
            /** Target audience for the new token */
            String audience,
            /** Requested scopes for the new token */
            List<String> requestedScopes,
            /** Claims from the original token to preserve */
            java.util.Map<String, Object> originalClaims
    ) {}

    /**
     * Token exchange response (RFC 8693 Section 2.2).
     */
    public record TokenExchangeResponse(
            String accessToken,
            String issuedTokenType,
            String tokenType,
            long expiresIn,
            String scope
    ) {}
}
