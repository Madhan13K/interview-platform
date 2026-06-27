package com.interview_platform_backend.interview_platform_backend.internalmobility.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "internal_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalApplication {

    public enum ManagerApproval {
        PENDING, APPROVED, DENIED
    }

    public enum Status {
        APPLIED, INTERVIEWING, OFFERED, ACCEPTED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID postingId;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private String currentRole;

    @Builder.Default
    private int yearsInRole = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ManagerApproval managerApproval = ManagerApproval.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.APPLIED;

    private Instant appliedAt;

    @PrePersist
    protected void onCreate() {
        if (appliedAt == null) {
            appliedAt = Instant.now();
        }
    }
}
