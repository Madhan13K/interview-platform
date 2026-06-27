package com.interview_platform_backend.interview_platform_backend.calibration.repository;

import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalibrationReportRepository extends JpaRepository<CalibrationReport, UUID> {

    Optional<CalibrationReport> findTopByInterviewerIdOrderByCalculatedAtDesc(UUID interviewerId);

    List<CalibrationReport> findByOrganizationId(UUID organizationId);

    List<CalibrationReport> findByInterviewerIdIn(List<UUID> interviewerIds);
}
