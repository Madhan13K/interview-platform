package com.interview_platform_backend.interview_platform_backend.emaildigest.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_digests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailDigest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DigestType digestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DigestStatus status = DigestStatus.PENDING;

    private int itemCount;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Instant scheduledFor;

    private Instant sentAt;

    public enum DigestType {
        DAILY, WEEKLY
    }

    public enum DigestStatus {
        PENDING, SENT, FAILED
    }

    @PrePersist
    protected void onCreate() {
        if (scheduledFor == null) {
            scheduledFor = Instant.now();
        }
    }
}
