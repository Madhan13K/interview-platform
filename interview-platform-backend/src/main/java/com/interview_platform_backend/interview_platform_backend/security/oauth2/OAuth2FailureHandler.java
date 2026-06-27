package com.interview_platform_backend.interview_platform_backend.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Handles OAuth2/OIDC login failures.
 * 
 * Strategy: On any provider failure, redirect back to the frontend login page
 * with error details so the user can choose another authentication method.
 */
@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2FailureHandler.class);

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        String requestUri = request.getRequestURI();
        String failedProvider = extractProviderFromUri(requestUri);

        log.warn("OAuth2 authentication failed for provider '{}': {}", failedProvider, exception.getMessage());

        // Redirect back to frontend login page with error info
        // User can then choose another auth method (Keycloak, Google, GitHub, email/password)
        String errorMessage = buildUserFriendlyMessage(failedProvider, exception.getMessage());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                .queryParam("error", URLEncoder.encode(errorMessage, StandardCharsets.UTF_8))
                .queryParam("failedProvider", failedProvider)
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String buildUserFriendlyMessage(String provider, String technicalError) {
        String providerName = switch (provider) {
            case "okta" -> "Okta";
            case "keycloak" -> "Keycloak";
            case "google" -> "Google";
            case "github" -> "GitHub";
            case "microsoft" -> "Microsoft";
            default -> provider;
        };

        if (technicalError != null && technicalError.contains("timed out")) {
            return providerName + " login timed out. Please try another sign-in method.";
        }
        if (technicalError != null && technicalError.contains("invalid_client")) {
            return providerName + " configuration error. Please try another sign-in method.";
        }
        if (technicalError != null && technicalError.contains("access_denied")) {
            return "Access denied by " + providerName + ". Please try another sign-in method.";
        }

        return providerName + " login failed. Please try another sign-in method.";
    }

    private String extractProviderFromUri(String uri) {
        if (uri == null) return "unknown";
        String[] parts = uri.split("/");
        return parts.length > 0 ? parts[parts.length - 1] : "unknown";
    }
}

