package com.interview_platform_backend.interview_platform_backend.calibration;

import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport;
import com.interview_platform_backend.interview_platform_backend.calibration.entity.CalibrationReport.BiasIndicator;
import com.interview_platform_backend.interview_platform_backend.calibration.repository.CalibrationReportRepository;
import com.interview_platform_backend.interview_platform_backend.calibration.service.CalibrationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Calibration Service Tests")
class CalibrationServiceTest {

    @Mock private CalibrationReportRepository calibrationRepository;
    @InjectMocks private CalibrationService service;

    @Test
    @DisplayName("should generate calibration report")
    void generateReport() {
        UUID interviewerId = UUID.randomUUID();

        when(calibrationRepository.save(any(CalibrationReport.class))).thenAnswer(invocation -> {
            CalibrationReport report = invocation.getArgument(0);
            report.setId(UUID.randomUUID());
            return report;
        });

        var report = service.generateReport(interviewerId);
        assertThat(report).isNotNull();
        assertThat(report.getInterviewerId()).isEqualTo(interviewerId);
        assertThat(report.getCalibrationScore()).isEqualTo(75.0);
        assertThat(report.getBiasIndicator()).isEqualTo(BiasIndicator.NEUTRAL);
        verify(calibrationRepository).save(any(CalibrationReport.class));
    }

    @Test
    @DisplayName("should detect bias indicator")
    void detectBias() {
        UUID interviewerId = UUID.randomUUID();
        CalibrationReport report = CalibrationReport.builder()
                .interviewerId(interviewerId)
                .biasIndicator(BiasIndicator.LENIENT)
                .calculatedAt(Instant.now())
                .build();

        when(calibrationRepository.findTopByInterviewerIdOrderByCalculatedAtDesc(interviewerId))
                .thenReturn(Optional.of(report));

        var result = service.detectBias(interviewerId);
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(BiasIndicator.LENIENT);
    }

    @Test
    @DisplayName("should return NEUTRAL when no reports exist")
    void detectBiasReturnsNeutralWhenEmpty() {
        UUID interviewerId = UUID.randomUUID();

        when(calibrationRepository.findTopByInterviewerIdOrderByCalculatedAtDesc(interviewerId))
                .thenReturn(Optional.empty());

        var result = service.detectBias(interviewerId);
        assertThat(result).isEqualTo(BiasIndicator.NEUTRAL);
    }
}
