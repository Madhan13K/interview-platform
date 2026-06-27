package com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "org_hierarchy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgHierarchy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_org_id")
    private UUID parentOrgId;

    @Column(name = "child_org_id", nullable = false)
    private UUID childOrgId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrgRelationshipType relationship;

    @Column(name = "shared_templates", nullable = false)
    @Builder.Default
    private boolean sharedTemplates = true;

    @Column(name = "shared_question_bank", nullable = false)
    @Builder.Default
    private boolean sharedQuestionBank = true;

    @Column(name = "consolidated_reporting", nullable = false)
    @Builder.Default
    private boolean consolidatedReporting = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum OrgRelationshipType {
        PARENT, FRANCHISE, SUBSIDIARY, DIVISION
    }
}
