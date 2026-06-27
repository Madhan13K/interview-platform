package com.interview_platform_backend.interview_platform_backend.talentcommunity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "talent_community_members", indexes = {
        @Index(name = "idx_talent_member_email", columnList = "email", unique = true),
        @Index(name = "idx_talent_member_source", columnList = "source"),
        @Index(name = "idx_talent_member_engagement", columnList = "engagementScore")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TalentCommunityMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(columnDefinition = "TEXT")
    private String interests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;

    @Column(nullable = false)
    @Builder.Default
    private boolean subscribed = true;

    @Column(nullable = false)
    @Builder.Default
    private double engagementScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private int eventsAttended = 0;

    @Column(nullable = false)
    @Builder.Default
    private int newslettersOpened = 0;

    @Column(nullable = false)
    @Builder.Default
    private int preApplications = 0;

    @Column(nullable = false)
    private Instant joinedAt;

    private Instant lastActiveAt;

    @PrePersist
    protected void onCreate() {
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
    }

    public enum Source {
        WEBSITE,
        REFERRAL,
        EVENT,
        SOCIAL_MEDIA
    }
}
