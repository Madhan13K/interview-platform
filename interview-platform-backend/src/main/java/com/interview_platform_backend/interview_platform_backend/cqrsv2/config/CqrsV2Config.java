package com.interview_platform_backend.interview_platform_backend.cqrsv2.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.cqrs.v2.enabled", havingValue = "true")
public class CqrsV2Config {
    private static final Logger log = LoggerFactory.getLogger(CqrsV2Config.class);

    @Value("${app.cqrs.v2.event-store:kafka}")
    private String eventStore;

    @Value("${app.cqrs.v2.projection-targets:elasticsearch,redis}")
    private List<String> projectionTargets;

    @Value("${app.cqrs.v2.snapshot-interval:100}")
    private int snapshotInterval;

    @Value("${app.cqrs.v2.replay-batch-size:500}")
    private int replayBatchSize;

    @PostConstruct
    public void init() {
        log.info("CQRS v2 enabled: store={}, projections={}, snapshot every {} events", eventStore, projectionTargets, snapshotInterval);
    }

    public String getEventStore() { return eventStore; }
    public List<String> getProjectionTargets() { return projectionTargets; }
    public int getSnapshotInterval() { return snapshotInterval; }
    public int getReplayBatchSize() { return replayBatchSize; }
}
