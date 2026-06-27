package com.interview_platform_backend.interview_platform_backend.search.repository;

import com.interview_platform_backend.interview_platform_backend.search.document.CandidateDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateSearchRepository extends ElasticsearchRepository<CandidateDocument, String> {

    Page<CandidateDocument> findByStatus(String status, Pageable pageable);

    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"fullName^3\", \"email^2\", \"skills\", \"company\", \"bio\"]}}")
    Page<CandidateDocument> searchByQuery(String query, Pageable pageable);

    List<CandidateDocument> findBySkillsContaining(String skill);

    List<CandidateDocument> findByOrganizationId(String organizationId);
}
