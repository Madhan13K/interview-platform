package com.interview_platform_backend.interview_platform_backend.security.mtls;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for mTLS (Mutual TLS) authentication.
 *
 * <p>These properties control how client certificates are validated and
 * how identity is extracted from them for authorization decisions.
 */
@Configuration
@ConfigurationProperties(prefix = "app.mtls")
public class MtlsProperties {

    private boolean enabled = false;

    /**
     * How to extract identity from the client certificate.
     * Options: CN, SAN_DNS, SAN_EMAIL, SERIAL
     */
    private IdentityExtraction identityExtraction = IdentityExtraction.CN;

    /**
     * Regex patterns for allowed Common Names in client certificates.
     * If empty, any CN signed by a trusted CA is accepted.
     */
    private List<String> allowedCnPatterns = new ArrayList<>();

    /**
     * Allowed Organization (O) values in client certificate subject.
     */
    private List<String> allowedOrganizations = new ArrayList<>();

    /**
     * Enable CRL (Certificate Revocation List) checking.
     */
    private boolean crlEnabled = false;

    /**
     * URL to download the CRL from.
     */
    private String crlUrl;

    /**
     * Enable OCSP (Online Certificate Status Protocol) checking.
     */
    private boolean ocspEnabled = false;

    /**
     * Certificate-to-role mapping configuration.
     */
    private CertificateRoleMapping certificateRoleMapping = new CertificateRoleMapping();

    /**
     * Endpoints that bypass mTLS client certificate requirement.
     */
    private List<String> publicEndpoints = new ArrayList<>();

    // --- Getters and Setters ---

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public IdentityExtraction getIdentityExtraction() {
        return identityExtraction;
    }

    public void setIdentityExtraction(IdentityExtraction identityExtraction) {
        this.identityExtraction = identityExtraction;
    }

    public List<String> getAllowedCnPatterns() {
        return allowedCnPatterns;
    }

    public void setAllowedCnPatterns(List<String> allowedCnPatterns) {
        this.allowedCnPatterns = allowedCnPatterns;
    }

    public List<String> getAllowedOrganizations() {
        return allowedOrganizations;
    }

    public void setAllowedOrganizations(List<String> allowedOrganizations) {
        this.allowedOrganizations = allowedOrganizations;
    }

    public boolean isCrlEnabled() {
        return crlEnabled;
    }

    public void setCrlEnabled(boolean crlEnabled) {
        this.crlEnabled = crlEnabled;
    }

    public String getCrlUrl() {
        return crlUrl;
    }

    public void setCrlUrl(String crlUrl) {
        this.crlUrl = crlUrl;
    }

    public boolean isOcspEnabled() {
        return ocspEnabled;
    }

    public void setOcspEnabled(boolean ocspEnabled) {
        this.ocspEnabled = ocspEnabled;
    }

    public CertificateRoleMapping getCertificateRoleMapping() {
        return certificateRoleMapping;
    }

    public void setCertificateRoleMapping(CertificateRoleMapping certificateRoleMapping) {
        this.certificateRoleMapping = certificateRoleMapping;
    }

    public List<String> getPublicEndpoints() {
        return publicEndpoints;
    }

    public void setPublicEndpoints(List<String> publicEndpoints) {
        this.publicEndpoints = publicEndpoints;
    }

    // --- Enums ---

    public enum IdentityExtraction {
        /** Extract identity from the Common Name (CN) field */
        CN,
        /** Extract identity from Subject Alternative Name (DNS type) */
        SAN_DNS,
        /** Extract identity from Subject Alternative Name (Email type) */
        SAN_EMAIL,
        /** Use the certificate serial number as identity */
        SERIAL
    }

    // --- Nested classes ---

    public static class CertificateRoleMapping {
        private boolean enabled = false;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
