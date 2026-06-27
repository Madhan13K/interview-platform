package com.interview_platform_backend.interview_platform_backend.headcount.service;

import com.interview_platform_backend.interview_platform_backend.headcount.entity.HeadcountPlan;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class HeadcountService {

    private static final Logger log = LoggerFactory.getLogger(HeadcountService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public HeadcountPlan createPlan(HeadcountPlan plan) {
        log.info("Creating headcount plan for dept={} quarter={}", plan.getDepartment(), plan.getQuarter());
        entityManager.persist(plan);
        return plan;
    }

    @Transactional
    public HeadcountPlan updatePlan(UUID planId, HeadcountPlan updated) {
        HeadcountPlan existing = entityManager.find(HeadcountPlan.class, planId);
        if (existing == null) {
            throw new IllegalArgumentException("Headcount plan not found: " + planId);
        }
        existing.setDepartment(updated.getDepartment());
        existing.setQuarter(updated.getQuarter());
        existing.setTotalBudget(updated.getTotalBudget());
        existing.setFilledPositions(updated.getFilledPositions());
        existing.setOpenPositions(updated.getOpenPositions());
        existing.setPipelineCount(updated.getPipelineCount());
        log.info("Updated headcount plan {}", planId);
        return entityManager.merge(existing);
    }

    @Transactional
    public HeadcountPlan approvePlan(UUID planId, UUID approvedBy) {
        HeadcountPlan plan = entityManager.find(HeadcountPlan.class, planId);
        if (plan == null) {
            throw new IllegalArgumentException("Headcount plan not found: " + planId);
        }
        plan.setStatus(HeadcountPlan.Status.APPROVED);
        plan.setApprovedBy(approvedBy);
        log.info("Headcount plan {} approved by {}", planId, approvedBy);
        return entityManager.merge(plan);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getForecast(UUID planId) {
        HeadcountPlan plan = entityManager.find(HeadcountPlan.class, planId);
        if (plan == null) {
            throw new IllegalArgumentException("Headcount plan not found: " + planId);
        }

        int totalPositions = plan.getFilledPositions() + plan.getOpenPositions();
        double fillRate = totalPositions > 0 ? (double) plan.getFilledPositions() / totalPositions * 100 : 0;
        double burnRate = plan.getTotalBudget() > 0 ? (double) plan.getFilledPositions() * plan.getTotalBudget() / totalPositions : 0;
        int remainingBudget = plan.getTotalBudget() - (int) burnRate;

        Map<String, Object> forecast = new HashMap<>();
        forecast.put("planId", planId);
        forecast.put("department", plan.getDepartment());
        forecast.put("quarter", plan.getQuarter());
        forecast.put("fillRate", String.format("%.1f%%", fillRate));
        forecast.put("burnRate", burnRate);
        forecast.put("remainingBudget", remainingBudget);
        forecast.put("pipelineToOpenRatio", plan.getOpenPositions() > 0 ? (double) plan.getPipelineCount() / plan.getOpenPositions() : 0);

        log.info("Forecast generated for plan {}: fillRate={}%", planId, fillRate);
        return forecast;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<HeadcountPlan> getByDepartment(String department) {
        return entityManager.createQuery("SELECT p FROM HeadcountPlan p WHERE p.department = :department ORDER BY p.createdAt DESC")
                .setParameter("department", department)
                .getResultList();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<HeadcountPlan> getByQuarter(String quarter) {
        return entityManager.createQuery("SELECT p FROM HeadcountPlan p WHERE p.quarter = :quarter ORDER BY p.department ASC")
                .setParameter("quarter", quarter)
                .getResultList();
    }

    @Transactional(readOnly = true)
    public HeadcountPlan getById(UUID id) {
        return entityManager.find(HeadcountPlan.class, id);
    }
}
