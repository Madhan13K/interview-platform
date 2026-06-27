package com.interview_platform_backend.interview_platform_backend.microserviceextraction.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.*;

@Configuration
@ConditionalOnProperty(name = "app.microservices.extraction.enabled", havingValue = "true")
public class ServiceBoundaryConfig {
    private static final Logger log = LoggerFactory.getLogger(ServiceBoundaryConfig.class);

    public static final Map<String, List<String>> SERVICE_BOUNDARIES = Map.of(
        "ai-service", List.of("ai", "aiscoring", "aicoach", "aicopilot", "aisummarizer", "aijobdescription", "resumeranking", "interviewcoaching", "videoanalysis", "livetranscription"),
        "notification-service", List.of("notification", "notificationbus", "notificationpreferences", "emaildigest", "smartemail", "pushnotification"),
        "code-execution-service", List.of("codeexecution", "testcases", "plagiarism", "multilangassessment"),
        "scheduling-service", List.of("scheduling", "selfservice", "calendar", "calendarsync", "reminder", "aischeduling", "smartschedulingv2", "autoschedulingv2", "availabilityforecasting"),
        "analytics-service", List.of("analytics", "report", "reportbuilder", "predictive", "interviewintelligence", "calibration", "engagementscoring", "dei")
    );

    @PostConstruct
    public void init() {
        log.info("Microservice extraction boundaries defined: {} services, {} total modules",
                SERVICE_BOUNDARIES.size(), SERVICE_BOUNDARIES.values().stream().mapToInt(List::size).sum());
        SERVICE_BOUNDARIES.forEach((svc, modules) -> log.info("  {} -> {} modules", svc, modules.size()));
    }

    public Map<String, List<String>> getBoundaries() { return SERVICE_BOUNDARIES; }
}
