package com.interview_platform_backend.interview_platform_backend.soc2.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "soc2_evidence")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Soc2Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID controlId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceType evidenceType;

    @Column(nullable = false)
    private String title;

    private String description;

    private String fileUrl;

    @Column(nullable = false)
    private Instant collectedAt;

    @Column(nullable = false)
    private String collectedBy;

    private Instant validUntil;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (collectedAt == null) {
            collectedAt = Instant.now();
        }
    }

    public enum EvidenceType {
        SCREENSHOT, LOG_EXPORT, CONFIG_SNAPSHOT, POLICY_DOC, TEST_RESULT, INTERVIEW_RECORD
    }
}
