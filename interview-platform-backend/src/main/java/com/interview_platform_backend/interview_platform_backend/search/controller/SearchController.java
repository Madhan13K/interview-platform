package com.interview_platform_backend.interview_platform_backend.search.controller;

import com.interview_platform_backend.interview_platform_backend.search.document.CandidateDocument;
import com.interview_platform_backend.interview_platform_backend.search.document.InterviewDocument;
import com.interview_platform_backend.interview_platform_backend.search.dto.SearchRequest;
import com.interview_platform_backend.interview_platform_backend.search.dto.SearchResponse;
import com.interview_platform_backend.interview_platform_backend.search.service.SearchIndexService;
import com.interview_platform_backend.interview_platform_backend.search.service.SearchQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search (CQRS)", description = "Full-text search powered by Elasticsearch. Read model is synced from Postgres via Kafka events.")
@ConditionalOnProperty(name = "app.search.enabled", havingValue = "true", matchIfMissing = false)
public class SearchController {

    private final SearchQueryService searchQueryService;
    private final SearchIndexService searchIndexService;

    public SearchController(SearchQueryService searchQueryService, SearchIndexService searchIndexService) {
        this.searchQueryService = searchQueryService;
        this.searchIndexService = searchIndexService;
    }

    @Operation(summary = "Search interviews", description = "Full-text search across interview titles, descriptions, candidate names/emails")
    @GetMapping("/interviews")
    public ResponseEntity<SearchResponse<InterviewDocument>> searchInterviews(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        SearchRequest request = SearchRequest.builder()
                .query(query).status(status).type(type).page(page).size(size).build();
        return ResponseEntity.ok(searchQueryService.searchInterviews(request));
    }

    @Operation(summary = "Search candidates", description = "Full-text search across candidate names, emails, skills, companies")
    @GetMapping("/candidates")
    public ResponseEntity<SearchResponse<CandidateDocument>> searchCandidates(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        SearchRequest request = SearchRequest.builder()
                .query(query).status(status).page(page).size(size).build();
        return ResponseEntity.ok(searchQueryService.searchCandidates(request));
    }

    @Operation(summary = "Reindex all data", description = "Trigger a full reindex of all interviews and candidates into Elasticsearch. Admin only.")
    @PostMapping("/reindex")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> reindexAll() {
        searchIndexService.reindexAllInterviews();
        searchIndexService.reindexAllCandidates();
        return ResponseEntity.ok("Reindex triggered for all interviews and candidates");
    }
}
