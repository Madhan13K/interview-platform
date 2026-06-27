package com.interview_platform_backend.interview_platform_backend.workflowbuilder.controller;

import com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto.WorkflowCanvas;
import com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto.WorkflowNode;
import com.interview_platform_backend.interview_platform_backend.workflowbuilder.service.WorkflowBuilderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow-builder")
@PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
public class WorkflowBuilderController {

    private final WorkflowBuilderService workflowBuilderService;

    public WorkflowBuilderController(WorkflowBuilderService workflowBuilderService) {
        this.workflowBuilderService = workflowBuilderService;
    }

    @PostMapping
    public ResponseEntity<WorkflowCanvas> createCanvas(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        WorkflowCanvas canvas = workflowBuilderService.createCanvas(name, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(canvas);
    }

    @GetMapping
    public ResponseEntity<List<WorkflowCanvas>> listCanvases() {
        return ResponseEntity.ok(workflowBuilderService.listCanvases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowCanvas> getCanvas(@PathVariable UUID id) {
        WorkflowCanvas canvas = workflowBuilderService.getCanvas(id);
        if (canvas == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(canvas);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowCanvas> updateCanvas(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<WorkflowNode> nodes = (List<WorkflowNode>) body.get("nodes");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> edges = (List<Map<String, String>>) body.get("edges");
        WorkflowCanvas canvas = workflowBuilderService.updateCanvas(id, nodes, edges);
        return ResponseEntity.ok(canvas);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<WorkflowCanvas> publishCanvas(@PathVariable UUID id) {
        WorkflowCanvas canvas = workflowBuilderService.publishCanvas(id);
        return ResponseEntity.ok(canvas);
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<Map<String, Object>> validateCanvas(@PathVariable UUID id) {
        Map<String, Object> result = workflowBuilderService.validateCanvas(id);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCanvas(@PathVariable UUID id) {
        workflowBuilderService.deleteCanvas(id);
        return ResponseEntity.noContent().build();
    }
}
