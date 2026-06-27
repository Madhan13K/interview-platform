package com.interview_platform_backend.interview_platform_backend.sso.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response returned by the SSO discovery endpoint.
 * Tells the frontend which authentication method to use for a given email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SsoDiscoveryResponse {

    /**
     * Whether SSO is configured for this email domain.
     * If true, the frontend should redirect to the ssoLoginUrl.
     * If false, show the standard email/password form.
     */
    private boolean ssoEnabled;

    /**
     * The identity provider type (e.g., OKTA, KEYCLOAK, AZURE_AD, GENERIC_SAML)
     */
    private String providerType;

    /**
     * Human-readable name of the identity provider (e.g., "Acme Corp SSO")
     */
    private String providerName;

    /**
     * The URL to redirect the user to for SSO login.
     * For OIDC: /oauth2/authorization/{provider}
     * For SAML: /saml2/authenticate/{registrationId}
     */
    private String ssoLoginUrl;

    /**
     * The tenant ID associated with this domain.
     */
    private String tenantId;

    /**
     * If multiple SSO providers are configured, list all options.
     */
    private List<SsoProvider> providers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SsoProvider {
        private String providerType;
        private String providerName;
        private String loginUrl;
    }
}
