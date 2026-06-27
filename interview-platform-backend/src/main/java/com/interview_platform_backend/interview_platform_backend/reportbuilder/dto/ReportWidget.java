package com.interview_platform_backend.interview_platform_backend.reportbuilder.dto;

import lombok.Data;

import java.util.Map;

@Data
public class ReportWidget {

    public enum WidgetType {
        BAR_CHART, LINE_CHART, PIE_CHART, TABLE, METRIC_CARD, FUNNEL, HEATMAP
    }

    private String id;
    private WidgetType type;
    private String title;
    private String dataSource;
    private Map<String, Object> query;
    private Map<String, Integer> position; // x, y, w, h
    private Map<String, Object> config;
}
