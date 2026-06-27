package com.interview_platform_backend.interview_platform_backend.security.mtls;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.security.auth.x500.X500Principal;
import java.security.cert.X509Certificate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts identity information from X.509 client certificates.
 *
 * <p>Supports multiple extraction strategies:
 * <ul>
 *   <li>CN (Common Name) - Most common for service identities</li>
 *   <li>SAN_DNS - Subject Alternative Name (DNS type) - Modern best practice</li>
 *   <li>SAN_EMAIL - Subject Alternative Name (Email type) - For user certificates</li>
 *   <li>SERIAL - Certificate serial number - For tracking/auditing</li>
 * </ul>
 */
@Component
public class CertificateIdentityExtractor {

    private static final Logger log = LoggerFactory.getLogger(CertificateIdentityExtractor.class);
    private static final Pattern CN_PATTERN = Pattern.compile("CN=([^,]+)");
    private static final Pattern OU_PATTERN = Pattern.compile("OU=([^,]+)");
    private static final Pattern O_PATTERN = Pattern.compile("O=([^,]+)");

    // SAN type constants (from RFC 5280)
    private static final int SAN_TYPE_EMAIL = 1;
    private static final int SAN_TYPE_DNS = 2;
    private static final int SAN_TYPE_URI = 6;

    private final MtlsProperties mtlsProperties;

    public CertificateIdentityExtractor(MtlsProperties mtlsProperties) {
        this.mtlsProperties = mtlsProperties;
    }

    /**
     * Extracts the principal identity from the client certificate based on configured strategy.
     *
     * @param certificate the X.509 client certificate
     * @return the extracted identity string
     */
    public String extractIdentity(X509Certificate certificate) {
        if (certificate == null) {
            throw new IllegalArgumentException("Certificate must not be null");
        }

        return switch (mtlsProperties.getIdentityExtraction()) {
            case CN -> extractCommonName(certificate)
                    .orElseThrow(() -> new CertificateIdentityException(
                            "No CN found in certificate subject: " + certificate.getSubjectX500Principal()));
            case SAN_DNS -> extractSanByType(certificate, SAN_TYPE_DNS)
                    .orElseThrow(() -> new CertificateIdentityException(
                            "No DNS SAN found in certificate: " + certificate.getSubjectX500Principal()));
            case SAN_EMAIL -> extractSanByType(certificate, SAN_TYPE_EMAIL)
                    .orElseThrow(() -> new CertificateIdentityException(
                            "No Email SAN found in certificate: " + certificate.getSubjectX500Principal()));
            case SERIAL -> certificate.getSerialNumber().toString(16);
        };
    }

    /**
     * Extracts the Common Name (CN) from the certificate subject DN.
     */
    public Optional<String> extractCommonName(X509Certificate certificate) {
        String dn = certificate.getSubjectX500Principal().getName(X500Principal.RFC2253);
        Matcher matcher = CN_PATTERN.matcher(dn);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).trim());
        }
        return Optional.empty();
    }

    /**
     * Extracts the Organizational Unit (OU) from the certificate subject DN.
     */
    public Optional<String> extractOrganizationalUnit(X509Certificate certificate) {
        String dn = certificate.getSubjectX500Principal().getName(X500Principal.RFC2253);
        Matcher matcher = OU_PATTERN.matcher(dn);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).trim());
        }
        return Optional.empty();
    }

    /**
     * Extracts the Organization (O) from the certificate subject DN.
     */
    public Optional<String> extractOrganization(X509Certificate certificate) {
        String dn = certificate.getSubjectX500Principal().getName(X500Principal.RFC2253);
        Matcher matcher = O_PATTERN.matcher(dn);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).trim());
        }
        return Optional.empty();
    }

    /**
     * Extracts a Subject Alternative Name (SAN) of the specified type.
     *
     * @param certificate the X.509 certificate
     * @param sanType SAN type (1=email, 2=DNS, 6=URI)
     * @return the first matching SAN value
     */
    public Optional<String> extractSanByType(X509Certificate certificate, int sanType) {
        try {
            Collection<List<?>> sans = certificate.getSubjectAlternativeNames();
            if (sans == null) {
                return Optional.empty();
            }

            for (List<?> san : sans) {
                if (san.size() >= 2 && Integer.valueOf(sanType).equals(san.get(0))) {
                    String value = san.get(1).toString();
                    if (!value.isBlank()) {
                        return Optional.of(value);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract SAN type {} from certificate: {}", sanType, e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Extracts all SANs of a given type from the certificate.
     */
    public List<String> extractAllSansByType(X509Certificate certificate, int sanType) {
        try {
            Collection<List<?>> sans = certificate.getSubjectAlternativeNames();
            if (sans == null) {
                return List.of();
            }

            return sans.stream()
                    .filter(san -> san.size() >= 2 && Integer.valueOf(sanType).equals(san.get(0)))
                    .map(san -> san.get(1).toString())
                    .filter(value -> !value.isBlank())
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to extract SANs of type {} from certificate: {}", sanType, e.getMessage());
            return List.of();
        }
    }

    /**
     * Gets a human-readable summary of the certificate for logging/auditing.
     */
    public String getCertificateSummary(X509Certificate certificate) {
        return String.format(
                "Subject=[%s], Issuer=[%s], Serial=[%s], NotBefore=[%s], NotAfter=[%s]",
                certificate.getSubjectX500Principal().getName(X500Principal.RFC2253),
                certificate.getIssuerX500Principal().getName(X500Principal.RFC2253),
                certificate.getSerialNumber().toString(16),
                certificate.getNotBefore(),
                certificate.getNotAfter()
        );
    }
}
