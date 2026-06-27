package com.interview_platform_backend.interview_platform_backend.user.entity;

/**
 * Tracks how the user account was created / primary authentication method.
 */
public enum AuthProvider {
    LOCAL,      // Registered with email + password
    GOOGLE,     // Created via Google OAuth2
    GITHUB,     // Created via GitHub OAuth2
    MICROSOFT,  // Created via Microsoft OAuth2
    OKTA,       // Created via Okta OIDC (primary SSO)
    KEYCLOAK,   // Created via Keycloak OIDC (SSO fallback)
    SAML        // Created via SAML/SSO (Okta, OneLogin, Azure AD SAML)
}

