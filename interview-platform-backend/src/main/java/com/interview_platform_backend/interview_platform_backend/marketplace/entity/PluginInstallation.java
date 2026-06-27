package com.interview_platform_backend.interview_platform_backend.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plugin_installations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plugin_id", "organization_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PluginInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plugin_id", nullable = false)
    private UUID pluginId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "installed_by", nullable = false)
    private UUID installedBy;

    @Column(name = "configuration", columnDefinition = "TEXT")
    private String configuration;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "installed_at")
    private Instant installedAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @PrePersist
    void onCreate() {
        installedAt = Instant.now();
    }
}
