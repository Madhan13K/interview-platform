package com.interview_platform_backend.interview_platform_backend.notification.bus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.notification.EmailNotificationService;
import com.interview_platform_backend.interview_platform_backend.notification.service.InAppNotificationService;
import com.interview_platform_backend.interview_platform_backend.notification.sms.SmsNotificationService;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * Unified notification bus consumer.
 * Routes each notification event to the appropriate channel(s).
 *
 * This replaces the old pattern of separate Kafka topics per channel.
 * Single topic, single consumer group, multi-channel routing.
 */
@Service
public class NotificationBusConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationBusConsumer.class);

    private final ObjectMapper objectMapper;
    private final EmailNotificationService emailService;
    private final SmsNotificationService smsService;
    private final InAppNotificationService inAppService;

    public NotificationBusConsumer(ObjectMapper objectMapper,
                                   EmailNotificationService emailService,
                                   SmsNotificationService smsService,
                                   InAppNotificationService inAppService) {
        this.objectMapper = objectMapper;
        this.emailService = emailService;
        this.smsService = smsService;
        this.inAppService = inAppService;
    }

    @KafkaListener(topics = "notification-bus", groupId = "notification-bus-consumer")
    @WithSpan("notification-bus-process")
    public void consume(String message) {
        try {
            NotificationEvent event = objectMapper.readValue(message, NotificationEvent.class);
            log.debug("Processing notification: type={}, channels={}, to={}",
                    event.getEventType(), event.getChannels(), event.getRecipientEmail());

            for (NotificationEvent.Channel channel : event.getChannels()) {
                try {
                    routeToChannel(channel, event);
                } catch (Exception e) {
                    log.error("Failed to deliver via {}: {}", channel, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to process notification bus message: {}", e.getMessage());
        }
    }

    private void routeToChannel(NotificationEvent.Channel channel, NotificationEvent event) {
        switch (channel) {
            case EMAIL -> {
                if (event.getRecipientEmail() != null) {
                    String subject = event.getSubject() != null ? event.getSubject() : event.getTitle();
                    emailService.sendEmail(event.getRecipientEmail(), subject, event.getBody());
                }
            }
            case SMS -> {
                if (event.getRecipientPhone() != null) {
                    String smsBody = event.getShortBody() != null ? event.getShortBody() :
                            (event.getBody() != null && event.getBody().length() > 160 ?
                                    event.getBody().substring(0, 157) + "..." : event.getBody());
                    smsService.sendSms(event.getRecipientPhone(), smsBody);
                }
            }
            case IN_APP -> {
                if (event.getRecipientUserId() != null) {
                    inAppService.notify(
                            event.getRecipientUserId(),
                            event.getEventType(),
                            event.getTitle(),
                            event.getBody(),
                            event.getReferenceId(),
                            event.getReferenceType()
                    );
                }
            }
            case PUSH -> {
                log.debug("PUSH notification for {}: {} (FCM integration pending)",
                        event.getRecipientUserId(), event.getTitle());
                // FirebasePushService would be called here when enabled
            }
            case SLACK -> {
                log.debug("SLACK notification: {} (Slack webhook pending)", event.getTitle());
            }
            case TEAMS -> {
                log.debug("TEAMS notification: {} (Teams webhook pending)", event.getTitle());
            }
        }
    }
}
