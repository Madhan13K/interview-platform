package com.interview_platform_backend.interview_platform_backend.security.mtls;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.authentication.WebAuthenticationDetails;

import java.time.Instant;

/**
 * Extended authentication details for mTLS-authenticated requests.
 *
 * <p>Contains additional metadata extracted from the client certificate
 * that can be used for authorization, auditing, and logging.
 */
public class MtlsAuthenticationDetails extends WebAuthenticationDetails {

    private final String certificateIdentity;
    private final String organization;
    private final String organizationalUnit;
    private final String serialNumber;
    private final Instant certificateExpiresAt;

    public MtlsAuthenticationDetails(HttpServletRequest request,
                                     String certificateIdentity,
                                     String organization,
                                     String organizationalUnit,
                                     String serialNumber,
                                     Instant certificateExpiresAt) {
        super(request);
        this.certificateIdentity = certificateIdentity;
        this.organization = organization;
        this.organizationalUnit = organizationalUnit;
        this.serialNumber = serialNumber;
        this.certificateExpiresAt = certificateExpiresAt;
    }

    public String getCertificateIdentity() {
        return certificateIdentity;
    }

    public String getOrganization() {
        return organization;
    }

    public String getOrganizationalUnit() {
        return organizationalUnit;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public Instant getCertificateExpiresAt() {
        return certificateExpiresAt;
    }

    @Override
    public String toString() {
        return "MtlsAuthenticationDetails{" +
                "identity='" + certificateIdentity + '\'' +
                ", org='" + organization + '\'' +
                ", ou='" + organizationalUnit + '\'' +
                ", serial='" + serialNumber + '\'' +
                ", expiresAt=" + certificateExpiresAt +
                ", remoteAddress='" + getRemoteAddress() + '\'' +
                '}';
    }
}
