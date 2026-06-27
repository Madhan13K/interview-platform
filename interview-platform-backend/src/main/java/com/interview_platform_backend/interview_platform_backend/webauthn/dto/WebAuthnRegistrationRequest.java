package com.interview_platform_backend.interview_platform_backend.webauthn;

import lombok.Data;

@Data
public class WebAuthnRegistrationRequest {
    private String credentialName;
    private String authenticatorType; // "platform" or "cross-platform"
}
