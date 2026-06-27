package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * OAuth2 Token Endpoint implementing the Client Credentials Grant (RFC 6749 Section 4.4).
 *
 * <p>This endpoint issues access tokens to authenticated service clients for
 * machine-to-machine communication. It implements the standard OAuth2 token endpoint
 * semantics including:
 * <ul>
 *   <li>Client authentication via client_id/client_secret in request body</li>
 *   <li>Scope validation and restriction</li>
 *   <li>Standard OAuth2 error responses (RFC 6749 Section 5.2)</li>
 * </ul>
 *
 * <h3>Request Example:</h3>
 * <pre>
 * POST /api/v1/oauth2/token HTTP/1.1
 * Content-Type: application/x-www-form-urlencoded
 *
 * grant_type=client_credentials
 * &client_id=notification-service
 * &client_secret=YOUR_SECRET
 * &scope=notifications:send emails:send
 * </pre>
 *
 * <h3>Success Response:</h3>
 * <pre>
 * HTTP/1.1 200 OK
 * Content-Type: application/json
 *
 * {
 *   "access_token": "eyJhbGciOiJSUzI1NiJ9...",
 *   "token_type": "Bearer",
 *   "expires_in": 3600,
 *   "scope": "notifications:send emails:send"
 * }
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/oauth2")
public class OAuth2TokenController {

    private static final Logger log = LoggerFactory.getLogger(OAuth2TokenController.class);

    private final OAuth2ClientCredentialsService clientCredentialsService;

    public OAuth2TokenController(OAuth2ClientCredentialsService clientCredentialsService) {
        this.clientCredentialsService = clientCredentialsService;
    }

    /**
     * OAuth2 Token Endpoint - Issues access tokens for the client_credentials grant.
     */
    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> token(
            @RequestParam("grant_type") String grantType,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret,
            @RequestParam(value = "scope", required = false) String scope) {

        // Validate grant type
        if (!"client_credentials".equals(grantType)) {
            log.warn("Unsupported grant_type: {} from client: {}", grantType, clientId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", "unsupported_grant_type",
                            "error_description", "Only 'client_credentials' grant type is supported at this endpoint"
                    ));
        }

        // Validate required parameters
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", "invalid_request",
                            "error_description", "client_id and client_secret are required"
                    ));
        }

        try {
            // Parse requested scopes
            List<String> requestedScopes = (scope != null && !scope.isBlank())
                    ? Arrays.asList(scope.split("\\s+"))
                    : List.of();

            // Issue the token
            OAuth2ClientCredentialsService.ClientCredentialsTokenResponse tokenResponse =
                    clientCredentialsService.issueToken(clientId, clientSecret, requestedScopes);

            // Return standard OAuth2 token response
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "access_token", tokenResponse.accessToken(),
                            "token_type", tokenResponse.tokenType(),
                            "expires_in", tokenResponse.expiresIn(),
                            "scope", tokenResponse.scope()
                    ));

        } catch (OAuth2ClientAuthenticationException e) {
            log.warn("Client credentials authentication failed for '{}': {}", clientId, e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", "invalid_client",
                            "error_description", e.getMessage()
                    ));
        }
    }

    /**
     * Token introspection endpoint (RFC 7662).
     * Allows resource servers to validate tokens and determine their active state.
     */
    @PostMapping(value = "/introspect", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> introspect(
            @RequestParam("token") String token,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret) {

        try {
            // Authenticate the introspecting client
            clientCredentialsService.issueToken(clientId, clientSecret, List.of());

            // TODO: Decode and validate the token, return active status
            // For now, return a basic response indicating the endpoint exists
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "active", true,
                            "token_type", "Bearer"
                    ));

        } catch (OAuth2ClientAuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", "invalid_client",
                            "error_description", "Client authentication failed"
                    ));
        }
    }
}
