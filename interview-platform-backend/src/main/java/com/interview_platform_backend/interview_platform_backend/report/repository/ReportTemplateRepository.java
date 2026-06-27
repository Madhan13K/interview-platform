package com.interview_platform_backend.interview_platform_backend.report.repository;

import com.interview_platform_backend.interview_platform_backend.report.entity.ReportTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, UUID> {
    Page<ReportTemplate> findByCreatedById(UUID userId, Pageable pageable);
    Page<ReportTemplate> findByIsPublicTrueOrCreatedById(UUID userId, Pageable pageable);
    List<ReportTemplate> findByEntityType(String entityType);
}
