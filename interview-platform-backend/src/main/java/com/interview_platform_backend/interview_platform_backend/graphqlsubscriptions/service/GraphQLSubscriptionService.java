package com.interview_platform_backend.interview_platform_backend.graphqlsubscriptions.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GraphQLSubscriptionService {

    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, Set<String>> topicSubscribers = new ConcurrentHashMap<>();

    public GraphQLSubscriptionService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(String topic, Object payload) {
        log.info("Publishing to topic: {} with payload type: {}", topic, payload.getClass().getSimpleName());
        messagingTemplate.convertAndSend("/topic/" + topic, payload);

        // Track topic activity
        topicSubscribers.putIfAbsent(topic, ConcurrentHashMap.newKeySet());
    }

    public void subscribe(String topic, String subscriberId) {
        log.info("Subscriber {} subscribing to topic: {}", subscriberId, topic);
        topicSubscribers.computeIfAbsent(topic, k -> ConcurrentHashMap.newKeySet()).add(subscriberId);
    }

    public void unsubscribe(String topic, String subscriberId) {
        log.info("Subscriber {} unsubscribing from topic: {}", subscriberId, topic);
        Set<String> subscribers = topicSubscribers.get(topic);
        if (subscribers != null) {
            subscribers.remove(subscriberId);
            if (subscribers.isEmpty()) {
                topicSubscribers.remove(topic);
            }
        }
    }

    public Map<String, Object> getActiveSubscriptions() {
        Map<String, Object> active = new LinkedHashMap<>();
        active.put("totalTopics", topicSubscribers.size());
        int totalSubscribers = topicSubscribers.values().stream().mapToInt(Set::size).sum();
        active.put("totalSubscribers", totalSubscribers);

        Map<String, Integer> topicDetails = new LinkedHashMap<>();
        topicSubscribers.forEach((topic, subscribers) -> topicDetails.put(topic, subscribers.size()));
        active.put("topics", topicDetails);

        return active;
    }

    public Set<String> getTopics() {
        return Collections.unmodifiableSet(topicSubscribers.keySet());
    }
}
