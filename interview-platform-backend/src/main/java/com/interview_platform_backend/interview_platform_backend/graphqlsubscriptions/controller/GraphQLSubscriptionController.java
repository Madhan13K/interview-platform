package com.interview_platform_backend.interview_platform_backend.graphqlsubscriptions.controller;

import com.interview_platform_backend.interview_platform_backend.graphqlsubscriptions.service.GraphQLSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/v1/graphql-subscriptions")
@RequiredArgsConstructor
public class GraphQLSubscriptionController {

    private final GraphQLSubscriptionService graphQLSubscriptionService;

    @PostMapping("/publish")
    public ResponseEntity<Map<String, String>> publish(@RequestBody Map<String, Object> request) {
        String topic = (String) request.get("topic");
        Object payload = request.get("payload");
        log.info("POST /api/v1/graphql-subscriptions/publish topic={}", topic);
        graphQLSubscriptionService.publish(topic, payload);
        return ResponseEntity.ok(Map.of("status", "published", "topic", topic));
    }

    @GetMapping("/topics")
    public ResponseEntity<Set<String>> getTopics() {
        log.info("GET /api/v1/graphql-subscriptions/topics");
        return ResponseEntity.ok(graphQLSubscriptionService.getTopics());
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveSubscriptions() {
        log.info("GET /api/v1/graphql-subscriptions/active");
        return ResponseEntity.ok(graphQLSubscriptionService.getActiveSubscriptions());
    }
}
