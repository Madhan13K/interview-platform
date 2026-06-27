package com.interview_platform_backend.interview_platform_backend.internalmobility.service;

import com.interview_platform_backend.interview_platform_backend.internalmobility.entity.InternalApplication;
import com.interview_platform_backend.interview_platform_backend.internalmobility.entity.InternalJobPosting;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InternalMobilityService {

    private static final Logger log = LoggerFactory.getLogger(InternalMobilityService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public InternalJobPosting createPosting(InternalJobPosting posting) {
        log.info("Creating internal job posting: title={} dept={}", posting.getTitle(), posting.getDepartment());
        entityManager.persist(posting);
        return posting;
    }

    @Transactional
    public InternalApplication apply(InternalApplication application) {
        InternalJobPosting posting = entityManager.find(InternalJobPosting.class, application.getPostingId());
        if (posting == null) {
            throw new IllegalArgumentException("Posting not found: " + application.getPostingId());
        }
        if (posting.getStatus() != InternalJobPosting.Status.OPEN) {
            throw new IllegalStateException("Posting is not open for applications");
        }

        entityManager.persist(application);
        posting.setApplicantCount(posting.getApplicantCount() + 1);
        entityManager.merge(posting);

        log.info("Employee {} applied to posting {}", application.getEmployeeId(), application.getPostingId());
        return application;
    }

    @Transactional
    public InternalApplication approveByManager(UUID applicationId, boolean approved) {
        InternalApplication application = entityManager.find(InternalApplication.class, applicationId);
        if (application == null) {
            throw new IllegalArgumentException("Application not found: " + applicationId);
        }
        application.setManagerApproval(approved ? InternalApplication.ManagerApproval.APPROVED : InternalApplication.ManagerApproval.DENIED);
        log.info("Application {} manager approval: {}", applicationId, application.getManagerApproval());
        return entityManager.merge(application);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<InternalJobPosting> listOpenPostings() {
        return entityManager.createQuery("SELECT p FROM InternalJobPosting p WHERE p.status = :status ORDER BY p.createdAt DESC")
                .setParameter("status", InternalJobPosting.Status.OPEN)
                .getResultList();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<InternalApplication> getApplicationsByEmployee(UUID employeeId) {
        return entityManager.createQuery("SELECT a FROM InternalApplication a WHERE a.employeeId = :employeeId ORDER BY a.appliedAt DESC")
                .setParameter("employeeId", employeeId)
                .getResultList();
    }

    @Transactional(readOnly = true)
    public InternalJobPosting getPosting(UUID id) {
        return entityManager.find(InternalJobPosting.class, id);
    }

    @Transactional
    public InternalJobPosting closePosting(UUID postingId) {
        InternalJobPosting posting = entityManager.find(InternalJobPosting.class, postingId);
        if (posting == null) {
            throw new IllegalArgumentException("Posting not found: " + postingId);
        }
        posting.setStatus(InternalJobPosting.Status.CLOSED);
        posting.setClosedAt(Instant.now());
        log.info("Internal posting {} closed", postingId);
        return entityManager.merge(posting);
    }
}
