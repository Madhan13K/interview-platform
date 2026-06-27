package com.interview_platform_backend.interview_platform_backend.graphqlfederation.controller;

import com.interview_platform_backend.interview_platform_backend.graphqlfederation.resolver.InterviewResolver;
import com.interview_platform_backend.interview_platform_backend.graphqlfederation.schema.InterviewSchema;
import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/graphql-federation")
public class GraphQLFederationController {
    private final InterviewSchema schema;
    private final InterviewResolver resolver;

    public GraphQLFederationController(InterviewSchema schema, InterviewResolver resolver) {
        this.schema = schema;
        this.resolver = resolver;
    }

    @GetMapping("/schema")
    public ResponseEntity<Map<String, Object>> getSchema() {
        return ResponseEntity.ok(schema.getSchemaDefinition());
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<Interview>> queryInterviews(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(resolver.getInterviews(page, size));
    }

    @GetMapping("/interviews/{id}")
    public ResponseEntity<?> queryInterview(@PathVariable UUID id) {
        return resolver.getInterview(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
