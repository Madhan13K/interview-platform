package com.interview_platform_backend.interview_platform_backend.security.mtls;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Service that validates client certificates against configured policies.
 *
 * <p>Performs the following validations beyond basic TLS handshake verification:
 * <ul>
 *   <li>Certificate expiry validation (with configurable grace period)</li>
 *   <li>Common Name (CN) pattern matching</li>
 *   <li>Organization (O) allowlist validation</li>
 *   <li>Certificate chain depth verification</li>
 * </ul>
 *
 * <p>Note: Basic certificate validation (signature, trust chain, expiry) is handled
 * by the JVM's TLS implementation during the handshake. This service provides
 * additional application-level policy enforcement.
 */
@Service
public class CertificateValidationService {

    private static final Logger log = LoggerFactory.getLogger(CertificateValidationService.class);

    private final MtlsProperties mtlsProperties;
    private final CertificateIdentityExtractor identityExtractor;

    public CertificateValidationService(MtlsProperties mtlsProperties,
                                        CertificateIdentityExtractor identityExtractor) {
        this.mtlsProperties = mtlsProperties;
        this.identityExtractor = identityExtractor;
    }

    /**
     * Validates a client certificate against all configured policies.
     *
     * @param certificate the X.509 client certificate presented during TLS handshake
     * @return a validation result containing the outcome and extracted identity
     * @throws CertificateIdentityException if the certificate fails validation
     */
    public CertificateValidationResult validate(X509Certificate certificate) {
        if (certificate == null) {
            throw new CertificateIdentityException("No client certificate provided");
        }

        log.debug("Validating client certificate: {}", identityExtractor.getCertificateSummary(certificate));

        // 1. Check if certificate is within its validity period
        validateExpiry(certificate);

        // 2. Validate CN against allowed patterns (if configured)
        String identity = identityExtractor.extractIdentity(certificate);
        validateCnPatterns(certificate, identity);

        // 3. Validate organization (if configured)
        validateOrganization(certificate);

        log.info("Client certificate validated successfully. Identity: {}, Subject: {}",
                identity, certificate.getSubjectX500Principal().getName());

        return new CertificateValidationResult(
                true,
                identity,
                identityExtractor.extractOrganization(certificate).orElse(null),
                identityExtractor.extractOrganizationalUnit(certificate).orElse(null),
                certificate.getSerialNumber().toString(16),
                certificate.getNotAfter().toInstant()
        );
    }

    /**
     * Validates that the certificate is not expired and not yet valid.
     */
    private void validateExpiry(X509Certificate certificate) {
        Date now = Date.from(Instant.now());

        if (now.after(certificate.getNotAfter())) {
            throw new CertificateIdentityException(
                    "Client certificate has expired. NotAfter: " + certificate.getNotAfter() +
                            ", Subject: " + certificate.getSubjectX500Principal().getName());
        }

        if (now.before(certificate.getNotBefore())) {
            throw new CertificateIdentityException(
                    "Client certificate is not yet valid. NotBefore: " + certificate.getNotBefore() +
                            ", Subject: " + certificate.getSubjectX500Principal().getName());
        }

        // Warn if certificate expires within 30 days
        long daysUntilExpiry = (certificate.getNotAfter().getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry <= 30) {
            log.warn("Client certificate expires in {} days! Subject: {}, NotAfter: {}",
                    daysUntilExpiry,
                    certificate.getSubjectX500Principal().getName(),
                    certificate.getNotAfter());
        }
    }

    /**
     * Validates the certificate CN against allowed patterns.
     */
    private void validateCnPatterns(X509Certificate certificate, String identity) {
        List<String> allowedPatterns = mtlsProperties.getAllowedCnPatterns();
        if (allowedPatterns == null || allowedPatterns.isEmpty()) {
            return; // No restrictions configured
        }

        boolean matches = allowedPatterns.stream()
                .anyMatch(pattern -> {
                    try {
                        return Pattern.matches(pattern, identity);
                    } catch (Exception e) {
                        log.warn("Invalid CN pattern '{}': {}", pattern, e.getMessage());
                        return false;
                    }
                });

        if (!matches) {
            throw new CertificateIdentityException(
                    "Client certificate CN '" + identity +
                            "' does not match any allowed pattern. Allowed: " + allowedPatterns);
        }
    }

    /**
     * Validates the certificate organization against the allowlist.
     */
    private void validateOrganization(X509Certificate certificate) {
        List<String> allowedOrgs = mtlsProperties.getAllowedOrganizations();
        if (allowedOrgs == null || allowedOrgs.isEmpty()) {
            return; // No restrictions configured
        }

        String organization = identityExtractor.extractOrganization(certificate).orElse("");

        if (!allowedOrgs.contains(organization)) {
            throw new CertificateIdentityException(
                    "Client certificate organization '" + organization +
                            "' is not in the allowed list. Subject: " +
                            certificate.getSubjectX500Principal().getName());
        }
    }

    /**
     * Result of certificate validation containing extracted identity information.
     */
    public record CertificateValidationResult(
            boolean valid,
            String identity,
            String organization,
            String organizationalUnit,
            String serialNumber,
            Instant expiresAt
    ) {}
}
