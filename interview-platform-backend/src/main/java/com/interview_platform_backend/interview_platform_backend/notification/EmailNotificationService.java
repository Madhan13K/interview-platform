package com.interview_platform_backend.interview_platform_backend.notification;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final String EMAIL_DLQ_TOPIC = "email-dead-letter-queue";

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Value("${spring.mail.username:noreply@interview-platform.com}")
    private String configuredUsername;

    @Value("${app.mail.from:#{null}}")
    private String mailFrom;

    @Value("${app.notifications.enabled:true}")
    private boolean notificationsEnabled;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public EmailNotificationService(JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
    }

    @Async
    @Retryable(
            retryFor = {MailException.class, Exception.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2.0, maxDelay = 10000)
    )
    @CircuitBreaker(name = "emailService", fallbackMethod = "sendEmailFallback")
    public void sendEmail(String to, String subject, String body) {
        if (!notificationsEnabled) {
            log.info("Email notifications disabled. Would send to={}, subject={}", to, subject);
            return;
        }

        try {
            String fromEmail = resolveFromEmail();
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (MailException e) {
            log.error("Failed to send email to {} (will retry): {}", to, e.getMessage());
            throw e;
        }
    }

    @Async
    public void sendEmailToMultiple(List<String> recipients, String subject, String body) {
        for (String recipient : recipients) {
            sendEmail(recipient, subject, body);
        }
    }

    /**
     * Resolves the "from" email address. Priority:
     * 1. app.mail.from (explicit override)
     * 2. spring.mail.username (if not empty)
     * 3. Hardcoded fallback
     */
    private String resolveFromEmail() {
        if (mailFrom != null && !mailFrom.isBlank()) {
            return mailFrom;
        }
        if (configuredUsername != null && !configuredUsername.isBlank()) {
            return configuredUsername;
        }
        return "noreply@interview-platform.com";
    }

    @Recover
    private void sendEmailFallback(MailException ex, String to, String subject, String body) {
        log.error("All retry attempts exhausted for email to={}. subject={}. Error: {}",
                to, subject, ex.getMessage());
        pushToDeadLetterQueue(to, subject, body, ex.getMessage());
    }

    private void sendEmailFallback(String to, String subject, String body, Throwable throwable) {
        log.warn("Circuit breaker open for email service. Failed to send email to={}, subject={}. Cause: {}",
                to, subject, throwable.getMessage());
        pushToDeadLetterQueue(to, subject, body, throwable.getMessage());
    }

    /**
     * Pushes failed email to a Kafka dead letter queue for manual retry or alerting.
     * If Kafka is unavailable, logs the failure for monitoring systems to pick up.
     */
    private void pushToDeadLetterQueue(String to, String subject, String body, String errorMessage) {
        try {
            Map<String, String> dlqMessage = Map.of(
                    "to", to,
                    "subject", subject,
                    "body", body,
                    "error", errorMessage != null ? errorMessage : "unknown",
                    "failedAt", java.time.Instant.now().toString()
            );
            String payload = objectMapper.writeValueAsString(dlqMessage);

            if (kafkaEnabled && kafkaTemplate != null) {
                kafkaTemplate.send(EMAIL_DLQ_TOPIC, to, payload);
                log.warn("Email to={} pushed to dead letter queue topic: {}", to, EMAIL_DLQ_TOPIC);
            } else {
                log.error("EMAIL_DLQ: Failed email cannot be queued (Kafka disabled). to={}, subject={}, error={}",
                        to, subject, errorMessage);
            }
        } catch (Exception e) {
            log.error("Failed to push email to dead letter queue. to={}, subject={}, dlqError={}",
                    to, subject, e.getMessage());
        }
    }
}

