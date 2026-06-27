package com.interview_platform_backend.interview_platform_backend.customfields.controller;

import com.interview_platform_backend.interview_platform_backend.customfields.dto.*;
import com.interview_platform_backend.interview_platform_backend.customfields.service.CustomFieldService;
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
@RequestMapping("/api/v1/custom-fields")
@Tag(name = "Custom Fields", description = "User-defined fields that can be attached to any entity")
public class CustomFieldController {

    private final CustomFieldService customFieldService;
    private final SecurityHelper securityHelper;

    public CustomFieldController(CustomFieldService customFieldService, SecurityHelper securityHelper) {
        this.customFieldService = customFieldService;
        this.securityHelper = securityHelper;
    }

    @PostMapping("/definitions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a custom field definition")
    public ResponseEntity<FieldDefinitionResponse> createDefinition(
            @RequestBody @Valid FieldDefinitionRequest request,
            @RequestParam UUID organizationId) {
        UUID userId = securityHelper.getCurrentUserId();
        FieldDefinitionResponse response = customFieldService.createFieldDefinition(request, organizationId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/definitions")
    @Operation(summary = "List custom field definitions for an entity type")
    public ResponseEntity<List<FieldDefinitionResponse>> getDefinitions(
            @RequestParam UUID organizationId,
            @RequestParam(required = false) String entityType) {
        List<FieldDefinitionResponse> definitions = customFieldService.getFieldDefinitions(organizationId, entityType);
        return ResponseEntity.ok(definitions);
    }

    @PutMapping("/definitions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a custom field definition")
    public ResponseEntity<FieldDefinitionResponse> updateDefinition(
            @PathVariable UUID id,
            @RequestBody @Valid FieldDefinitionRequest request) {
        FieldDefinitionResponse response = customFieldService.updateFieldDefinition(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/definitions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a custom field definition")
    public ResponseEntity<Void> deleteDefinition(@PathVariable UUID id) {
        customFieldService.deleteFieldDefinition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/values")
    @Operation(summary = "Set a custom field value for an entity")
    public ResponseEntity<FieldValueResponse> setFieldValue(@RequestBody @Valid SetFieldValueRequest request) {
        FieldValueResponse response = customFieldService.setFieldValue(
                request.getFieldDefinitionId(),
                request.getEntityId(),
                request.getEntityType(),
                request.getValue()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/values/{entityId}")
    @Operation(summary = "Get all custom field values for an entity")
    public ResponseEntity<List<FieldValueResponse>> getFieldValues(
            @PathVariable UUID entityId,
            @RequestParam String entityType) {
        List<FieldValueResponse> values = customFieldService.getFieldValues(entityId, entityType);
        return ResponseEntity.ok(values);
    }

    @DeleteMapping("/values/{defId}/{entityId}")
    @Operation(summary = "Remove a custom field value")
    public ResponseEntity<Void> deleteFieldValue(
            @PathVariable UUID defId,
            @PathVariable UUID entityId) {
        customFieldService.deleteFieldValue(defId, entityId);
        return ResponseEntity.noContent().build();
    }
}
