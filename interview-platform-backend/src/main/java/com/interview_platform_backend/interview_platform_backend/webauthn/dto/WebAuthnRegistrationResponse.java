package com.interview_platform_backend.interview_platform_backend.webauthn;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data @Builder
public class WebAuthnRegistrationResponse {
    private String challenge;
    private Map<String, Object> rp; // relying party {id, name}
    private Map<String, Object> user; // {id, name, displayName}
    private String attestation; // "none", "indirect", "direct"
    private Object[] pubKeyCredParams;
    private long timeout;
    private Object authenticatorSelection;
}
