package com.interview_platform_backend.interview_platform_backend.security.mtls;

/**
 * Exception thrown when identity cannot be extracted from a client certificate
 * or when the certificate fails validation against configured policies.
 */
public class CertificateIdentityException extends RuntimeException {

    public CertificateIdentityException(String message) {
        super(message);
    }

    public CertificateIdentityException(String message, Throwable cause) {
        super(message, cause);
    }
}
