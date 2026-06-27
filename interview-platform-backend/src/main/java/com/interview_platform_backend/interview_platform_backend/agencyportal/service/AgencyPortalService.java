package com.interview_platform_backend.interview_platform_backend.agencyportal.service;

import com.interview_platform_backend.interview_platform_backend.agencyportal.entity.AgencySubmission;
import com.interview_platform_backend.interview_platform_backend.agencyportal.entity.RecruitingAgency;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgencyPortalService {

    private static final Logger log = LoggerFactory.getLogger(AgencyPortalService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Transactional
    public RecruitingAgency registerAgency(String name, String contactEmail,
                                           RecruitingAgency.ContractType contractType,
                                           double feePercentage, int slaResponseHours) {
        RecruitingAgency agency = RecruitingAgency.builder()
                .name(name)
                .contactEmail(contactEmail)
                .contractType(contractType)
                .feePercentage(feePercentage)
                .status(RecruitingAgency.AgencyStatus.ACTIVE)
                .slaResponseHours(slaResponseHours)
                .totalPlacements(0)
                .build();

        entityManager.persist(agency);
        log.info("Registered new recruiting agency [{}]: {}", agency.getId(), name);
        return agency;
    }

    @Transactional
    public AgencySubmission submitCandidate(UUID agencyId, UUID candidateId, UUID jobPositionId, double fee) {
        RecruitingAgency agency = entityManager.find(RecruitingAgency.class, agencyId);
        if (agency == null) {
            throw new IllegalArgumentException("Agency not found: " + agencyId);
        }
        if (agency.getStatus() != RecruitingAgency.AgencyStatus.ACTIVE) {
            throw new IllegalStateException("Agency is not active: " + agencyId);
        }

        AgencySubmission submission = AgencySubmission.builder()
                .agencyId(agencyId)
                .candidateId(candidateId)
                .jobPositionId(jobPositionId)
                .status(AgencySubmission.SubmissionStatus.SUBMITTED)
                .fee(fee)
                .build();

        entityManager.persist(submission);
        log.info("Agency [{}] submitted candidate [{}] for job [{}]", agencyId, candidateId, jobPositionId);
        return submission;
    }

    @Transactional
    public AgencySubmission reviewSubmission(UUID submissionId, AgencySubmission.SubmissionStatus newStatus) {
        AgencySubmission submission = entityManager.find(AgencySubmission.class, submissionId);
        if (submission == null) {
            throw new IllegalArgumentException("Submission not found: " + submissionId);
        }
        submission.setStatus(newStatus);

        if (newStatus == AgencySubmission.SubmissionStatus.PLACED) {
            RecruitingAgency agency = entityManager.find(RecruitingAgency.class, submission.getAgencyId());
            if (agency != null) {
                agency.setTotalPlacements(agency.getTotalPlacements() + 1);
                entityManager.merge(agency);
            }
        }

        log.info("Submission [{}] status updated to [{}]", submissionId, newStatus);
        return entityManager.merge(submission);
    }

    @Transactional(readOnly = true)
    public double trackFees(UUID agencyId) {
        TypedQuery<Double> query = entityManager.createQuery(
                "SELECT COALESCE(SUM(s.fee), 0) FROM AgencySubmission s WHERE s.agencyId = :agencyId AND s.status = 'PLACED'",
                Double.class);
        query.setParameter("agencyId", agencyId);
        return query.getSingleResult();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAgencyPerformance(UUID agencyId) {
        RecruitingAgency agency = entityManager.find(RecruitingAgency.class, agencyId);
        if (agency == null) {
            throw new IllegalArgumentException("Agency not found: " + agencyId);
        }

        TypedQuery<Long> totalQuery = entityManager.createQuery(
                "SELECT COUNT(s) FROM AgencySubmission s WHERE s.agencyId = :agencyId",
                Long.class);
        totalQuery.setParameter("agencyId", agencyId);
        long totalSubmissions = totalQuery.getSingleResult();

        TypedQuery<Long> placedQuery = entityManager.createQuery(
                "SELECT COUNT(s) FROM AgencySubmission s WHERE s.agencyId = :agencyId AND s.status = 'PLACED'",
                Long.class);
        placedQuery.setParameter("agencyId", agencyId);
        long placedCount = placedQuery.getSingleResult();

        double totalFees = trackFees(agencyId);

        return Map.of(
                "agencyId", agencyId,
                "agencyName", agency.getName(),
                "totalSubmissions", totalSubmissions,
                "totalPlacements", placedCount,
                "totalFees", totalFees,
                "conversionRate", totalSubmissions > 0 ? (double) placedCount / totalSubmissions : 0.0
        );
    }
}
