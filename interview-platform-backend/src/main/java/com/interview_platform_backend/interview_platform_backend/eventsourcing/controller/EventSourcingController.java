package com.interview_platform_backend.interview_platform_backend.eventsourcing.controller;

import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.DomainEvent;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.EventSnapshot;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.service.EventReplayService;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.service.EventStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventSourcingController {

    private final EventStoreService eventStoreService;
    private final EventReplayService eventReplayService;

    @GetMapping("/{aggregateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DomainEvent>> getEventsForAggregate(@PathVariable UUID aggregateId) {
        List<DomainEvent> events = eventStoreService.getEvents(aggregateId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{aggregateId}/replay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DomainEvent>> replayAggregate(@PathVariable UUID aggregateId) {
        List<DomainEvent> events = eventReplayService.replayAggregate(aggregateId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{aggregateId}/snapshot")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventSnapshot> getLatestSnapshot(@PathVariable UUID aggregateId) {
        return eventStoreService.getLatestSnapshot(aggregateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{aggregateId}/snapshot")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventSnapshot> createSnapshot(@PathVariable UUID aggregateId,
                                                         @RequestParam String aggregateType) {
        List<DomainEvent> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        long latestVersion = events.get(events.size() - 1).getVersion();
        EventSnapshot snapshot = eventStoreService.createSnapshot(
                aggregateId, aggregateType, events, latestVersion);
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/type/{eventType}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DomainEvent>> getEventsByType(
            @PathVariable String eventType,
            @RequestParam Instant since) {
        List<DomainEvent> events = eventReplayService.getEventsByType(eventType, since);
        return ResponseEntity.ok(events);
    }
}
