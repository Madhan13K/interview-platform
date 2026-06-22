package com.interview_platform_backend.interview_platform_backend.ipwhitelist.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ip_whitelist", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"organization_id", "ip_address"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class IpWhitelistEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress; // Supports CIDR notation (e.g., 192.168.1.0/24)

    @Column(name = "description")
    private String description;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (isActive == null) isActive = true;
    }
}
