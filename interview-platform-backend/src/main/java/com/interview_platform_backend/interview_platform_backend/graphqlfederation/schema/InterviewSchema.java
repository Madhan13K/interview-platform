package com.interview_platform_backend.interview_platform_backend.graphqlfederation.schema;

import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class InterviewSchema {
    public Map<String, Object> getSchemaDefinition() {
        return Map.of(
            "types", List.of(
                Map.of("name", "Interview", "fields", List.of("id", "title", "status", "type", "candidate", "scheduledBy", "startTime", "endTime", "feedback")),
                Map.of("name", "Candidate", "fields", List.of("id", "firstName", "lastName", "email", "interviews", "pipeline")),
                Map.of("name", "Feedback", "fields", List.of("id", "rating", "recommendation", "strengths", "weaknesses")),
                Map.of("name", "JobPosition", "fields", List.of("id", "title", "department", "status", "interviews"))
            ),
            "queries", List.of("interviews", "interview(id)", "candidates", "candidate(id)", "jobPositions"),
            "mutations", List.of("createInterview", "updateInterviewStatus", "submitFeedback"),
            "subscriptions", List.of("interviewUpdated", "newFeedback")
        );
    }
}
