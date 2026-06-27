package com.interview_platform_backend.interview_platform_backend.emaildigest.service;

import com.interview_platform_backend.interview_platform_backend.emaildigest.entity.EmailDigest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class EmailDigestService {

    @PersistenceContext
    private EntityManager entityManager;

    public EmailDigest generateDigest(UUID userId, String type) {
        log.info("Generating {} digest for user: {}", type, userId);
        EmailDigest.DigestType digestType = EmailDigest.DigestType.valueOf(type.toUpperCase());

        EmailDigest digest = EmailDigest.builder()
                .userId(userId)
                .digestType(digestType)
                .status(EmailDigest.DigestStatus.PENDING)
                .itemCount(0)
                .content("{\"items\": []}")
                .scheduledFor(Instant.now())
                .build();

        entityManager.persist(digest);
        log.info("Generated digest {} for user {}", digest.getId(), userId);
        return digest;
    }

    @Scheduled(cron = "0 0 8 * * *") // Every day at 8 AM
    public void sendPendingDigests() {
        log.info("Processing pending email digests");
        TypedQuery<EmailDigest> query = entityManager.createQuery(
                "SELECT ed FROM EmailDigest ed WHERE ed.status = :status AND ed.scheduledFor <= :now",
                EmailDigest.class);
        query.setParameter("status", EmailDigest.DigestStatus.PENDING);
        query.setParameter("now", Instant.now());

        List<EmailDigest> pendingDigests = query.getResultList();
        log.info("Found {} pending digests to send", pendingDigests.size());

        for (EmailDigest digest : pendingDigests) {
            try {
                // Actual email sending logic would go here
                sendEmail(digest);
                digest.setStatus(EmailDigest.DigestStatus.SENT);
                digest.setSentAt(Instant.now());
                log.info("Successfully sent digest {} to user {}", digest.getId(), digest.getUserId());
            } catch (Exception e) {
                log.error("Failed to send digest {} to user {}: {}", digest.getId(), digest.getUserId(), e.getMessage());
                digest.setStatus(EmailDigest.DigestStatus.FAILED);
            }
            entityManager.merge(digest);
        }
    }

    @Transactional(readOnly = true)
    public List<EmailDigest> getDigestHistory(UUID userId) {
        log.info("Fetching digest history for user: {}", userId);
        TypedQuery<EmailDigest> query = entityManager.createQuery(
                "SELECT ed FROM EmailDigest ed WHERE ed.userId = :userId ORDER BY ed.scheduledFor DESC",
                EmailDigest.class);
        query.setParameter("userId", userId);
        return query.getResultList();
    }

    private void sendEmail(EmailDigest digest) {
        // Placeholder for actual email sending implementation
        log.debug("Sending email digest {} of type {} to user {}", digest.getId(), digest.getDigestType(), digest.getUserId());
    }
}
