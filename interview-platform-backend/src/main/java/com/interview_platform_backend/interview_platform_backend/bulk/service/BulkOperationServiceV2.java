package com.interview_platform_backend.interview_platform_backend.bulk.service;

import com.interview_platform_backend.interview_platform_backend.bulk.dto.*;
import com.interview_platform_backend.interview_platform_backend.bulk.entity.BulkOperation;
import com.interview_platform_backend.interview_platform_backend.bulk.repository.BulkOperationRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BulkOperationServiceV2 {

    private static final Logger log = LoggerFactory.getLogger(BulkOperationServiceV2.class);

    private final BulkOperationRepository bulkOperationRepository;
    private final UserRepository userRepository;

    public BulkOperationServiceV2(BulkOperationRepository bulkOperationRepository,
                                  UserRepository userRepository) {
        this.bulkOperationRepository = bulkOperationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BulkOperationStatusResponse bulkCreate(String entityType, List<Map<String, Object>> items, UUID userId, UUID orgId) {
        User submittedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        BulkOperation operation = BulkOperation.builder()
                .organizationId(orgId)
                .operationType("CREATE")
                .entityType(entityType)
                .totalItems(items.size())
                .status("PENDING")
                .submittedBy(submittedBy)
                .build();

        BulkOperation saved = bulkOperationRepository.save(operation);
        processCreateItems(saved.getId(), items);
        return toStatusResponse(bulkOperationRepository.findById(saved.getId()).orElse(saved));
    }

    @Transactional
    public BulkOperationStatusResponse bulkUpdate(String entityType, List<Map<String, Object>> items, UUID userId, UUID orgId) {
        User submittedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        BulkOperation operation = BulkOperation.builder()
                .organizationId(orgId)
                .operationType("UPDATE")
                .entityType(entityType)
                .totalItems(items.size())
                .status("PENDING")
                .submittedBy(submittedBy)
                .build();

        BulkOperation saved = bulkOperationRepository.save(operation);
        processUpdateItems(saved.getId(), items);
        return toStatusResponse(bulkOperationRepository.findById(saved.getId()).orElse(saved));
    }

    @Transactional
    public BulkOperationStatusResponse bulkDelete(String entityType, List<UUID> ids, UUID userId, UUID orgId) {
        User submittedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        BulkOperation operation = BulkOperation.builder()
                .organizationId(orgId)
                .operationType("DELETE")
                .entityType(entityType)
                .totalItems(ids.size())
                .status("PENDING")
                .submittedBy(submittedBy)
                .build();

        BulkOperation saved = bulkOperationRepository.save(operation);
        processDeleteItems(saved.getId(), ids);
        return toStatusResponse(bulkOperationRepository.findById(saved.getId()).orElse(saved));
    }

    @Transactional(readOnly = true)
    public BulkOperationStatusResponse getOperation(UUID operationId) {
        BulkOperation operation = bulkOperationRepository.findById(operationId)
                .orElseThrow(() -> new RuntimeException("Bulk operation not found: " + operationId));
        return toStatusResponse(operation);
    }

    @Transactional(readOnly = true)
    public List<BulkOperationStatusResponse> getOperationsByUser(UUID userId) {
        return bulkOperationRepository.findBySubmittedById(userId).stream()
                .map(this::toStatusResponse)
                .collect(Collectors.toList());
    }

    @Async
    @Transactional
    public void processCreateItems(UUID operationId, List<Map<String, Object>> items) {
        BulkOperation operation = bulkOperationRepository.findById(operationId).orElse(null);
        if (operation == null) return;

        operation.setStatus("PROCESSING");
        operation.setStartedAt(Instant.now());
        bulkOperationRepository.save(operation);

        int successCount = 0;
        int failureCount = 0;
        List<Map<String, Object>> errors = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            try {
                // Process each item - in a real implementation, this would delegate
                // to the appropriate entity service based on entityType
                processCreateItem(operation.getEntityType(), items.get(i));
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(Map.of("index", i, "error", e.getMessage()));
                log.warn("Bulk create item {} failed: {}", i, e.getMessage());
            }
            operation.setProcessedItems(successCount + failureCount);
            bulkOperationRepository.save(operation);
        }

        operation.setSuccessCount(successCount);
        operation.setFailureCount(failureCount);
        operation.setStatus(failureCount == items.size() ? "FAILED" : "COMPLETED");
        operation.setCompletedAt(Instant.now());
        if (!errors.isEmpty()) {
            operation.setErrorSummary(errors);
        }
        bulkOperationRepository.save(operation);
    }

    @Async
    @Transactional
    public void processUpdateItems(UUID operationId, List<Map<String, Object>> items) {
        BulkOperation operation = bulkOperationRepository.findById(operationId).orElse(null);
        if (operation == null) return;

        operation.setStatus("PROCESSING");
        operation.setStartedAt(Instant.now());
        bulkOperationRepository.save(operation);

        int successCount = 0;
        int failureCount = 0;
        List<Map<String, Object>> errors = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            try {
                Map<String, Object> item = items.get(i);
                if (!item.containsKey("id")) {
                    throw new IllegalArgumentException("Each item must contain an 'id' field");
                }
                processUpdateItem(operation.getEntityType(), item);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(Map.of("index", i, "error", e.getMessage()));
                log.warn("Bulk update item {} failed: {}", i, e.getMessage());
            }
            operation.setProcessedItems(successCount + failureCount);
            bulkOperationRepository.save(operation);
        }

        operation.setSuccessCount(successCount);
        operation.setFailureCount(failureCount);
        operation.setStatus(failureCount == items.size() ? "FAILED" : "COMPLETED");
        operation.setCompletedAt(Instant.now());
        if (!errors.isEmpty()) {
            operation.setErrorSummary(errors);
        }
        bulkOperationRepository.save(operation);
    }

    @Async
    @Transactional
    public void processDeleteItems(UUID operationId, List<UUID> ids) {
        BulkOperation operation = bulkOperationRepository.findById(operationId).orElse(null);
        if (operation == null) return;

        operation.setStatus("PROCESSING");
        operation.setStartedAt(Instant.now());
        bulkOperationRepository.save(operation);

        int successCount = 0;
        int failureCount = 0;
        List<Map<String, Object>> errors = new ArrayList<>();

        for (int i = 0; i < ids.size(); i++) {
            try {
                processDeleteItem(operation.getEntityType(), ids.get(i));
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add(Map.of("index", i, "error", e.getMessage()));
                log.warn("Bulk delete item {} failed: {}", i, e.getMessage());
            }
            operation.setProcessedItems(successCount + failureCount);
            bulkOperationRepository.save(operation);
        }

        operation.setSuccessCount(successCount);
        operation.setFailureCount(failureCount);
        operation.setStatus(failureCount == ids.size() ? "FAILED" : "COMPLETED");
        operation.setCompletedAt(Instant.now());
        if (!errors.isEmpty()) {
            operation.setErrorSummary(errors);
        }
        bulkOperationRepository.save(operation);
    }

    private void processCreateItem(String entityType, Map<String, Object> item) {
        // Delegate to appropriate service based on entity type
        // This is a placeholder - real implementation would route to InterviewService, CandidateService, etc.
        log.info("Processing bulk CREATE for entity type: {} with data: {}", entityType, item);
        // Validate required fields exist
        if (item == null || item.isEmpty()) {
            throw new IllegalArgumentException("Item data cannot be empty");
        }
    }

    private void processUpdateItem(String entityType, Map<String, Object> item) {
        log.info("Processing bulk UPDATE for entity type: {} with data: {}", entityType, item);
        if (item == null || item.isEmpty()) {
            throw new IllegalArgumentException("Item data cannot be empty");
        }
    }

    private void processDeleteItem(String entityType, UUID id) {
        log.info("Processing bulk DELETE for entity type: {} with id: {}", entityType, id);
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
    }

    private BulkOperationStatusResponse toStatusResponse(BulkOperation operation) {
        return BulkOperationStatusResponse.builder()
                .id(operation.getId())
                .status(operation.getStatus())
                .operationType(operation.getOperationType())
                .entityType(operation.getEntityType())
                .totalItems(operation.getTotalItems())
                .processedItems(operation.getProcessedItems())
                .successCount(operation.getSuccessCount())
                .failureCount(operation.getFailureCount())
                .errors(operation.getErrorSummary())
                .build();
    }
}
