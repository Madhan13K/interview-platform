package com.interview_platform_backend.interview_platform_backend.readreplica;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
@ConditionalOnProperty(name = "app.read-replica.enabled", havingValue = "true")
public class ReadReplicaMetrics {

    private static final Logger log = LoggerFactory.getLogger(ReadReplicaMetrics.class);

    private final AtomicLong primaryQueries = new AtomicLong(0);
    private final AtomicLong replicaQueries = new AtomicLong(0);

    public void recordPrimaryQuery() { primaryQueries.incrementAndGet(); }
    public void recordReplicaQuery() { replicaQueries.incrementAndGet(); }

    public long getPrimaryQueryCount() { return primaryQueries.get(); }
    public long getReplicaQueryCount() { return replicaQueries.get(); }

    public double getReplicaPercentage() {
        long total = primaryQueries.get() + replicaQueries.get();
        return total == 0 ? 0 : (double) replicaQueries.get() / total * 100;
    }
}
