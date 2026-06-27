package com.interview_platform_backend.interview_platform_backend.webauthn;

import lombok.Data;

@Data
public class WebAuthnRegistrationFinishRequest {
    private String credentialId;
    private String publicKey;
    private String attestationObject;
    private String clientDataJSON;
    private String credentialName;
    private String authenticatorType;
    private String transports; // JSON array
    private long signCount;
}
