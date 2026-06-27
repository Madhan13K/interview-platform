package com.interview_platform_backend.interview_platform_backend.sso.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Maps email domains to tenants for SSO discovery.
 * When a user enters their email, the domain is looked up to determine
 * which identity provider to redirect them to.
 */
@Entity
@Table(name = "tenant_domains", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"domain"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 255)
    private String domain;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    @Column(name = "primary_domain", nullable = false)
    @Builder.Default
    private Boolean primaryDomain = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
