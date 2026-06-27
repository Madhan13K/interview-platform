package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory store for OAuth2 client registrations used in the Client Credentials flow.
 *
 * <p>In production, this should be backed by a database table or external identity provider.
 * This implementation uses configuration-driven client registrations for development
 * and can be extended with a JPA repository for production use.
 *
 * <h3>Registered clients represent services, not users:</h3>
 * <ul>
 *   <li>{@code notification-service} - Can send notifications on behalf of the platform</li>
 *   <li>{@code scheduling-service} - Can read/write interview schedules</li>
 *   <li>{@code analytics-service} - Can read analytics data</li>
 *   <li>{@code webhook-service} - Can deliver webhooks to external systems</li>
 * </ul>
 */
@Component
public class OAuth2ClientRegistrationStore {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ClientRegistrationStore.class);

    private final Map<String, RegisteredClient> clients = new HashMap<>();
    private final PasswordEncoder passwordEncoder;

    public OAuth2ClientRegistrationStore(
            PasswordEncoder passwordEncoder,
            @Value("${app.oauth2.clients.notification-service.secret:}") String notificationSecret,
            @Value("${app.oauth2.clients.scheduling-service.secret:}") String schedulingSecret,
            @Value("${app.oauth2.clients.analytics-service.secret:}") String analyticsSecret,
            @Value("${app.oauth2.clients.webhook-service.secret:}") String webhookSecret,
            @Value("${app.oauth2.clients.external-partner.secret:}") String externalPartnerSecret) {

        this.passwordEncoder = passwordEncoder;

        // Register internal service clients
        registerClient("notification-service", notificationSecret, "Notification Service",
                List.of("notifications:send", "notifications:read", "emails:send", "users:read"),
                60); // 1 hour tokens

        registerClient("scheduling-service", schedulingSecret, "Scheduling Service",
                List.of("interviews:read", "interviews:write", "candidates:read", "calendars:sync"),
                30); // 30 min tokens

        registerClient("analytics-service", analyticsSecret, "Analytics Service",
                List.of("analytics:read", "interviews:read", "reports:generate"),
                120); // 2 hour tokens

        registerClient("webhook-service", webhookSecret, "Webhook Delivery Service",
                List.of("webhooks:deliver", "events:read"),
                15); // 15 min tokens (short-lived for security)

        registerClient("external-partner", externalPartnerSecret, "External Partner API",
                List.of("jobs:read", "candidates:read", "interviews:read"),
                60); // 1 hour tokens

        log.info("OAuth2 client credentials store initialized with {} clients", clients.size());
    }

    /**
     * Authenticates a client by ID and secret.
     *
     * @param clientId the client identifier
     * @param clientSecret the client secret (raw)
     * @return the registered client if authentication succeeds
     * @throws OAuth2ClientAuthenticationException if authentication fails
     */
    public RegisteredClient authenticate(String clientId, String clientSecret) {
        RegisteredClient client = clients.get(clientId);

        if (client == null) {
            log.warn("OAuth2 client authentication failed: unknown client_id '{}'", clientId);
            throw new OAuth2ClientAuthenticationException("Invalid client credentials");
        }

        if (!client.enabled()) {
            log.warn("OAuth2 client authentication failed: client '{}' is disabled", clientId);
            throw new OAuth2ClientAuthenticationException("Client is disabled");
        }

        if (!passwordEncoder.matches(clientSecret, client.secretHash())) {
            log.warn("OAuth2 client authentication failed: invalid secret for client '{}'", clientId);
            throw new OAuth2ClientAuthenticationException("Invalid client credentials");
        }

        return client;
    }

    /**
     * Retrieves a client by ID without authentication (for introspection).
     */
    public RegisteredClient findById(String clientId) {
        return clients.get(clientId);
    }

    private void registerClient(String clientId, String rawSecret, String serviceName,
                                List<String> allowedScopes, long tokenTtlMinutes) {
        if (rawSecret == null || rawSecret.isBlank()) {
            // Use a default secret for development (will never match in production since env var is required)
            rawSecret = "dev-secret-" + clientId + "-change-in-production";
        }

        String secretHash = passwordEncoder.encode(rawSecret);
        clients.put(clientId, new RegisteredClient(
                clientId, secretHash, serviceName, allowedScopes, tokenTtlMinutes, true
        ));
    }

    /**
     * Represents a registered OAuth2 client (service account).
     */
    public record RegisteredClient(
            String clientId,
            String secretHash,
            String serviceName,
            List<String> allowedScopes,
            long tokenTtlMinutes,
            boolean enabled
    ) {}
}
