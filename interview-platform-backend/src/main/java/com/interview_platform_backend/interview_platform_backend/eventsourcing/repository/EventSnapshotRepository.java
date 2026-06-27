package com.interview_platform_backend.interview_platform_backend.eventsourcing.repository;

import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.EventSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventSnapshotRepository extends JpaRepository<EventSnapshot, UUID> {

    Optional<EventSnapshot> findTopByAggregateIdOrderByVersionDesc(UUID aggregateId);
}
