package com.interview_platform_backend.interview_platform_backend.workflowbuilder.service;

import com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto.WorkflowCanvas;
import com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto.WorkflowNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class WorkflowBuilderService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowBuilderService.class);

    // In-memory store (production would use DB)
    private final Map<UUID, WorkflowCanvas> canvasStore = Collections.synchronizedMap(new HashMap<>());

    public WorkflowCanvas createCanvas(String name, String description) {
        WorkflowCanvas canvas = WorkflowCanvas.builder()
                .id(UUID.randomUUID())
                .name(name)
                .description(description)
                .nodes(new ArrayList<>())
                .edges(new ArrayList<>())
                .isPublished(false)
                .version(1)
                .lastModified(Instant.now())
                .build();
        canvasStore.put(canvas.getId(), canvas);
        log.info("Created workflow canvas: {} ({})", name, canvas.getId());
        return canvas;
    }

    public WorkflowCanvas updateCanvas(UUID canvasId, List<WorkflowNode> nodes, List<Map<String, String>> edges) {
        WorkflowCanvas canvas = canvasStore.get(canvasId);
        if (canvas == null) throw new RuntimeException("Canvas not found: " + canvasId);
        canvas.setNodes(nodes);
        canvas.setEdges(edges);
        canvas.setVersion(canvas.getVersion() + 1);
        canvas.setLastModified(Instant.now());
        return canvas;
    }

    public WorkflowCanvas getCanvas(UUID canvasId) {
        return canvasStore.get(canvasId);
    }

    public List<WorkflowCanvas> listCanvases() {
        return new ArrayList<>(canvasStore.values());
    }

    public WorkflowCanvas publishCanvas(UUID canvasId) {
        WorkflowCanvas canvas = canvasStore.get(canvasId);
        if (canvas == null) throw new RuntimeException("Canvas not found: " + canvasId);
        canvas.setPublished(true);
        canvas.setLastModified(Instant.now());
        log.info("Published workflow canvas: {}", canvasId);
        return canvas;
    }

    public void deleteCanvas(UUID canvasId) {
        canvasStore.remove(canvasId);
    }

    public Map<String, Object> validateCanvas(UUID canvasId) {
        WorkflowCanvas canvas = canvasStore.get(canvasId);
        if (canvas == null) return Map.of("valid", false, "error", "Canvas not found");

        List<String> errors = new ArrayList<>();
        if (canvas.getNodes() == null || canvas.getNodes().isEmpty()) {
            errors.add("No nodes defined");
        } else {
            boolean hasTrigger = canvas.getNodes().stream()
                    .anyMatch(n -> n.getType() == WorkflowNode.NodeType.TRIGGER);
            if (!hasTrigger) errors.add("Missing TRIGGER node");

            boolean hasEnd = canvas.getNodes().stream()
                    .anyMatch(n -> n.getType() == WorkflowNode.NodeType.END);
            if (!hasEnd) errors.add("Missing END node");
        }

        return Map.of(
                "valid", errors.isEmpty(),
                "errors", errors,
                "nodeCount", canvas.getNodes() != null ? canvas.getNodes().size() : 0
        );
    }
}
