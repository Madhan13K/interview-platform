package com.interview_platform_backend.interview_platform_backend.referralgamification.service;

import com.interview_platform_backend.interview_platform_backend.referralgamification.entity.ReferralLeaderboard;
import com.interview_platform_backend.interview_platform_backend.referralgamification.entity.ReferralLeaderboard.Level;
import com.interview_platform_backend.interview_platform_backend.referralgamification.repository.ReferralLeaderboardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReferralGamificationService {

    private static final Logger log = LoggerFactory.getLogger(ReferralGamificationService.class);

    private final ReferralLeaderboardRepository leaderboardRepository;

    @Transactional
    public ReferralLeaderboard awardPoints(UUID userId, String action, int points) {
        log.info("Awarding {} points to user [{}] for action [{}]", points, userId, action);

        ReferralLeaderboard entry = leaderboardRepository.findByUserId(userId)
                .orElseGet(() -> ReferralLeaderboard.builder()
                        .userId(userId)
                        .organizationId(userId) // placeholder - should be resolved from user context
                        .updatedAt(Instant.now())
                        .build());

        entry.setPoints(entry.getPoints() + points);
        entry.setLevel(calculateLevel(entry.getPoints()));
        entry.setLastReferralAt(Instant.now());

        if ("REFERRAL".equals(action)) {
            entry.setTotalReferrals(entry.getTotalReferrals() + 1);
            entry.setCurrentStreak(entry.getCurrentStreak() + 1);
            if (entry.getCurrentStreak() > entry.getLongestStreak()) {
                entry.setLongestStreak(entry.getCurrentStreak());
            }
        } else if ("SUCCESSFUL_HIRE".equals(action)) {
            entry.setSuccessfulHires(entry.getSuccessfulHires() + 1);
        }

        ReferralLeaderboard saved = leaderboardRepository.save(entry);
        log.info("User [{}] now has {} points at level [{}]", userId, saved.getPoints(), saved.getLevel());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ReferralLeaderboard> getLeaderboard(UUID orgId, int limit) {
        log.debug("Fetching leaderboard for organization [{}], limit: {}", orgId, limit);
        return leaderboardRepository.findByOrganizationIdOrderByPointsDesc(orgId, PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public String getBadges(UUID userId) {
        log.debug("Fetching badges for user [{}]", userId);
        return leaderboardRepository.findByUserId(userId)
                .map(ReferralLeaderboard::getBadges)
                .orElse("[]");
    }

    public Level calculateLevel(int points) {
        if (points >= 10000) return Level.DIAMOND;
        if (points >= 5000) return Level.PLATINUM;
        if (points >= 2000) return Level.GOLD;
        if (points >= 500) return Level.SILVER;
        return Level.BRONZE;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStreak(UUID userId) {
        log.debug("Fetching streak for user [{}]", userId);
        ReferralLeaderboard entry = leaderboardRepository.findByUserId(userId)
                .orElse(null);
        if (entry == null) {
            return Map.of("currentStreak", 0, "longestStreak", 0);
        }
        return Map.of(
                "currentStreak", entry.getCurrentStreak(),
                "longestStreak", entry.getLongestStreak(),
                "lastReferralAt", entry.getLastReferralAt() != null ? entry.getLastReferralAt().toString() : ""
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> shareToSocial(UUID referralId, String platform) {
        log.info("Sharing referral [{}] to platform [{}]", referralId, platform);
        String shareUrl = String.format("https://platform.example.com/referral/%s?utm_source=%s",
                referralId, platform);
        return Map.of(
                "referralId", referralId,
                "platform", platform,
                "shareUrl", shareUrl,
                "status", "SHARED"
        );
    }
}
