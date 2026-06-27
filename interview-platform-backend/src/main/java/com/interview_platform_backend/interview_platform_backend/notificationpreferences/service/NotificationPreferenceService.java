package com.interview_platform_backend.interview_platform_backend.notificationpreferences.service;

import com.interview_platform_backend.interview_platform_backend.notificationpreferences.entity.NotificationPreference;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPreferenceService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public NotificationPreference getPreferences(UUID userId) {
        TypedQuery<NotificationPreference> query = entityManager.createQuery(
                "SELECT p FROM NotificationPreference p WHERE p.userId = :userId",
                NotificationPreference.class);
        query.setParameter("userId", userId);

        return query.getResultStream().findFirst().orElseGet(() -> {
            log.debug("No preferences found for user [{}], returning defaults", userId);
            return NotificationPreference.builder()
                    .userId(userId)
                    .build();
        });
    }

    @Transactional
    public NotificationPreference updatePreferences(UUID userId, NotificationPreference updated) {
        TypedQuery<NotificationPreference> query = entityManager.createQuery(
                "SELECT p FROM NotificationPreference p WHERE p.userId = :userId",
                NotificationPreference.class);
        query.setParameter("userId", userId);

        NotificationPreference existing = query.getResultStream().findFirst().orElse(null);

        if (existing == null) {
            updated.setUserId(userId);
            entityManager.persist(updated);
            log.info("Created notification preferences for user [{}]", userId);
            return updated;
        }

        existing.setEmailEnabled(updated.isEmailEnabled());
        existing.setSmsEnabled(updated.isSmsEnabled());
        existing.setPushEnabled(updated.isPushEnabled());
        existing.setSlackEnabled(updated.isSlackEnabled());
        existing.setInAppEnabled(updated.isInAppEnabled());
        existing.setQuietHoursStart(updated.getQuietHoursStart());
        existing.setQuietHoursEnd(updated.getQuietHoursEnd());
        existing.setDigestFrequency(updated.getDigestFrequency());
        existing.setTimezone(updated.getTimezone());
        existing.setMutedCategories(updated.getMutedCategories());

        log.info("Updated notification preferences for user [{}]", userId);
        return entityManager.merge(existing);
    }

    @Transactional(readOnly = true)
    public boolean shouldSend(UUID userId, String channel, String category) {
        NotificationPreference prefs = getPreferences(userId);

        // Check if channel is enabled
        boolean channelEnabled = switch (channel.toLowerCase()) {
            case "email" -> prefs.isEmailEnabled();
            case "sms" -> prefs.isSmsEnabled();
            case "push" -> prefs.isPushEnabled();
            case "slack" -> prefs.isSlackEnabled();
            case "in_app" -> prefs.isInAppEnabled();
            default -> false;
        };

        if (!channelEnabled) {
            return false;
        }

        // Check muted categories
        if (prefs.getMutedCategories() != null && category != null
                && prefs.getMutedCategories().contains(category)) {
            return false;
        }

        // Check quiet hours
        if (isQuietHours(userId)) {
            log.debug("User [{}] is in quiet hours, suppressing notification", userId);
            return false;
        }

        return true;
    }

    @Transactional(readOnly = true)
    public boolean isQuietHours(UUID userId) {
        NotificationPreference prefs = getPreferences(userId);

        ZoneId zoneId = ZoneId.of(prefs.getTimezone());
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalTime currentTime = now.toLocalTime();

        LocalTime quietStart = LocalTime.parse(prefs.getQuietHoursStart());
        LocalTime quietEnd = LocalTime.parse(prefs.getQuietHoursEnd());

        if (quietStart.isAfter(quietEnd)) {
            // Quiet hours span midnight (e.g., 22:00 - 08:00)
            return currentTime.isAfter(quietStart) || currentTime.isBefore(quietEnd);
        } else {
            return currentTime.isAfter(quietStart) && currentTime.isBefore(quietEnd);
        }
    }
}
