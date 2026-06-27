package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * OAuth2 Client Credentials service for service-to-service authentication.
 *
 * <p>Implements the OAuth2 Client Credentials Grant (RFC 6749, Section 4.4) for
 * machine-to-machine communication where no user context is required.
 *
 * <h3>Use Cases:</h3>
 * <ul>
 *   <li>Microservice-to-microservice API calls</li>
 *   <li>Background job authentication (scheduled tasks, queue workers)</li>
 *   <li>External service integrations (webhooks, callbacks)</li>
 *   <li>Internal admin/automation tools</li>
 * </ul>
 *
 * <h3>Security Model:</h3>
 * <p>Client credentials tokens are issued to pre-registered service accounts
 * (identified by clientId/clientSecret) and scoped to specific permissions.
 * These tokens do NOT represent a user and should never be used for
 * user-facing operations.
 *
 * <h3>Example Flow:</h3>
 * <pre>
 * POST /api/v1/oauth2/token
 * Content-Type: application/x-www-form-urlencoded
 *
 * grant_type=client_credentials
 * &client_id=notification-service
 * &client_secret=secret123
 * &scope=notifications:send emails:send
 * </pre>
 */
@Service
public class OAuth2ClientCredentialsService {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ClientCredentialsService.class);

    private final JwtEncoder jwtEncoder;
    private final OAuth2ClientRegistrationStore clientStore;

    public OAuth2ClientCredentialsService(JwtEncoder jwtEncoder,
                                          OAuth2ClientRegistrationStore clientStore) {
        this.jwtEncoder = jwtEncoder;
        this.clientStore = clientStore;
    }

    /**
     * Issues an access token for a service client using the client credentials grant.
     *
     * @param clientId     the registered client identifier
     * @param clientSecret the client's secret
     * @param requestedScopes the scopes requested (subset of client's allowed scopes)
     * @return the issued token response
     * @throws OAuth2ClientAuthenticationException if client credentials are invalid
     */
    public ClientCredentialsTokenResponse issueToken(String clientId,
                                                      String clientSecret,
                                                      List<String> requestedScopes) {
        // 1. Authenticate the client
        OAuth2ClientRegistrationStore.RegisteredClient registeredClient =
                clientStore.authenticate(clientId, clientSecret);

        // 2. Validate requested scopes against client's allowed scopes
        List<String> grantedScopes = validateScopes(requestedScopes, registeredClient.allowedScopes());

        // 3. Generate the access token
        Instant now = Instant.now();
        Instant expiresAt = now.plus(registeredClient.tokenTtlMinutes(), ChronoUnit.MINUTES);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("interview-platform")
                .subject(clientId)
                .audience(List.of("interview-platform-api"))
                .issuedAt(now)
                .expiresAt(expiresAt)
                .id(UUID.randomUUID().toString())
                .claim("client_id", clientId)
                .claim("grant_type", "client_credentials")
                .claim("scope", String.join(" ", grantedScopes))
                .claim("service_name", registeredClient.serviceName())
                .build();

        Jwt jwt = jwtEncoder.encode(JwtEncoderParameters.from(claims));

        log.info("Issued client_credentials token for client '{}' (service: {}), scopes: {}, expires: {}",
                clientId, registeredClient.serviceName(), grantedScopes, expiresAt);

        return new ClientCredentialsTokenResponse(
                jwt.getTokenValue(),
                "Bearer",
                registeredClient.tokenTtlMinutes() * 60, // Convert to seconds
                String.join(" ", grantedScopes)
        );
    }

    /**
     * Validates that requested scopes are a subset of the client's allowed scopes.
     * If no scopes are requested, returns all allowed scopes.
     */
    private List<String> validateScopes(List<String> requestedScopes,
                                        List<String> allowedScopes) {
        if (requestedScopes == null || requestedScopes.isEmpty()) {
            return allowedScopes; // Default to all allowed scopes
        }

        List<String> invalidScopes = requestedScopes.stream()
                .filter(scope -> !allowedScopes.contains(scope))
                .toList();

        if (!invalidScopes.isEmpty()) {
            throw new OAuth2ClientAuthenticationException(
                    "Requested scopes not allowed for this client: " + invalidScopes);
        }

        return requestedScopes;
    }

    /**
     * Token response for the client credentials grant.
     */
    public record ClientCredentialsTokenResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            String scope
    ) {}
}
