package com.interview_platform_backend.interview_platform_backend.eventsourcing.repository;

import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.DomainEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DomainEventRepository extends JpaRepository<DomainEvent, UUID> {

    List<DomainEvent> findByAggregateIdOrderByVersionAsc(UUID aggregateId);

    List<DomainEvent> findByAggregateIdAndVersionGreaterThan(UUID aggregateId, long version);

    List<DomainEvent> findByAggregateTypeAndOccurredAtBetween(String type, Instant from, Instant to);

    List<DomainEvent> findByEventTypeAndOccurredAtAfter(String eventType, Instant since);

    long countByAggregateId(UUID aggregateId);
}
