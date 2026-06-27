package com.interview_platform_backend.interview_platform_backend.successionplanning.service;

import com.interview_platform_backend.interview_platform_backend.successionplanning.entity.SuccessionPlan;
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
public class SuccessionPlanningService {

    @PersistenceContext
    private EntityManager entityManager;

    public SuccessionPlan createPlan(SuccessionPlan plan) {
        log.info("Creating succession plan for position: {}", plan.getPositionTitle());
        entityManager.persist(plan);
        return plan;
    }

    public SuccessionPlan addSuccessor(UUID planId, String successorJson) {
        log.info("Adding successor to plan: {}", planId);
        SuccessionPlan plan = entityManager.find(SuccessionPlan.class, planId);
        if (plan == null) {
            throw new IllegalArgumentException("Succession plan not found: " + planId);
        }

        String existing = plan.getSuccessors();
        if (existing == null || existing.isBlank() || existing.equals("[]")) {
            plan.setSuccessors("[" + successorJson + "]");
        } else {
            plan.setSuccessors(existing.substring(0, existing.length() - 1) + "," + successorJson + "]");
        }
        return entityManager.merge(plan);
    }

    public SuccessionPlan assessReadiness(UUID planId, UUID userId, String readinessLevel) {
        log.info("Assessing readiness for user {} in plan {}", userId, planId);
        SuccessionPlan plan = entityManager.find(SuccessionPlan.class, planId);
        if (plan == null) {
            throw new IllegalArgumentException("Succession plan not found: " + planId);
        }
        plan.setLastReviewDate(Instant.now());
        return entityManager.merge(plan);
    }

    @Transactional(readOnly = true)
    public List<SuccessionPlan> getHighRiskPositions() {
        log.debug("Fetching high risk positions");
        TypedQuery<SuccessionPlan> query = entityManager.createQuery(
                "SELECT sp FROM SuccessionPlan sp WHERE sp.riskLevel IN :levels ORDER BY sp.riskLevel DESC",
                SuccessionPlan.class);
        query.setParameter("levels", List.of(SuccessionPlan.RiskLevel.HIGH, SuccessionPlan.RiskLevel.CRITICAL));
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<SuccessionPlan> getByDepartment(String department) {
        log.debug("Fetching succession plans for department: {}", department);
        TypedQuery<SuccessionPlan> query = entityManager.createQuery(
                "SELECT sp FROM SuccessionPlan sp WHERE sp.department = :dept",
                SuccessionPlan.class);
        query.setParameter("dept", department);
        return query.getResultList();
    }
}
