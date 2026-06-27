package com.interview_platform_backend.interview_platform_backend.duplicatedetection.service;

import com.interview_platform_backend.interview_platform_backend.duplicatedetection.entity.DuplicateCandidate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class DuplicateDetectionService {

    @PersistenceContext
    private EntityManager entityManager;

    public List<DuplicateCandidate> scanForDuplicates(UUID candidateId) {
        log.info("Scanning for duplicates of candidate: {}", candidateId);

        // Query existing detected duplicates for this candidate
        TypedQuery<DuplicateCandidate> query = entityManager.createQuery(
                "SELECT dc FROM DuplicateCandidate dc WHERE (dc.candidateAId = :cid OR dc.candidateBId = :cid) AND dc.status = :status",
                DuplicateCandidate.class);
        query.setParameter("cid", candidateId);
        query.setParameter("status", DuplicateCandidate.DuplicateStatus.DETECTED);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<DuplicateCandidate> getPendingDuplicates() {
        log.info("Fetching pending duplicates");
        TypedQuery<DuplicateCandidate> query = entityManager.createQuery(
                "SELECT dc FROM DuplicateCandidate dc WHERE dc.status = :status ORDER BY dc.matchScore DESC",
                DuplicateCandidate.class);
        query.setParameter("status", DuplicateCandidate.DuplicateStatus.DETECTED);
        return query.getResultList();
    }

    public DuplicateCandidate resolveDuplicate(UUID id, String resolution) {
        log.info("Resolving duplicate {} with resolution: {}", id, resolution);
        DuplicateCandidate duplicate = entityManager.find(DuplicateCandidate.class, id);
        if (duplicate == null) {
            throw new IllegalArgumentException("Duplicate record not found: " + id);
        }

        DuplicateCandidate.DuplicateStatus newStatus = DuplicateCandidate.DuplicateStatus.valueOf(resolution.toUpperCase());
        duplicate.setStatus(newStatus);
        duplicate.setResolvedAt(Instant.now());
        return entityManager.merge(duplicate);
    }

    public DuplicateCandidate mergeCandidates(UUID keepId, UUID mergeId) {
        log.info("Merging candidate {} into {}", mergeId, keepId);

        // Find or create a duplicate record for this merge
        TypedQuery<DuplicateCandidate> query = entityManager.createQuery(
                "SELECT dc FROM DuplicateCandidate dc WHERE (dc.candidateAId = :keepId AND dc.candidateBId = :mergeId) OR (dc.candidateAId = :mergeId AND dc.candidateBId = :keepId)",
                DuplicateCandidate.class);
        query.setParameter("keepId", keepId);
        query.setParameter("mergeId", mergeId);

        List<DuplicateCandidate> existing = query.getResultList();
        DuplicateCandidate record;

        if (!existing.isEmpty()) {
            record = existing.get(0);
        } else {
            record = DuplicateCandidate.builder()
                    .candidateAId(keepId)
                    .candidateBId(mergeId)
                    .matchScore(100.0)
                    .matchedFields("{\"manual_merge\": true}")
                    .build();
            entityManager.persist(record);
        }

        record.setStatus(DuplicateCandidate.DuplicateStatus.MERGED);
        record.setResolvedAt(Instant.now());
        return entityManager.merge(record);
    }
}
