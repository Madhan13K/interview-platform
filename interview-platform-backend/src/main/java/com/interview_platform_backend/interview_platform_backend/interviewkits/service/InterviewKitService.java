package com.interview_platform_backend.interview_platform_backend.interviewkits.service;

import com.interview_platform_backend.interview_platform_backend.interviewkits.entity.InterviewKit;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InterviewKitService {

    private static final Logger log = LoggerFactory.getLogger(InterviewKitService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public InterviewKit create(InterviewKit kit) {
        log.info("Creating interview kit: title={}, role={}", kit.getTitle(), kit.getRoleType());
        entityManager.persist(kit);
        return kit;
    }

    @Transactional(readOnly = true)
    public InterviewKit getById(UUID id) {
        return entityManager.find(InterviewKit.class, id);
    }

    @Transactional
    public InterviewKit update(UUID id, InterviewKit updated) {
        InterviewKit existing = entityManager.find(InterviewKit.class, id);
        if (existing == null) {
            throw new IllegalArgumentException("Interview kit not found: " + id);
        }
        existing.setTitle(updated.getTitle());
        existing.setRoleType(updated.getRoleType());
        existing.setInterviewType(updated.getInterviewType());
        existing.setDescription(updated.getDescription());
        existing.setRubric(updated.getRubric());
        existing.setQuestions(updated.getQuestions());
        existing.setScoringCriteria(updated.getScoringCriteria());
        existing.setDuration(updated.getDuration());
        existing.setPublished(updated.isPublished());
        log.info("Updated interview kit {}", id);
        return entityManager.merge(existing);
    }

    @Transactional
    public void delete(UUID id) {
        InterviewKit kit = entityManager.find(InterviewKit.class, id);
        if (kit != null) {
            entityManager.remove(kit);
            log.info("Deleted interview kit {}", id);
        }
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<InterviewKit> listByRole(String roleType) {
        return entityManager.createQuery("SELECT k FROM InterviewKit k WHERE k.roleType = :roleType ORDER BY k.createdAt DESC")
                .setParameter("roleType", roleType)
                .getResultList();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<InterviewKit> listAll() {
        return entityManager.createQuery("SELECT k FROM InterviewKit k ORDER BY k.createdAt DESC")
                .getResultList();
    }

    public byte[] generatePdf(UUID id) {
        InterviewKit kit = entityManager.find(InterviewKit.class, id);
        if (kit == null) {
            throw new IllegalArgumentException("Interview kit not found: " + id);
        }
        log.info("Generating PDF for interview kit {}", id);
        // Mock PDF generation - returns a placeholder
        String content = String.format("Interview Kit: %s\nRole: %s\nType: %s\nDuration: %d min\n\nQuestions:\n%s\n\nRubric:\n%s",
                kit.getTitle(), kit.getRoleType(), kit.getInterviewType(), kit.getDuration(),
                kit.getQuestions(), kit.getRubric());
        return content.getBytes();
    }
}
