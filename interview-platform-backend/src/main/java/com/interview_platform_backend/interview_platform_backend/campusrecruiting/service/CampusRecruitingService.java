package com.interview_platform_backend.interview_platform_backend.campusrecruiting.service;

import com.interview_platform_backend.interview_platform_backend.campusrecruiting.entity.CampusEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampusRecruitingService {

    private static final Logger log = LoggerFactory.getLogger(CampusRecruitingService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Transactional
    public CampusEvent createEvent(String universityName, Instant eventDate, String location,
                                   UUID coordinatorId, int maxCandidates, String cohortTag, String notes) {
        CampusEvent event = CampusEvent.builder()
                .universityName(universityName)
                .eventDate(eventDate)
                .location(location)
                .coordinatorId(coordinatorId)
                .status(CampusEvent.EventStatus.PLANNED)
                .maxCandidates(maxCandidates)
                .registeredCount(0)
                .cohortTag(cohortTag)
                .notes(notes)
                .build();

        entityManager.persist(event);
        log.info("Created campus event [{}] at university [{}]", event.getId(), universityName);
        return event;
    }

    @Transactional
    public CampusEvent registerCandidate(UUID eventId, UUID candidateId) {
        CampusEvent event = entityManager.find(CampusEvent.class, eventId);
        if (event == null) {
            throw new IllegalArgumentException("Campus event not found: " + eventId);
        }
        if (event.getRegisteredCount() >= event.getMaxCandidates()) {
            throw new IllegalStateException("Event has reached maximum capacity");
        }
        event.setRegisteredCount(event.getRegisteredCount() + 1);
        log.info("Registered candidate [{}] for campus event [{}]. Count: {}/{}",
                candidateId, eventId, event.getRegisteredCount(), event.getMaxCandidates());
        return entityManager.merge(event);
    }

    @Transactional
    public void bulkScheduleInterviews(UUID eventId, List<UUID> candidateIds) {
        CampusEvent event = entityManager.find(CampusEvent.class, eventId);
        if (event == null) {
            throw new IllegalArgumentException("Campus event not found: " + eventId);
        }
        event.setStatus(CampusEvent.EventStatus.IN_PROGRESS);
        entityManager.merge(event);
        log.info("Bulk scheduled {} interviews for campus event [{}]", candidateIds.size(), eventId);
    }

    @Transactional(readOnly = true)
    public List<CampusEvent> getCohort(String cohortTag) {
        TypedQuery<CampusEvent> query = entityManager.createQuery(
                "SELECT e FROM CampusEvent e WHERE e.cohortTag = :tag ORDER BY e.eventDate DESC",
                CampusEvent.class);
        query.setParameter("tag", cohortTag);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<CampusEvent> listByUniversity(String universityName) {
        TypedQuery<CampusEvent> query = entityManager.createQuery(
                "SELECT e FROM CampusEvent e WHERE e.universityName = :name ORDER BY e.eventDate DESC",
                CampusEvent.class);
        query.setParameter("name", universityName);
        return query.getResultList();
    }
}
