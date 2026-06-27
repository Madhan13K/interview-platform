package com.interview_platform_backend.interview_platform_backend.search.service;

import com.interview_platform_backend.interview_platform_backend.search.document.CandidateDocument;
import com.interview_platform_backend.interview_platform_backend.search.document.InterviewDocument;
import com.interview_platform_backend.interview_platform_backend.search.dto.SearchRequest;
import com.interview_platform_backend.interview_platform_backend.search.dto.SearchResponse;
import com.interview_platform_backend.interview_platform_backend.search.repository.CandidateSearchRepository;
import com.interview_platform_backend.interview_platform_backend.search.repository.InterviewSearchRepository;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.search.enabled", havingValue = "true", matchIfMissing = false)
public class SearchQueryService {

    private final InterviewSearchRepository interviewSearchRepository;
    private final CandidateSearchRepository candidateSearchRepository;

    public SearchQueryService(InterviewSearchRepository interviewSearchRepository,
                              CandidateSearchRepository candidateSearchRepository) {
        this.interviewSearchRepository = interviewSearchRepository;
        this.candidateSearchRepository = candidateSearchRepository;
    }

    @WithSpan("search-interviews")
    public SearchResponse<InterviewDocument> searchInterviews(SearchRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<InterviewDocument> results;

        if (request.getQuery() != null && !request.getQuery().isBlank()) {
            results = interviewSearchRepository.searchByQuery(request.getQuery(), pageable);
        } else if (request.getStatus() != null) {
            results = interviewSearchRepository.findByStatus(request.getStatus(), pageable);
        } else if (request.getType() != null) {
            results = interviewSearchRepository.findByType(request.getType(), pageable);
        } else {
            results = interviewSearchRepository.findAll(pageable);
        }

        return SearchResponse.<InterviewDocument>builder()
                .content(results.getContent())
                .totalElements(results.getTotalElements())
                .totalPages(results.getTotalPages())
                .page(results.getNumber())
                .size(results.getSize())
                .build();
    }

    @WithSpan("search-candidates")
    public SearchResponse<CandidateDocument> searchCandidates(SearchRequest request) {
        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<CandidateDocument> results;

        if (request.getQuery() != null && !request.getQuery().isBlank()) {
            results = candidateSearchRepository.searchByQuery(request.getQuery(), pageable);
        } else if (request.getStatus() != null) {
            results = candidateSearchRepository.findByStatus(request.getStatus(), pageable);
        } else {
            results = candidateSearchRepository.findAll(pageable);
        }

        return SearchResponse.<CandidateDocument>builder()
                .content(results.getContent())
                .totalElements(results.getTotalElements())
                .totalPages(results.getTotalPages())
                .page(results.getNumber())
                .size(results.getSize())
                .build();
    }
}
