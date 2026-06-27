package com.interview_platform_backend.interview_platform_backend.competitiveintel.service;

import com.interview_platform_backend.interview_platform_backend.competitiveintel.entity.CompetitorData;
import com.interview_platform_backend.interview_platform_backend.competitiveintel.entity.CompetitorData.DataType;
import com.interview_platform_backend.interview_platform_backend.competitiveintel.repository.CompetitorDataRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompetitiveIntelService {

    private static final Logger log = LoggerFactory.getLogger(CompetitiveIntelService.class);

    private final CompetitorDataRepository competitorDataRepository;

    @Transactional
    public CompetitorData addDataPoint(CompetitorData data) {
        log.info("Adding competitor data point: {} - {} for [{}]",
                data.getCompetitorName(), data.getDataType(), data.getRole());
        data.setCollectedAt(Instant.now());
        return competitorDataRepository.save(data);
    }

    @Transactional(readOnly = true)
    public List<CompetitorData> getByCompetitor(String name) {
        log.debug("Fetching all data for competitor [{}]", name);
        return competitorDataRepository.findByCompetitorName(name);
    }

    @Transactional(readOnly = true)
    public List<CompetitorData> compareSalaries(String role, String location) {
        log.info("Comparing salaries for role [{}] in location [{}]", role, location);
        if (location != null && !location.isBlank()) {
            return competitorDataRepository.findByDataTypeAndRoleAndLocation(
                    DataType.SALARY_RANGE, role, location);
        }
        return competitorDataRepository.findByDataTypeAndRole(DataType.SALARY_RANGE, role);
    }

    @Transactional(readOnly = true)
    public List<CompetitorData> getHiringTrends(String competitor) {
        log.debug("Fetching hiring trends for competitor [{}]", competitor);
        return competitorDataRepository.findByCompetitorNameAndDataType(competitor, DataType.HIRING_VOLUME);
    }

    @Transactional(readOnly = true)
    public List<CompetitorData> getMarketBenchmarks(String role) {
        log.info("Fetching market benchmarks for role [{}]", role);
        return competitorDataRepository.findByDataTypeAndRole(DataType.SALARY_RANGE, role);
    }
}
