package com.interview_platform_backend.interview_platform_backend.dlp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dlp_incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DlpIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "policy_id", nullable = false)
    private UUID policyId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String action;

    @Column
    private String endpoint;

    @Column(name = "data_type", length = 25)
    private String dataType;

    @Column(name = "matched_content", length = 100)
    private String matchedContent;

    @Column(name = "action_taken", length = 50)
    private String actionTaken;

    @Column(nullable = false)
    private boolean blocked;

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
