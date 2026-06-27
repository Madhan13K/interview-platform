package com.interview_platform_backend.interview_platform_backend.report.repository;

import com.interview_platform_backend.interview_platform_backend.report.entity.ReportSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportScheduleRepository extends JpaRepository<ReportSchedule, UUID> {
    List<ReportSchedule> findByTemplateId(UUID templateId);
    List<ReportSchedule> findByEnabledTrueAndNextRunAtBefore(Instant now);
}
