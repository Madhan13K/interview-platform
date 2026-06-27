package com.interview_platform_backend.interview_platform_backend.webhookretry.service;

import com.interview_platform_backend.interview_platform_backend.webhookretry.entity.WebhookRetryQueue;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class WebhookRetryService {

    @PersistenceContext
    private EntityManager entityManager;

    public WebhookRetryQueue enqueue(UUID webhookId, String url, String payload) {
        log.info("Enqueuing webhook retry for webhook: {} to URL: {}", webhookId, url);
        WebhookRetryQueue entry = WebhookRetryQueue.builder()
                .webhookId(webhookId)
                .endpointUrl(url)
                .payload(payload)
                .attempt(0)
                .maxAttempts(5)
                .nextRetryAt(Instant.now())
                .status(WebhookRetryQueue.RetryStatus.PENDING)
                .build();
        entityManager.persist(entry);
        return entry;
    }

    @Scheduled(fixedRate = 30000)
    public void processRetries() {
        log.debug("Processing webhook retries");
        TypedQuery<WebhookRetryQueue> query = entityManager.createQuery(
                "SELECT w FROM WebhookRetryQueue w WHERE w.status IN :statuses AND w.nextRetryAt <= :now",
                WebhookRetryQueue.class);
        query.setParameter("statuses", List.of(WebhookRetryQueue.RetryStatus.PENDING, WebhookRetryQueue.RetryStatus.RETRYING));
        query.setParameter("now", Instant.now());

        List<WebhookRetryQueue> entries = query.getResultList();
        log.info("Found {} webhook retries to process", entries.size());

        for (WebhookRetryQueue entry : entries) {
            try {
                entry.setStatus(WebhookRetryQueue.RetryStatus.RETRYING);
                entry.setAttempt(entry.getAttempt() + 1);

                // Attempt delivery (simplified - actual HTTP call would go here)
                boolean delivered = attemptDelivery(entry);

                if (delivered) {
                    entry.setStatus(WebhookRetryQueue.RetryStatus.DELIVERED);
                    entry.setDeliveredAt(Instant.now());
                    log.info("Webhook {} delivered successfully on attempt {}", entry.getId(), entry.getAttempt());
                } else if (entry.getAttempt() >= entry.getMaxAttempts()) {
                    moveToDeadLetter(entry.getId());
                } else {
                    entry.setNextRetryAt(calculateBackoff(entry.getAttempt()));
                    log.info("Webhook {} scheduled for retry at {}", entry.getId(), entry.getNextRetryAt());
                }
                entityManager.merge(entry);
            } catch (Exception e) {
                log.error("Error processing retry for webhook {}: {}", entry.getId(), e.getMessage());
                entry.setLastError(e.getMessage());
                if (entry.getAttempt() >= entry.getMaxAttempts()) {
                    entry.setStatus(WebhookRetryQueue.RetryStatus.DEAD_LETTER);
                } else {
                    entry.setNextRetryAt(calculateBackoff(entry.getAttempt()));
                }
                entityManager.merge(entry);
            }
        }
    }

    public Instant calculateBackoff(int attempt) {
        // Exponential backoff: 2^attempt * 30 seconds (30s, 60s, 120s, 240s, 480s)
        long delaySeconds = (long) Math.pow(2, attempt) * 30;
        return Instant.now().plus(delaySeconds, ChronoUnit.SECONDS);
    }

    public WebhookRetryQueue moveToDeadLetter(UUID id) {
        log.warn("Moving webhook {} to dead letter queue", id);
        WebhookRetryQueue entry = entityManager.find(WebhookRetryQueue.class, id);
        if (entry == null) {
            throw new IllegalArgumentException("Webhook retry entry not found: " + id);
        }
        entry.setStatus(WebhookRetryQueue.RetryStatus.DEAD_LETTER);
        entry.setNextRetryAt(null);
        return entityManager.merge(entry);
    }

    @Transactional(readOnly = true)
    public List<WebhookRetryQueue> getDeadLetterQueue() {
        log.info("Fetching dead letter queue");
        TypedQuery<WebhookRetryQueue> query = entityManager.createQuery(
                "SELECT w FROM WebhookRetryQueue w WHERE w.status = :status ORDER BY w.createdAt DESC",
                WebhookRetryQueue.class);
        query.setParameter("status", WebhookRetryQueue.RetryStatus.DEAD_LETTER);
        return query.getResultList();
    }

    public WebhookRetryQueue replayDeadLetter(UUID id) {
        log.info("Replaying dead letter webhook: {}", id);
        WebhookRetryQueue entry = entityManager.find(WebhookRetryQueue.class, id);
        if (entry == null) {
            throw new IllegalArgumentException("Webhook retry entry not found: " + id);
        }
        if (entry.getStatus() != WebhookRetryQueue.RetryStatus.DEAD_LETTER) {
            throw new IllegalStateException("Only dead letter entries can be replayed");
        }
        entry.setStatus(WebhookRetryQueue.RetryStatus.PENDING);
        entry.setAttempt(0);
        entry.setNextRetryAt(Instant.now());
        entry.setLastError(null);
        return entityManager.merge(entry);
    }

    @Transactional(readOnly = true)
    public List<WebhookRetryQueue> getQueue() {
        TypedQuery<WebhookRetryQueue> query = entityManager.createQuery(
                "SELECT w FROM WebhookRetryQueue w WHERE w.status IN :statuses ORDER BY w.nextRetryAt ASC",
                WebhookRetryQueue.class);
        query.setParameter("statuses", List.of(WebhookRetryQueue.RetryStatus.PENDING, WebhookRetryQueue.RetryStatus.RETRYING));
        return query.getResultList();
    }

    private boolean attemptDelivery(WebhookRetryQueue entry) {
        // Placeholder for actual HTTP delivery logic
        log.debug("Attempting delivery to {} for webhook {}", entry.getEndpointUrl(), entry.getWebhookId());
        return false;
    }
}
