package com.interview_platform_backend.interview_platform_backend.pushnotification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Firebase Cloud Messaging (FCM) service for mobile push notifications.
 * Supports Android and iOS via Firebase Admin SDK.
 */
@Service
@ConditionalOnProperty(name = "app.push.firebase.enabled", havingValue = "true")
public class FirebasePushService {

    private static final Logger log = LoggerFactory.getLogger(FirebasePushService.class);

    @Value("${app.push.firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options;
                if (credentialsPath != null && !credentialsPath.isBlank()) {
                    FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();
                } else {
                    // Use default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS env var)
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .build();
                }
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
        }
    }

    /**
     * Send push notification to a single device.
     */
    public String sendToDevice(String fcmToken, String title, String body, Map<String, String> data) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            com.google.firebase.messaging.Message.Builder messageBuilder = com.google.firebase.messaging.Message.builder()
                    .setToken(fcmToken)
                    .setNotification(notification);

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            // Android config
            messageBuilder.setAndroidConfig(AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                            .setClickAction("OPEN_INTERVIEW")
                            .build())
                    .build());

            // iOS config
            messageBuilder.setApnsConfig(ApnsConfig.builder()
                    .setAps(Aps.builder()
                            .setAlert(ApsAlert.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build())
                            .setSound("default")
                            .setBadge(1)
                            .build())
                    .build());

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.info("FCM push sent successfully: {}", response);
            return response;
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send FCM push to token {}: {}", fcmToken, e.getMessage());
            return null;
        }
    }

    /**
     * Send push notification to multiple devices.
     */
    public BatchResponse sendToMultipleDevices(List<String> fcmTokens, String title, String body, Map<String, String> data) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            MulticastMessage.Builder messageBuilder = MulticastMessage.builder()
                    .addAllTokens(fcmTokens)
                    .setNotification(notification);

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(messageBuilder.build());
            log.info("FCM multicast sent. Success: {}, Failure: {}",
                    response.getSuccessCount(), response.getFailureCount());
            return response;
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send FCM multicast: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Send push notification to a topic (e.g., all interviewers).
     */
    public String sendToTopic(String topic, String title, String body, Map<String, String> data) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            com.google.firebase.messaging.Message.Builder messageBuilder = com.google.firebase.messaging.Message.builder()
                    .setTopic(topic)
                    .setNotification(notification);

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.info("FCM topic push sent to '{}': {}", topic, response);
            return response;
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send FCM topic push to '{}': {}", topic, e.getMessage());
            return null;
        }
    }

    /**
     * Subscribe a device to a topic.
     */
    public void subscribeToTopic(List<String> tokens, String topic) {
        try {
            TopicManagementResponse response = FirebaseMessaging.getInstance().subscribeToTopic(tokens, topic);
            log.info("Subscribed {} tokens to topic '{}'. Errors: {}", tokens.size(), topic, response.getFailureCount());
        } catch (FirebaseMessagingException e) {
            log.error("Failed to subscribe to topic '{}': {}", topic, e.getMessage());
        }
    }
}
