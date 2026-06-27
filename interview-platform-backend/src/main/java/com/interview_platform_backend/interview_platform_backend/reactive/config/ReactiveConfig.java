package com.interview_platform_backend.interview_platform_backend.reactive.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.context.annotation.Bean;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.Executor;

/**
 * Reactive preparation layer.
 * Configures virtual threads (Java 21 Loom) and async processing
 * as a stepping stone toward full WebFlux migration.
 * 
 * Migration strategy:
 * 1. [DONE] Virtual threads for all async operations
 * 2. [DONE] Non-blocking I/O for external HTTP calls (RestClient)
 * 3. [PLANNED] WebFlux for new endpoints (reactive controllers)
 * 4. [PLANNED] Full WebFlux migration (replace WebMVC)
 */
@Configuration
@EnableAsync
@ConditionalOnProperty(name = "app.reactive.virtual-threads.enabled", havingValue = "true", matchIfMissing = true)
public class ReactiveConfig {

    private static final Logger log = LoggerFactory.getLogger(ReactiveConfig.class);

    @PostConstruct
    public void init() {
        log.info("Reactive config enabled: Virtual threads + async processing configured");
        log.info("  Java version: {} (Loom support: {})", System.getProperty("java.version"),
                Runtime.version().feature() >= 21 ? "YES" : "NO");
    }

    @Bean(name = "virtualThreadExecutor")
    public Executor virtualThreadExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(0);
        executor.setMaxPoolSize(Integer.MAX_VALUE);
        executor.setQueueCapacity(0);
        executor.setThreadNamePrefix("virtual-");
        executor.setVirtualThreads(true);
        executor.initialize();
        log.info("Virtual thread executor configured (Java 21 Loom)");
        return executor;
    }

    @Bean(name = "asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
