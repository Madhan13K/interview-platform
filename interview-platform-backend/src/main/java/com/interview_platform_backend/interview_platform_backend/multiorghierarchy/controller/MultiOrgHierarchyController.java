package com.interview_platform_backend.interview_platform_backend.multiorghierarchy.controller;

import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity.OrgHierarchy;
import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.entity.OrgHierarchy.OrgRelationshipType;
import com.interview_platform_backend.interview_platform_backend.multiorghierarchy.service.MultiOrgHierarchyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/org-hierarchy")
@Tag(name = "Multi-Org Hierarchy", description = "Manage multi-organization hierarchy relationships")
@PreAuthorize("hasRole('ADMIN')")
public class MultiOrgHierarchyController {

    private final MultiOrgHierarchyService multiOrgHierarchyService;

    public MultiOrgHierarchyController(MultiOrgHierarchyService multiOrgHierarchyService) {
        this.multiOrgHierarchyService = multiOrgHierarchyService;
    }

    @Operation(summary = "Create a new organization relationship")
    @PostMapping
    public ResponseEntity<OrgHierarchy> createRelationship(
            @RequestParam UUID parentId,
            @RequestParam UUID childId,
            @RequestParam OrgRelationshipType type) {
        OrgHierarchy created = multiOrgHierarchyService.createRelationship(parentId, childId, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Get child organizations")
    @GetMapping("/{parentOrgId}/children")
    public ResponseEntity<List<OrgHierarchy>> getChildren(@PathVariable UUID parentOrgId) {
        return ResponseEntity.ok(multiOrgHierarchyService.getChildren(parentOrgId));
    }

    @Operation(summary = "Get parent organization")
    @GetMapping("/{childOrgId}/parent")
    public ResponseEntity<OrgHierarchy> getParent(@PathVariable UUID childOrgId) {
        Optional<OrgHierarchy> parent = multiOrgHierarchyService.getParent(childOrgId);
        return parent.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get full hierarchy tree from root")
    @GetMapping("/{rootOrgId}/full")
    public ResponseEntity<List<OrgHierarchy>> getFullHierarchy(@PathVariable UUID rootOrgId) {
        return ResponseEntity.ok(multiOrgHierarchyService.getFullHierarchy(rootOrgId));
    }

    @Operation(summary = "Get consolidated report for parent org")
    @GetMapping("/{parentOrgId}/report")
    public ResponseEntity<Map<String, Object>> getConsolidatedReport(@PathVariable UUID parentOrgId) {
        return ResponseEntity.ok(multiOrgHierarchyService.getConsolidatedReport(parentOrgId));
    }

    @Operation(summary = "Share a template between organizations")
    @PostMapping("/share-template")
    public ResponseEntity<Map<String, Object>> shareTemplate(
            @RequestParam UUID templateId,
            @RequestParam UUID fromOrg,
            @RequestParam UUID toOrg) {
        return ResponseEntity.ok(multiOrgHierarchyService.shareTemplate(templateId, fromOrg, toOrg));
    }
}
