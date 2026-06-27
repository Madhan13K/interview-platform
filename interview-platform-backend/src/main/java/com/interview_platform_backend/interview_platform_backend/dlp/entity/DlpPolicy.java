package com.interview_platform_backend.interview_platform_backend.dlp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dlp_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DlpPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(name = "data_pattern", nullable = false)
    private String dataPattern;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 25)
    private DataType dataType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private DlpAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Severity severity;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "match_count")
    @Builder.Default
    private long matchCount = 0;

    @Column(name = "last_triggered")
    private Instant lastTriggered;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum DataType {
        PII, PHI, PCI, CREDENTIALS, INTELLECTUAL_PROPERTY, CUSTOM
    }

    public enum DlpAction {
        ALERT, BLOCK, REDACT, ENCRYPT, LOG_ONLY
    }

    public enum Severity {
        CRITICAL, HIGH, MEDIUM, LOW
    }
}
