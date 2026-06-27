package com.interview_platform_backend.interview_platform_backend.calibration.service;

import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport;
import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport.BiasIndicator;
import com.interview_platform_backend.interview_platform_backend.calibration.repository.CalibrationReportRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CalibrationService {

    private static final Logger log = LoggerFactory.getLogger(CalibrationService.class);

    private final CalibrationReportRepository calibrationRepository;

    public CalibrationReport generateReport(UUID interviewerId) {
        log.info("Generating calibration report for interviewer [{}]", interviewerId);

        CalibrationReport report = CalibrationReport.builder()
                .interviewerId(interviewerId)
                .organizationId(UUID.randomUUID())
                .avgRating(3.5)
                .totalInterviews(0)
                .ratingDistribution("{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}")
                .biasIndicator(BiasIndicator.NEUTRAL)
                .calibrationScore(75.0)
                .topStrength("Technical assessment")
                .topWeakness("Time management")
                .comparedToPeers(0.0)
                .calculatedAt(Instant.now())
                .build();

        CalibrationReport saved = calibrationRepository.save(report);
        log.info("Calibration report [{}] generated for interviewer [{}]", saved.getId(), interviewerId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<CalibrationReport> compareInterviewers(List<UUID> interviewerIds) {
        log.info("Comparing {} interviewers", interviewerIds.size());
        return calibrationRepository.findByInterviewerIdIn(interviewerIds);
    }

    public BiasIndicator detectBias(UUID interviewerId) {
        log.info("Detecting bias for interviewer [{}]", interviewerId);

        return calibrationRepository.findTopByInterviewerIdOrderByCalculatedAtDesc(interviewerId)
                .map(CalibrationReport::getBiasIndicator)
                .orElse(BiasIndicator.NEUTRAL);
    }

    @Transactional(readOnly = true)
    public List<CalibrationReport> getOrgCalibration(UUID orgId) {
        log.debug("Fetching calibration reports for org [{}]", orgId);
        return calibrationRepository.findByOrganizationId(orgId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getInflationDeflation(UUID orgId) {
        log.info("Calculating inflation/deflation for org [{}]", orgId);

        List<CalibrationReport> reports = calibrationRepository.findByOrganizationId(orgId);

        if (reports.isEmpty()) {
            return Map.of("inflationRate", 0.0, "deflationRate", 0.0, "sampleSize", 0);
        }

        double avgCalibration = reports.stream()
                .mapToDouble(CalibrationReport::getCalibrationScore)
                .average()
                .orElse(0.0);

        long lenient = reports.stream()
                .filter(r -> r.getBiasIndicator() == BiasIndicator.LENIENT)
                .count();
        long strict = reports.stream()
                .filter(r -> r.getBiasIndicator() == BiasIndicator.STRICT)
                .count();

        return Map.of(
                "inflationRate", (double) lenient / reports.size() * 100,
                "deflationRate", (double) strict / reports.size() * 100,
                "avgCalibrationScore", avgCalibration,
                "sampleSize", reports.size()
        );
    }
}
