package com.interview_platform_backend.interview_platform_backend.security.mtls;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Map;

/**
 * REST controller for mTLS certificate verification and diagnostics.
 *
 * <p>Provides endpoints to:
 * <ul>
 *   <li>Verify mTLS authentication is working ({@code /api/v1/mtls/verify})</li>
 *   <li>Get details about the authenticated client certificate ({@code /api/v1/mtls/whoami})</li>
 * </ul>
 *
 * <p>These endpoints are useful for:
 * <ul>
 *   <li>Health checks for mTLS-authenticated services</li>
 *   <li>Debugging certificate issues during development</li>
 *   <li>Service registration/discovery in zero-trust architectures</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/mtls")
@ConditionalOnProperty(name = "app.mtls.enabled", havingValue = "true")
public class MtlsController {

    private static final Logger log = LoggerFactory.getLogger(MtlsController.class);

    private final CertificateIdentityExtractor identityExtractor;

    public MtlsController(CertificateIdentityExtractor identityExtractor) {
        this.identityExtractor = identityExtractor;
    }

    /**
     * Verifies that the client has been authenticated via mTLS.
     * Returns 200 OK if the client certificate is valid and authentication succeeded.
     *
     * <p>Example usage from a service:
     * <pre>
     * curl --cert client.pem --key client-key.pem --cacert ca.pem \
     *      https://api.example.com/api/v1/mtls/verify
     * </pre>
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "authenticated", false,
                            "error", "No valid client certificate"
                    ));
        }

        // Check if authentication was via mTLS
        if (!(auth.getDetails() instanceof MtlsAuthenticationDetails mtlsDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "authenticated", false,
                            "error", "Authentication was not via mTLS"
                    ));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "identity", mtlsDetails.getCertificateIdentity(),
                "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Returns detailed information about the authenticated client certificate.
     * Useful for debugging and service discovery.
     */
    @GetMapping("/whoami")
    public ResponseEntity<Map<String, Object>> whoami() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        if (!(auth.getDetails() instanceof MtlsAuthenticationDetails mtlsDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Not authenticated via mTLS"));
        }

        return ResponseEntity.ok(Map.of(
                "identity", mtlsDetails.getCertificateIdentity(),
                "organization", mtlsDetails.getOrganization() != null ? mtlsDetails.getOrganization() : "",
                "organizationalUnit", mtlsDetails.getOrganizationalUnit() != null ? mtlsDetails.getOrganizationalUnit() : "",
                "serialNumber", mtlsDetails.getSerialNumber(),
                "certificateExpiresAt", mtlsDetails.getCertificateExpiresAt().toString(),
                "remoteAddress", mtlsDetails.getRemoteAddress(),
                "authorities", auth.getAuthorities().stream()
                        .map(Object::toString)
                        .toList()
        ));
    }
}
