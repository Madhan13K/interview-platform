package com.interview_platform_backend.interview_platform_backend.security.oauth2;

/**
 * Exception thrown when OAuth2 client authentication fails.
 * This includes invalid client_id, invalid client_secret, or disabled clients.
 */
public class OAuth2ClientAuthenticationException extends RuntimeException {

    public OAuth2ClientAuthenticationException(String message) {
        super(message);
    }

    public OAuth2ClientAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
