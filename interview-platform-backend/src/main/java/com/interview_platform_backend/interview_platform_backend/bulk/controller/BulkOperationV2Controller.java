package com.interview_platform_backend.interview_platform_backend.bulk.controller;

import com.interview_platform_backend.interview_platform_backend.bulk.dto.*;
import com.interview_platform_backend.interview_platform_backend.bulk.service.BulkOperationServiceV2;
import com.interview_platform_backend.interview_platform_backend.security.util.SecurityHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bulk")
@Tag(name = "Bulk Operations V2", description = "Batch create/update/delete for enterprise imports")
public class BulkOperationV2Controller {

    private final BulkOperationServiceV2 bulkOperationServiceV2;
    private final SecurityHelper securityHelper;

    public BulkOperationV2Controller(BulkOperationServiceV2 bulkOperationServiceV2, SecurityHelper securityHelper) {
        this.bulkOperationServiceV2 = bulkOperationServiceV2;
        this.securityHelper = securityHelper;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    @Operation(summary = "Batch create entities")
    public ResponseEntity<BulkOperationStatusResponse> bulkCreate(
            @RequestBody @Valid BulkCreateRequest request,
            @RequestParam(required = false) UUID organizationId) {
        UUID userId = securityHelper.getCurrentUserId();
        BulkOperationStatusResponse response = bulkOperationServiceV2.bulkCreate(
                request.getEntityType(), request.getItems(), userId, organizationId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    @Operation(summary = "Batch update entities")
    public ResponseEntity<BulkOperationStatusResponse> bulkUpdate(
            @RequestBody @Valid BulkUpdateRequest request,
            @RequestParam(required = false) UUID organizationId) {
        UUID userId = securityHelper.getCurrentUserId();
        BulkOperationStatusResponse response = bulkOperationServiceV2.bulkUpdate(
                request.getEntityType(), request.getItems(), userId, organizationId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/delete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    @Operation(summary = "Batch delete entities")
    public ResponseEntity<BulkOperationStatusResponse> bulkDelete(
            @RequestBody @Valid BulkDeleteRequest request,
            @RequestParam(required = false) UUID organizationId) {
        UUID userId = securityHelper.getCurrentUserId();
        BulkOperationStatusResponse response = bulkOperationServiceV2.bulkDelete(
                request.getEntityType(), request.getIds(), userId, organizationId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/operations/{id}")
    @Operation(summary = "Get operation status")
    public ResponseEntity<BulkOperationStatusResponse> getOperation(@PathVariable UUID id) {
        BulkOperationStatusResponse response = bulkOperationServiceV2.getOperation(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/operations")
    @Operation(summary = "List operations for current user")
    public ResponseEntity<List<BulkOperationStatusResponse>> getOperations() {
        UUID userId = securityHelper.getCurrentUserId();
        List<BulkOperationStatusResponse> operations = bulkOperationServiceV2.getOperationsByUser(userId);
        return ResponseEntity.ok(operations);
    }
}
