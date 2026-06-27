package com.interview_platform_backend.interview_platform_backend.report.repository;

import com.interview_platform_backend.interview_platform_backend.report.entity.GeneratedReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GeneratedReportRepository extends JpaRepository<GeneratedReport, UUID> {
    Page<GeneratedReport> findByTemplateId(UUID templateId, Pageable pageable);
    Page<GeneratedReport> findByGeneratedById(UUID userId, Pageable pageable);
    List<GeneratedReport> findByStatus(String status);
}
