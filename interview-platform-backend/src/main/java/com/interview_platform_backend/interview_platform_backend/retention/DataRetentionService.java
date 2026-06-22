package com.interview_platform_backend.interview_platform_backend.retention;

import com.interview_platform_backend.interview_platform_backend.audit.entity.AuditLog;
import com.interview_platform_backend.interview_platform_backend.audit.repository.AuditLogRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Data Retention Policy Service.
 * Configurable auto-purge of old data based on retention periods.
 * Runs on a schedule with distributed locking via ShedLock.
 */
@Service
public class DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.retention.candidate-data-days:730}")
    private int candidateDataRetentionDays; // Default 2 years

    @Value("${app.retention.audit-log-days:365}")
    private int auditLogRetentionDays; // Default 1 year

    @Value("${app.retention.notification-days:90}")
    private int notificationRetentionDays; // Default 90 days

    @Value("${app.retention.activity-days:180}")
    private int activityRetentionDays; // Default 6 months

    @Value("${app.retention.enabled:false}")
    private boolean retentionEnabled;

    /**
     * Scheduled job to purge expired data.
     * Runs daily at 2:00 AM with distributed lock (max 1 hour).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @SchedulerLock(name = "DataRetentionService_purgeExpiredData", lockAtMostFor = "PT1H", lockAtLeastFor = "PT5M")
    @Transactional
    public void purgeExpiredData() {
        if (!retentionEnabled) {
            log.debug("Data retention is disabled. Skipping purge.");
            return;
        }

        log.info("Starting data retention purge...");

        int notificationsDeleted = purgeOldNotifications();
        int activitiesDeleted = purgeOldActivities();
        int auditLogsDeleted = purgeOldAuditLogs();
        int candidateDataDeleted = purgeOldCandidateData();

        log.info("Data retention purge complete. Deleted: {} notifications, {} activities, {} audit logs, {} candidate records",
                notificationsDeleted, activitiesDeleted, auditLogsDeleted, candidateDataDeleted);
    }

    private int purgeOldNotifications() {
        Instant cutoff = Instant.now().minus(notificationRetentionDays, ChronoUnit.DAYS);
        int deleted = entityManager.createQuery(
                "DELETE FROM Notification n WHERE n.createdAt < :cutoff AND n.isRead = true")
                .setParameter("cutoff", cutoff)
                .executeUpdate();
        log.info("Purged {} old read notifications (older than {} days)", deleted, notificationRetentionDays);
        return deleted;
    }

    private int purgeOldActivities() {
        Instant cutoff = Instant.now().minus(activityRetentionDays, ChronoUnit.DAYS);
        int deleted = entityManager.createQuery(
                "DELETE FROM ActivityEvent a WHERE a.createdAt < :cutoff")
                .setParameter("cutoff", cutoff)
                .executeUpdate();
        log.info("Purged {} old activity events (older than {} days)", deleted, activityRetentionDays);
        return deleted;
    }

    private int purgeOldAuditLogs() {
        Instant cutoff = Instant.now().minus(auditLogRetentionDays, ChronoUnit.DAYS);
        int deleted = entityManager.createQuery(
                "DELETE FROM AuditLog a WHERE a.timestamp < :cutoff")
                .setParameter("cutoff", cutoff)
                .executeUpdate();
        log.info("Purged {} old audit logs (older than {} days)", deleted, auditLogRetentionDays);
        return deleted;
    }

    private int purgeOldCandidateData() {
        Instant cutoff = Instant.now().minus(candidateDataRetentionDays, ChronoUnit.DAYS);
        // Only purge candidates who have no active interviews and haven't been hired
        int deleted = entityManager.createQuery(
                "DELETE FROM User u WHERE u.createdAt < :cutoff AND u.status = 'INACTIVE' " +
                "AND NOT EXISTS (SELECT i FROM Interview i WHERE i.candidate = u AND i.status IN ('SCHEDULED', 'IN_PROGRESS'))")
                .setParameter("cutoff", cutoff)
                .executeUpdate();
        log.info("Purged {} inactive candidate records (older than {} days)", deleted, candidateDataRetentionDays);
        return deleted;
    }
}
