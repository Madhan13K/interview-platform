package com.interview_platform_backend.interview_platform_backend.graphqlfederation.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
@ConditionalOnProperty(name = "app.graphql.federation.enabled", havingValue = "true", matchIfMissing = false)
public class GraphQLFederationConfig {
    private static final Logger log = LoggerFactory.getLogger(GraphQLFederationConfig.class);

    @Value("${app.graphql.federation.service-name:interview-platform}")
    private String serviceName;

    @Value("${app.graphql.federation.gateway-url:http://localhost:4000}")
    private String gatewayUrl;

    @PostConstruct
    public void init() {
        log.info("GraphQL Federation enabled: service={}, gateway={}", serviceName, gatewayUrl);
    }

    public String getServiceName() { return serviceName; }
    public String getGatewayUrl() { return gatewayUrl; }
}
