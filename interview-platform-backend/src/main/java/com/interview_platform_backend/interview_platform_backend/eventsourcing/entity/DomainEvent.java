package com.interview_platform_backend.interview_platform_backend.eventsourcing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "domain_events", indexes = {
        @Index(name = "idx_domain_events_aggregate_id", columnList = "aggregateId"),
        @Index(name = "idx_domain_events_event_type", columnList = "eventType"),
        @Index(name = "idx_domain_events_occurred_at", columnList = "occurredAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DomainEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID aggregateId;

    @Column(nullable = false)
    private String aggregateType;

    @Column(nullable = false)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String eventData;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false)
    private long version;

    @Column(nullable = false)
    private Instant occurredAt;

    private UUID userId;

    private UUID organizationId;
}
