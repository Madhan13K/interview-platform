package com.interview_platform_backend.interview_platform_backend.essync.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Consolidated Elasticsearch sync service.
 * Replaces dual-write pattern with single event-driven sync.
 * Consumes domain events and projects to ES indexes.
 */
@Service
@ConditionalOnProperty(name = "app.elasticsearch.sync.enabled", havingValue = "true", matchIfMissing = false)
public class ElasticsearchSyncService {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchSyncService.class);

    @Value("${app.elasticsearch.url:http://localhost:9200}")
    private String esUrl;

    @Value("${app.elasticsearch.sync.batch-size:100}")
    private int batchSize;

    @Value("${app.elasticsearch.sync.interval-ms:5000}")
    private long syncIntervalMs;

    private final RestClient restClient = RestClient.create();
    private final AtomicLong syncedDocuments = new AtomicLong(0);
    private final AtomicLong failedDocuments = new AtomicLong(0);
    private final Queue<Map<String, Object>> pendingQueue = new java.util.concurrent.ConcurrentLinkedQueue<>();

    public void queueForSync(String index, String id, Map<String, Object> document) {
        pendingQueue.add(Map.of("_index", index, "_id", id, "_source", document, "_timestamp", Instant.now().toString()));
        log.debug("Queued document for ES sync: {}/{}", index, id);
    }

    @Scheduled(fixedDelayString = "${app.elasticsearch.sync.interval-ms:5000}")
    public void processSyncQueue() {
        if (pendingQueue.isEmpty()) return;

        List<Map<String, Object>> batch = new ArrayList<>();
        for (int i = 0; i < batchSize && !pendingQueue.isEmpty(); i++) {
            batch.add(pendingQueue.poll());
        }

        if (batch.isEmpty()) return;

        try {
            StringBuilder bulkBody = new StringBuilder();
            for (Map<String, Object> doc : batch) {
                String index = (String) doc.get("_index");
                String id = (String) doc.get("_id");
                bulkBody.append("{\"index\":{\"_index\":\"").append(index).append("\",\"_id\":\"").append(id).append("\"}}\n");
                bulkBody.append(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(doc.get("_source"))).append("\n");
            }

            restClient.post()
                    .uri(esUrl + "/_bulk")
                    .header("Content-Type", "application/x-ndjson")
                    .body(bulkBody.toString())
                    .retrieve().body(Map.class);

            syncedDocuments.addAndGet(batch.size());
            log.info("ES sync batch completed: {} documents (total synced: {})", batch.size(), syncedDocuments.get());
        } catch (Exception e) {
            failedDocuments.addAndGet(batch.size());
            pendingQueue.addAll(batch); // Re-queue failed items
            log.error("ES sync batch failed (re-queued {} docs): {}", batch.size(), e.getMessage());
        }
    }

    public Map<String, Object> getSyncStats() {
        return Map.of(
                "pendingCount", pendingQueue.size(),
                "syncedTotal", syncedDocuments.get(),
                "failedTotal", failedDocuments.get(),
                "batchSize", batchSize,
                "syncIntervalMs", syncIntervalMs,
                "esUrl", esUrl
        );
    }

    public void reindexAll(String index) {
        log.info("Full reindex requested for index: {}", index);
        // Trigger full reindex from database - would query all entities and queue them
    }
}
