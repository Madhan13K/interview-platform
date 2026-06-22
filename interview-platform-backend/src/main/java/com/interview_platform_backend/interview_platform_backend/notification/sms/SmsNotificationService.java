package com.interview_platform_backend.interview_platform_backend.notification.sms;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Real SMS Notification Service with Twilio SDK integration.
 * Sends actual SMS messages for interview reminders and notifications.
 * 
 * Config:
 * - app.sms.enabled=true
 * - app.sms.provider=twilio
 * - app.twilio.account-sid
 * - app.twilio.auth-token
 * - app.twilio.from-number
 */
@Service
public class SmsNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SmsNotificationService.class);

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.sms.provider:log}")
    private String smsProvider;

    @Value("${app.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.twilio.from-number:}")
    private String twilioFromNumber;

    private boolean twilioInitialized = false;

    @PostConstruct
    public void init() {
        if (smsEnabled && "twilio".equalsIgnoreCase(smsProvider) 
                && twilioAccountSid != null && !twilioAccountSid.isBlank()
                && twilioAuthToken != null && !twilioAuthToken.isBlank()) {
            try {
                Twilio.init(twilioAccountSid, twilioAuthToken);
                twilioInitialized = true;
                log.info("Twilio SDK initialized successfully (from: {})", twilioFromNumber);
            } catch (Exception e) {
                log.error("Failed to initialize Twilio SDK: {}", e.getMessage());
            }
        }
    }

    @Async
    public void sendSms(String phoneNumber, String message) {
        if (!smsEnabled) {
            log.debug("SMS disabled. Would send to={}, message={}", phoneNumber, message);
            return;
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.warn("Cannot send SMS: phone number is empty");
            return;
        }

        switch (smsProvider.toLowerCase()) {
            case "twilio" -> sendViaTwilio(phoneNumber, message);
            case "sns" -> sendViaSns(phoneNumber, message);
            default -> log.info("SMS (log provider): to={}, message={}", phoneNumber, message);
        }
    }

    private void sendViaTwilio(String phoneNumber, String message) {
        if (!twilioInitialized) {
            log.warn("Twilio not initialized. Logging SMS instead. to={}", phoneNumber);
            log.info("SMS (twilio-fallback): to={}, message={}", phoneNumber, message);
            return;
        }

        try {
            Message twilioMessage = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioFromNumber),
                    message
            ).create();

            log.info("Twilio SMS sent successfully: sid={}, to={}, status={}",
                    twilioMessage.getSid(), phoneNumber, twilioMessage.getStatus());

        } catch (Exception e) {
            log.error("Twilio SMS failed: to={}, error={}", phoneNumber, e.getMessage());
            // Don't rethrow - SMS failure shouldn't break the calling workflow
        }
    }

    private void sendViaSns(String phoneNumber, String message) {
        // AWS SNS integration placeholder
        // In production, use SnsClient.publish()
        log.info("AWS SNS SMS (stub): to={}, message={}", phoneNumber, message);
    }
}
