package com.interview_platform_backend.interview_platform_backend.eventsourcing;

import com.interview_platform_backend.interview_platform_backend.eventsourcing.entity.DomainEvent;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.repository.DomainEventRepository;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.repository.EventSnapshotRepository;
import com.interview_platform_backend.interview_platform_backend.eventsourcing.service.EventStoreService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Event Store Service Tests")
class EventStoreServiceTest {

    @Mock private DomainEventRepository eventRepository;
    @Mock private EventSnapshotRepository snapshotRepository;
    @InjectMocks private EventStoreService eventStoreService;

    @Test
    @DisplayName("should append event to store")
    void appendEvent() {
        UUID aggregateId = UUID.randomUUID();
        when(eventRepository.countByAggregateId(aggregateId)).thenReturn(0L);
        when(eventRepository.save(any(DomainEvent.class))).thenAnswer(i -> i.getArgument(0));

        DomainEvent event = eventStoreService.append(aggregateId, "Interview", "CREATED", "{}", UUID.randomUUID(), UUID.randomUUID());

        assertThat(event).isNotNull();
        assertThat(event.getAggregateId()).isEqualTo(aggregateId);
        assertThat(event.getEventType()).isEqualTo("CREATED");
        verify(eventRepository).save(any(DomainEvent.class));
    }

    @Test
    @DisplayName("should retrieve events for aggregate")
    void getEvents() {
        UUID aggregateId = UUID.randomUUID();
        List<DomainEvent> events = List.of(
            DomainEvent.builder().aggregateId(aggregateId).eventType("CREATED").version(1).occurredAt(Instant.now()).build(),
            DomainEvent.builder().aggregateId(aggregateId).eventType("UPDATED").version(2).occurredAt(Instant.now()).build()
        );
        when(eventRepository.findByAggregateIdOrderByVersionAsc(aggregateId)).thenReturn(events);

        List<DomainEvent> result = eventStoreService.getEvents(aggregateId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEventType()).isEqualTo("CREATED");
    }

    @Test
    @DisplayName("should increment version on each append")
    void versionIncrement() {
        UUID aggregateId = UUID.randomUUID();
        when(eventRepository.countByAggregateId(aggregateId)).thenReturn(5L);
        when(eventRepository.save(any(DomainEvent.class))).thenAnswer(i -> i.getArgument(0));

        DomainEvent event = eventStoreService.append(aggregateId, "Interview", "STATUS_CHANGED", "{}", UUID.randomUUID(), UUID.randomUUID());

        assertThat(event.getVersion()).isEqualTo(6);
    }
}
