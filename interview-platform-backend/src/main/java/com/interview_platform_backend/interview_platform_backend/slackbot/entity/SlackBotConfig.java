package com.interview_platform_backend.interview_platform_backend.slackbot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "slack_bot_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlackBotConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    @Column(nullable = false)
    private String botToken;

    @Column(nullable = false)
    private String signingSecret;

    private String channelId;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(columnDefinition = "TEXT")
    private String commands;

    private UUID installedBy;

    @Column(nullable = false)
    @Builder.Default
    private Instant installedAt = Instant.now();

    public enum Platform {
        SLACK,
        TEAMS
    }
}
