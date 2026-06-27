package com.interview_platform_backend.interview_platform_backend.reportbuilder.service;

import com.interview_platform_backend.interview_platform_backend.reportbuilder.dto.ReportTemplate;
import com.interview_platform_backend.interview_platform_backend.reportbuilder.dto.ReportWidget;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ReportBuilderService {

    private static final Logger log = LoggerFactory.getLogger(ReportBuilderService.class);

    // In-memory store (production would use DB)
    private final Map<UUID, ReportTemplate> templateStore = Collections.synchronizedMap(new HashMap<>());

    public ReportTemplate createTemplate(ReportTemplate template) {
        if (template.getId() == null) {
            template.setId(UUID.randomUUID());
        }
        template.setLastGenerated(null);
        templateStore.put(template.getId(), template);
        log.info("Created report template: {} ({})", template.getName(), template.getId());
        return template;
    }

    public ReportTemplate updateTemplate(UUID templateId, ReportTemplate updated) {
        ReportTemplate existing = templateStore.get(templateId);
        if (existing == null) throw new RuntimeException("Template not found: " + templateId);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setWidgets(updated.getWidgets());
        existing.setLayout(updated.getLayout());
        existing.setFilters(updated.getFilters());
        existing.setSchedule(updated.getSchedule());
        return existing;
    }

    public void deleteTemplate(UUID templateId) {
        templateStore.remove(templateId);
        log.info("Deleted report template: {}", templateId);
    }

    public ReportTemplate getTemplate(UUID templateId) {
        return templateStore.get(templateId);
    }

    public List<ReportTemplate> listTemplates() {
        return new ArrayList<>(templateStore.values());
    }

    public Map<String, Object> generateReport(UUID templateId) {
        ReportTemplate template = templateStore.get(templateId);
        if (template == null) throw new RuntimeException("Template not found: " + templateId);

        log.info("Generating report for template: {} ({})", template.getName(), templateId);

        // Update last generated timestamp
        template.setLastGenerated(Instant.now());

        // Generate mock data for each widget
        Map<String, Object> reportData = new LinkedHashMap<>();
        reportData.put("templateId", templateId.toString());
        reportData.put("templateName", template.getName());
        reportData.put("generatedAt", Instant.now().toString());
        reportData.put("layout", template.getLayout());

        List<Map<String, Object>> widgetData = new ArrayList<>();
        if (template.getWidgets() != null) {
            for (ReportWidget widget : template.getWidgets()) {
                Map<String, Object> data = generateWidgetData(widget);
                widgetData.add(data);
            }
        }

        reportData.put("widgets", widgetData);
        reportData.put("filters", template.getFilters());
        return reportData;
    }

    private Map<String, Object> generateWidgetData(ReportWidget widget) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("widgetId", widget.getId());
        data.put("title", widget.getTitle());
        data.put("type", widget.getType().name());
        data.put("position", widget.getPosition());

        // Generate sample data based on widget type
        switch (widget.getType()) {
            case BAR_CHART -> data.put("data", Map.of(
                    "labels", List.of("Jan", "Feb", "Mar", "Apr", "May"),
                    "values", List.of(45, 62, 78, 55, 90)
            ));
            case LINE_CHART -> data.put("data", Map.of(
                    "labels", List.of("Week 1", "Week 2", "Week 3", "Week 4"),
                    "series", List.of(
                            Map.of("name", "Applications", "values", List.of(120, 145, 132, 168)),
                            Map.of("name", "Interviews", "values", List.of(40, 55, 48, 62))
                    )
            ));
            case PIE_CHART -> data.put("data", Map.of(
                    "labels", List.of("Hired", "Rejected", "In Progress", "Withdrawn"),
                    "values", List.of(25, 35, 30, 10)
            ));
            case TABLE -> data.put("data", Map.of(
                    "columns", List.of("Candidate", "Position", "Stage", "Score"),
                    "rows", List.of(
                            List.of("John Doe", "Senior Engineer", "Final", "92"),
                            List.of("Jane Smith", "Product Manager", "Technical", "87"),
                            List.of("Bob Wilson", "Designer", "Phone Screen", "78")
                    )
            ));
            case METRIC_CARD -> data.put("data", Map.of(
                    "value", 156,
                    "label", "Total Applications",
                    "change", "+12%",
                    "trend", "up"
            ));
            case FUNNEL -> data.put("data", Map.of(
                    "stages", List.of(
                            Map.of("name", "Applied", "count", 500),
                            Map.of("name", "Screened", "count", 300),
                            Map.of("name", "Interviewed", "count", 120),
                            Map.of("name", "Offered", "count", 40),
                            Map.of("name", "Hired", "count", 25)
                    )
            ));
            case HEATMAP -> data.put("data", Map.of(
                    "xLabels", List.of("Mon", "Tue", "Wed", "Thu", "Fri"),
                    "yLabels", List.of("9AM", "12PM", "3PM", "6PM"),
                    "values", List.of(
                            List.of(3, 7, 5, 2, 8),
                            List.of(6, 4, 9, 3, 5),
                            List.of(2, 8, 4, 7, 3),
                            List.of(1, 3, 2, 5, 1)
                    )
            ));
        }

        return data;
    }
}
