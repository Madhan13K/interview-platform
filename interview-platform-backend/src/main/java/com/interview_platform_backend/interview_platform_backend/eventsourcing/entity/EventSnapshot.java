package com.interview_platform_backend.interview_platform_backend.eventsourcing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID aggregateId;

    @Column(nullable = false)
    private String aggregateType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String snapshotData;

    @Column(nullable = false)
    private long version;

    @Column(nullable = false)
    private Instant createdAt;
}
