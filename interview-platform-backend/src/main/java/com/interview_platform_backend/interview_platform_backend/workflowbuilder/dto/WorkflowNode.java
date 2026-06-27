package com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class WorkflowNode {

    public enum NodeType {
        TRIGGER, CONDITION, ACTION, DELAY, BRANCH, END
    }

    private String id;
    private NodeType type;
    private String label;
    private Map<String, Integer> position; // x, y
    private Map<String, Object> config;
    private List<String> connections; // target node ids
}
