package com.interview_platform_backend.interview_platform_backend.sso.service;

import com.interview_platform_backend.interview_platform_backend.sso.dto.SsoDiscoveryResponse;
import com.interview_platform_backend.interview_platform_backend.sso.entity.SsoConfiguration;
import com.interview_platform_backend.interview_platform_backend.sso.entity.TenantDomain;
import com.interview_platform_backend.interview_platform_backend.sso.repository.SsoConfigurationRepository;
import com.interview_platform_backend.interview_platform_backend.sso.repository.TenantDomainRepository;
import com.interview_platform_backend.interview_platform_backend.tenant.entity.Organization;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.OrganizationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Discovers the appropriate SSO identity provider based on the user's email domain.
 *
 * Flow:
 * 1. Extract domain from email (e.g., "user@acme.com" → "acme.com")
 * 2. Look up domain in tenant_domains table → get tenant_id
 * 3. Look up enabled SSO configurations for that tenant
 * 4. Return the login URL(s) for the frontend to redirect to
 */
@Service
@Transactional(readOnly = true)
public class SsoDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(SsoDiscoveryService.class);

    private final TenantDomainRepository tenantDomainRepository;
    private final SsoConfigurationRepository ssoConfigurationRepository;
    private final OrganizationRepository organizationRepository;

    @Value("${app.sso.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.sso.keycloak.enabled:true}")
    private boolean keycloakEnabled;

    public SsoDiscoveryService(TenantDomainRepository tenantDomainRepository,
                               SsoConfigurationRepository ssoConfigurationRepository,
                               OrganizationRepository organizationRepository) {
        this.tenantDomainRepository = tenantDomainRepository;
        this.ssoConfigurationRepository = ssoConfigurationRepository;
        this.organizationRepository = organizationRepository;
    }

    /**
     * Discover SSO provider(s) for a given email address.
     *
     * @param email The user's email address
     * @return Discovery response indicating whether SSO is available and how to initiate it
     */
    public SsoDiscoveryResponse discover(String email) {
        if (email == null || !email.contains("@")) {
            return noSsoResponse();
        }

        String domain = email.substring(email.indexOf("@") + 1).toLowerCase().trim();
        log.debug("SSO discovery for domain: {}", domain);

        // Step 1: Look up the domain → tenant mapping
        Optional<TenantDomain> tenantDomain = tenantDomainRepository.findByDomain(domain);

        if (tenantDomain.isEmpty()) {
            log.debug("No tenant mapping found for domain: {}", domain);
            return noSsoResponse();
        }

        TenantDomain mapping = tenantDomain.get();

        if (!mapping.getVerified()) {
            log.debug("Domain {} is mapped but not verified", domain);
            return noSsoResponse();
        }

        // Step 2: Look up enabled SSO configurations for this tenant
        List<SsoConfiguration> configs = ssoConfigurationRepository.findByTenantId(mapping.getTenantId())
                .stream()
                .filter(SsoConfiguration::getEnabled)
                .toList();

        if (configs.isEmpty()) {
            log.debug("No enabled SSO configurations for tenant: {}", mapping.getTenantId());
            return noSsoResponse();
        }

        // Step 3: Build the response
        List<SsoDiscoveryResponse.SsoProvider> providers = configs.stream()
                .map(config -> SsoDiscoveryResponse.SsoProvider.builder()
                        .providerType(config.getProviderType().name())
                        .providerName(config.getDisplayName())
                        .loginUrl(buildLoginUrl(config))
                        .build())
                .toList();

        // Use the first enabled provider as the primary
        SsoConfiguration primary = configs.get(0);

        return SsoDiscoveryResponse.builder()
                .ssoEnabled(true)
                .providerType(primary.getProviderType().name())
                .providerName(primary.getDisplayName())
                .ssoLoginUrl(buildLoginUrl(primary))
                .tenantId(mapping.getTenantId().toString())
                .providers(providers)
                .build();
    }

    private String buildLoginUrl(SsoConfiguration config) {
        // OIDC providers use /oauth2/authorization/{provider}
        // SAML providers use /saml2/authenticate/{registrationId}
        return switch (config.getProviderType()) {
            case OKTA -> baseUrl + "/oauth2/authorization/okta";
            case KEYCLOAK -> baseUrl + "/oauth2/authorization/keycloak";
            case ONELOGIN, AZURE_AD, GENERIC_SAML ->
                    baseUrl + "/saml2/authenticate/" + config.getRegistrationId();
        };
    }

    private SsoDiscoveryResponse noSsoResponse() {
        return SsoDiscoveryResponse.builder()
                .ssoEnabled(false)
                .build();
    }

    /**
     * Discover SSO provider(s) by organization slug (subdomain-based detection).
     * e.g., "acme" from acme.interview-platform.com
     *
     * @param slug The organization slug/subdomain
     * @return Discovery response with SSO login URL(s)
     */
    public SsoDiscoveryResponse discoverBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return noSsoResponse();
        }

        log.debug("SSO discovery for org slug: {}", slug);

        Optional<Organization> organization = organizationRepository.findBySlug(slug.toLowerCase().trim());
        if (organization.isEmpty()) {
            log.debug("No organization found for slug: {}", slug);
            return noSsoResponse();
        }

        UUID tenantId = organization.get().getId();
        return discoverByTenantId(tenantId);
    }

    /**
     * Shared lookup: find enabled SSO configurations for a tenant ID.
     */
    private SsoDiscoveryResponse discoverByTenantId(UUID tenantId) {
        List<SsoConfiguration> configs = ssoConfigurationRepository.findByTenantId(tenantId)
                .stream()
                .filter(SsoConfiguration::getEnabled)
                .toList();

        if (configs.isEmpty()) {
            log.debug("No enabled SSO configurations for tenant: {}", tenantId);
            return noSsoResponse();
        }

        List<SsoDiscoveryResponse.SsoProvider> providers = configs.stream()
                .map(config -> SsoDiscoveryResponse.SsoProvider.builder()
                        .providerType(config.getProviderType().name())
                        .providerName(config.getDisplayName())
                        .loginUrl(buildLoginUrl(config))
                        .build())
                .toList();

        SsoConfiguration primary = configs.get(0);

        return SsoDiscoveryResponse.builder()
                .ssoEnabled(true)
                .providerType(primary.getProviderType().name())
                .providerName(primary.getDisplayName())
                .ssoLoginUrl(buildLoginUrl(primary))
                .tenantId(tenantId.toString())
                .providers(providers)
                .build();
    }
}
