package com.interview_platform_backend.interview_platform_backend.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_schemas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantSchema {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false, unique = true)
    private UUID organizationId;

    @Column(name = "schema_name", nullable = false, unique = true, length = 100)
    private String schemaName;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "migrated_at")
    private Instant migratedAt;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}
