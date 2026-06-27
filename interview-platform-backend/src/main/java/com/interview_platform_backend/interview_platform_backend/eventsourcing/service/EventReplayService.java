package com.interview_platform_backend.interview_platform_backend.eventsourcing.service;

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
public class EventReplayService {

    private static final Logger log = LoggerFactory.getLogger(EventReplayService.class);

    private final DomainEventRepository domainEventRepository;
    private final EventSnapshotRepository eventSnapshotRepository;

    @Transactional(readOnly = true)
    public List<DomainEvent> replayAggregate(UUID aggregateId) {
        List<DomainEvent> events = domainEventRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
        log.info("Replaying full aggregate [{}] with {} events", aggregateId, events.size());
        return events;
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> replayFromSnapshot(UUID aggregateId) {
        Optional<EventSnapshot> snapshot = eventSnapshotRepository
                .findTopByAggregateIdOrderByVersionDesc(aggregateId);

        if (snapshot.isPresent()) {
            long snapshotVersion = snapshot.get().getVersion();
            List<DomainEvent> events = domainEventRepository
                    .findByAggregateIdAndVersionGreaterThan(aggregateId, snapshotVersion);
            log.info("Replaying aggregate [{}] from snapshot version [{}] with {} subsequent events",
                    aggregateId, snapshotVersion, events.size());
            return events;
        }

        log.info("No snapshot found for aggregate [{}], replaying from beginning", aggregateId);
        return domainEventRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> getAggregateStateAt(UUID aggregateId, Instant pointInTime) {
        List<DomainEvent> allEvents = domainEventRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
        List<DomainEvent> eventsUpToPoint = allEvents.stream()
                .filter(event -> !event.getOccurredAt().isAfter(pointInTime))
                .toList();
        log.info("Temporal query for aggregate [{}] at [{}]: {} of {} events",
                aggregateId, pointInTime, eventsUpToPoint.size(), allEvents.size());
        return eventsUpToPoint;
    }

    @Transactional(readOnly = true)
    public List<DomainEvent> getEventsByType(String eventType, Instant since) {
        List<DomainEvent> events = domainEventRepository.findByEventTypeAndOccurredAtAfter(eventType, since);
        log.info("Found {} events of type [{}] since [{}]", events.size(), eventType, since);
        return events;
    }
}
