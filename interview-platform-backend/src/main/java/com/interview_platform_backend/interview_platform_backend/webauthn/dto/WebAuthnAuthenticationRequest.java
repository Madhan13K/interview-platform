package com.interview_platform_backend.interview_platform_backend.webauthn;

import lombok.Data;

@Data
public class WebAuthnAuthenticationRequest {
    private String credentialId;
    private String authenticatorData;
    private String clientDataJSON;
    private String signature;
    private String userHandle;
}
