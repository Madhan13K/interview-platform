package com.interview_platform_backend.interview_platform_backend.sso.entity;

/**
 * Supported SSO Identity Provider types.
 * 
 * OKTA and KEYCLOAK use OpenID Connect (OIDC) protocol.
 * ONELOGIN, AZURE_AD, and GENERIC_SAML use SAML 2.0 protocol.
 */
public enum SsoProviderType {
    OKTA,           // Okta via OpenID Connect (primary)
    KEYCLOAK,       // Keycloak via OpenID Connect (fallback)
    ONELOGIN,       // OneLogin via SAML 2.0
    AZURE_AD,       // Azure AD via SAML 2.0
    GENERIC_SAML    // Any SAML 2.0 compliant IdP
}
