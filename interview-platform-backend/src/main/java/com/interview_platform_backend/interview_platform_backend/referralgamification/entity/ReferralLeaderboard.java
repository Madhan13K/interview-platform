package com.interview_platform_backend.interview_platform_backend.referralgamification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "referral_leaderboard", indexes = {
        @Index(name = "idx_referral_leaderboard_user", columnList = "userId"),
        @Index(name = "idx_referral_leaderboard_org", columnList = "organizationId"),
        @Index(name = "idx_referral_leaderboard_points", columnList = "points")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferralLeaderboard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    @Builder.Default
    private int totalReferrals = 0;

    @Column(nullable = false)
    @Builder.Default
    private int successfulHires = 0;

    @Column(nullable = false)
    @Builder.Default
    private int points = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Level level = Level.BRONZE;

    @Column(columnDefinition = "TEXT")
    private String badges;

    @Column(nullable = false)
    @Builder.Default
    private int currentStreak = 0;

    @Column(nullable = false)
    @Builder.Default
    private int longestStreak = 0;

    private Instant lastReferralAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum Level {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM,
        DIAMOND
    }
}
