package com.interview_platform_backend.interview_platform_backend.requisitionapproval.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.requisitionapproval.entity.Requisition;
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
public class RequisitionApprovalService {

    private static final Logger log = LoggerFactory.getLogger(RequisitionApprovalService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    private final ObjectMapper objectMapper;

    @Transactional
    public Requisition submitRequisition(String jobTitle, String department, UUID requestedBy,
                                         int headcount, String justification, String budgetImpact,
                                         List<UUID> approverChain) {
        String chainJson = serializeChain(approverChain);
        UUID firstApprover = approverChain.isEmpty() ? null : approverChain.get(0);

        Requisition requisition = Requisition.builder()
                .jobTitle(jobTitle)
                .department(department)
                .requestedBy(requestedBy)
                .headcount(headcount)
                .justification(justification)
                .budgetImpact(budgetImpact)
                .status(Requisition.RequisitionStatus.PENDING_APPROVAL)
                .approvalChain(chainJson)
                .currentApprover(firstApprover)
                .build();

        entityManager.persist(requisition);
        log.info("Submitted requisition [{}] for '{}' in department [{}]", requisition.getId(), jobTitle, department);
        return requisition;
    }

    @Transactional
    public Requisition approve(UUID requisitionId, UUID approverId) {
        Requisition requisition = entityManager.find(Requisition.class, requisitionId);
        if (requisition == null) {
            throw new IllegalArgumentException("Requisition not found: " + requisitionId);
        }
        if (requisition.getCurrentApprover() == null || !requisition.getCurrentApprover().equals(approverId)) {
            throw new IllegalStateException("User is not the current approver for this requisition");
        }

        List<UUID> chain = deserializeChain(requisition.getApprovalChain());
        int currentIndex = chain.indexOf(approverId);

        if (currentIndex < chain.size() - 1) {
            // Move to next approver in chain
            UUID nextApprover = chain.get(currentIndex + 1);
            requisition.setCurrentApprover(nextApprover);
            log.info("Requisition [{}] approved by [{}], moving to next approver [{}]",
                    requisitionId, approverId, nextApprover);
        } else {
            // Final approval
            requisition.setStatus(Requisition.RequisitionStatus.APPROVED);
            requisition.setCurrentApprover(null);
            requisition.setApprovedAt(Instant.now());
            log.info("Requisition [{}] fully approved by [{}]", requisitionId, approverId);
        }

        return entityManager.merge(requisition);
    }

    @Transactional
    public Requisition reject(UUID requisitionId, UUID approverId) {
        Requisition requisition = entityManager.find(Requisition.class, requisitionId);
        if (requisition == null) {
            throw new IllegalArgumentException("Requisition not found: " + requisitionId);
        }
        if (requisition.getCurrentApprover() == null || !requisition.getCurrentApprover().equals(approverId)) {
            throw new IllegalStateException("User is not the current approver for this requisition");
        }

        requisition.setStatus(Requisition.RequisitionStatus.REJECTED);
        requisition.setCurrentApprover(null);
        log.info("Requisition [{}] rejected by [{}]", requisitionId, approverId);
        return entityManager.merge(requisition);
    }

    @Transactional
    public Requisition escalate(UUID requisitionId, UUID newApproverId) {
        Requisition requisition = entityManager.find(Requisition.class, requisitionId);
        if (requisition == null) {
            throw new IllegalArgumentException("Requisition not found: " + requisitionId);
        }

        requisition.setCurrentApprover(newApproverId);
        log.info("Requisition [{}] escalated to [{}]", requisitionId, newApproverId);
        return entityManager.merge(requisition);
    }

    @Transactional(readOnly = true)
    public List<Requisition> getMyPendingApprovals(UUID approverId) {
        TypedQuery<Requisition> query = entityManager.createQuery(
                "SELECT r FROM Requisition r WHERE r.currentApprover = :approverId AND r.status = :status ORDER BY r.createdAt ASC",
                Requisition.class);
        query.setParameter("approverId", approverId);
        query.setParameter("status", Requisition.RequisitionStatus.PENDING_APPROVAL);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<Requisition> getByDepartment(String department) {
        TypedQuery<Requisition> query = entityManager.createQuery(
                "SELECT r FROM Requisition r WHERE r.department = :department ORDER BY r.createdAt DESC",
                Requisition.class);
        query.setParameter("department", department);
        return query.getResultList();
    }

    private String serializeChain(List<UUID> chain) {
        try {
            return objectMapper.writeValueAsString(chain);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize approval chain", e);
        }
    }

    private List<UUID> deserializeChain(String chainJson) {
        if (chainJson == null || chainJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(chainJson, new TypeReference<List<UUID>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize approval chain", e);
        }
    }
}
