package com.interview_platform_backend.interview_platform_backend.eventsourcing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.DomainEvent;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.EventSnapshot;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.repository.DomainEventRepository;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.repository.EventSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventStoreService {

    private static final Logger log = LoggerFactory.getLogger(EventStoreService.class);

    private final DomainEventRepository domainEventRepository;
    private final EventSnapshotRepository eventSnapshotRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public DomainEvent append(UUID aggregateId, String aggregateType, String eventType,
                              Object eventData, UUID userId, UUID orgId) {
        long currentVersion = domainEventRepository.countByAggregateId(aggregateId);
        long nextVersion = currentVersion + 1;

        String serializedData = serialize(eventData);

        DomainEvent event = DomainEvent.builder()
                .aggregateId(aggregateId)
                .aggregateType(aggregateType)
                .eventType(eventType)
                .eventData(serializedData)
                .version(nextVersion)
                .occurredAt(Instant.now())
                .userId(userId)
                .organizationId(orgId)
                .build();

        DomainEvent saved = domainEventRepository.save(event);
        log.info("Appended event [{}] for aggregate [{}] at version [{}]. Total events: {}",
                eventType, aggregateId, nextVersion, nextVersion);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> getEvents(UUID aggregateId) {
        List<DomainEvent> events = domainEventRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
        log.debug("Retrieved {} events for aggregate [{}]", events.size(), aggregateId);
        return events;
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> getEventsSince(UUID aggregateId, long version) {
        return domainEventRepository.findByAggregateIdAndVersionGreaterThan(aggregateId, version);
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> replay(UUID aggregateId) {
        List<DomainEvent> events = domainEventRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
        log.info("Replaying {} events for aggregate [{}]", events.size(), aggregateId);
        return events;
    }

    @Transactional
    public EventSnapshot createSnapshot(UUID aggregateId, String aggregateType,
                                         Object snapshotData, long version) {
        String serializedData = serialize(snapshotData);

        EventSnapshot snapshot = EventSnapshot.builder()
                .aggregateId(aggregateId)
                .aggregateType(aggregateType)
                .snapshotData(serializedData)
                .version(version)
                .createdAt(Instant.now())
                .build();

        EventSnapshot saved = eventSnapshotRepository.save(snapshot);
        log.info("Created snapshot for aggregate [{}] at version [{}]", aggregateId, version);
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<EventSnapshot> getLatestSnapshot(UUID aggregateId) {
        return eventSnapshotRepository.findTopByAggregateIdOrderByVersionDesc(aggregateId);
    }

    private String serialize(Object data) {
        if (data instanceof String) {
            return (String) data;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event data: {}", e.getMessage());
            throw new RuntimeException("Failed to serialize event data", e);
        }
    }
}
