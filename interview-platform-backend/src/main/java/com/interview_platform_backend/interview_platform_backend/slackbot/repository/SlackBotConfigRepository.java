package com.interview_platform_backend.interview_platform_backend.slackbot.repository;

import com.interview_platform_backend.interview_platform_backend.slackbot.entity.SlackBotConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SlackBotConfigRepository extends JpaRepository<SlackBotConfig, UUID> {

    Optional<SlackBotConfig> findByOrganizationIdAndEnabled(UUID organizationId, boolean enabled);

    List<SlackBotConfig> findByOrganizationId(UUID organizationId);

    Optional<SlackBotConfig> findByChannelId(String channelId);
}
