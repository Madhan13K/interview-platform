package com.interview_platform_backend.interview_platform_backend.webauthn;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webauthn_credentials", indexes = {
    @Index(name = "idx_webauthn_user_id", columnList = "userId"),
    @Index(name = "idx_webauthn_credential_id", columnList = "credentialId")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String credentialId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    @Column(nullable = false)
    private long signCount;

    @Column(nullable = false)
    private String credentialName; // user-friendly name like "My YubiKey"

    @Column(nullable = false)
    private String authenticatorType; // "platform" (biometric) or "cross-platform" (security key)

    @Column
    private String aaguid; // Authenticator Attestation GUID

    @Column
    private String transports; // JSON array: ["usb", "nfc", "ble", "internal"]

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private Instant createdAt;

    @Column
    private Instant lastUsedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (!enabled) enabled = true;
    }
}
