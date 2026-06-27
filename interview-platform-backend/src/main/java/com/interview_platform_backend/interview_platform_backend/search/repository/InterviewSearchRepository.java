package com.interview_platform_backend.interview_platform_backend.search.repository;

import com.interview_platform_backend.interview_platform_backend.search.document.InterviewDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSearchRepository extends ElasticsearchRepository<InterviewDocument, String> {

    Page<InterviewDocument> findByStatus(String status, Pageable pageable);

    Page<InterviewDocument> findByType(String type, Pageable pageable);

    Page<InterviewDocument> findByCandidateEmail(String email, Pageable pageable);

    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"description\", \"candidate.name^2\", \"candidate.email\"]}}")
    Page<InterviewDocument> searchByQuery(String query, Pageable pageable);

    List<InterviewDocument> findByOrganizationId(String organizationId);
}
