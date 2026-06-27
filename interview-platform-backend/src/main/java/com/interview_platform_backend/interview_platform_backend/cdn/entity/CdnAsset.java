package com.interview_platform_backend.interview_platform_backend.cdn.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cdn_assets")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CdnAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "asset_key", nullable = false, unique = true)
    private String assetKey;

    @Column(name = "original_url", nullable = false)
    private String originalUrl;

    @Column(name = "cdn_url")
    private String cdnUrl;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes")
    private long sizeBytes;

    @Column(name = "checksum")
    private String checksum;

    @Column(name = "cache_control")
    @Builder.Default
    private String cacheControl = "public, max-age=31536000";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "last_accessed")
    private Instant lastAccessed;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public enum Status {
        PENDING, CACHED, INVALIDATED, ERROR
    }
}
