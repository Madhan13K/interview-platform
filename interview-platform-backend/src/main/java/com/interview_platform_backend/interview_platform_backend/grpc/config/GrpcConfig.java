package com.interview_platform_backend.interview_platform_backend.grpc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
@ConditionalOnProperty(name = "app.grpc.enabled", havingValue = "true")
public class GrpcConfig {
    private static final Logger log = LoggerFactory.getLogger(GrpcConfig.class);

    @Value("${app.grpc.server.port:9090}")
    private int serverPort;

    @Value("${app.grpc.server.max-message-size-mb:4}")
    private int maxMessageSizeMb;

    @Value("${app.grpc.client.deadline-ms:5000}")
    private long clientDeadlineMs;

    @Value("${app.grpc.tls.enabled:true}")
    private boolean tlsEnabled;

    @PostConstruct
    public void init() {
        log.info("gRPC config: port={}, maxMsg={}MB, deadline={}ms, TLS={}", serverPort, maxMessageSizeMb, clientDeadlineMs, tlsEnabled);
    }

    public int getServerPort() { return serverPort; }
    public int getMaxMessageSizeMb() { return maxMessageSizeMb; }
    public long getClientDeadlineMs() { return clientDeadlineMs; }
    public boolean isTlsEnabled() { return tlsEnabled; }
}
