package com.interview_platform_backend.interview_platform_backend.analytics.service;

import com.interview_platform_backend.interview_platform_backend.analytics.dto.FunnelOverviewResponse;
import com.interview_platform_backend.interview_platform_backend.analytics.dto.StageDropoutResponse;
import com.interview_platform_backend.interview_platform_backend.analytics.entity.HiringFunnelMetric;
import com.interview_platform_backend.interview_platform_backend.analytics.entity.StageDropoutAnalysis;
import com.interview_platform_backend.interview_platform_backend.analytics.repository.HiringFunnelMetricRepository;
import com.interview_platform_backend.interview_platform_backend.analytics.repository.StageDropoutAnalysisRepository;
import com.interview_platform_backend.interview_platform_backend.pipeline.entity.*;
import com.interview_platform_backend.interview_platform_backend.pipeline.repository.CandidatePipelineRepository;
import com.interview_platform_backend.interview_platform_backend.pipeline.repository.InterviewPipelineRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HiringAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(HiringAnalyticsService.class);

    private final HiringFunnelMetricRepository funnelMetricRepository;
    private final StageDropoutAnalysisRepository dropoutRepository;
    private final CandidatePipelineRepository candidatePipelineRepository;
    private final InterviewPipelineRepository interviewPipelineRepository;

    public HiringAnalyticsService(HiringFunnelMetricRepository funnelMetricRepository,
                                  StageDropoutAnalysisRepository dropoutRepository,
                                  CandidatePipelineRepository candidatePipelineRepository,
                                  InterviewPipelineRepository interviewPipelineRepository) {
        this.funnelMetricRepository = funnelMetricRepository;
        this.dropoutRepository = dropoutRepository;
        this.candidatePipelineRepository = candidatePipelineRepository;
        this.interviewPipelineRepository = interviewPipelineRepository;
    }

    /**
     * Get funnel overview for an organization by period type.
     */
    public FunnelOverviewResponse getFunnelOverview(UUID orgId, String periodType) {
        List<HiringFunnelMetric> metrics = funnelMetricRepository.findByOrganizationIdAndPeriodType(orgId, periodType);

        if (metrics.isEmpty()) {
            return FunnelOverviewResponse.builder()
                    .totalCandidates(0)
                    .totalHired(0)
                    .totalRejected(0)
                    .totalWithdrawn(0)
                    .overallConversion(BigDecimal.ZERO)
                    .avgTimeToHire(BigDecimal.ZERO)
                    .stageBreakdown(Collections.emptyList())
                    .conversionRates(Collections.emptyMap())
                    .build();
        }

        // Aggregate across all pipelines for the given period type
        int totalCandidates = metrics.stream().mapToInt(HiringFunnelMetric::getTotalCandidates).sum();
        int totalHired = metrics.stream().mapToInt(HiringFunnelMetric::getTotalHired).sum();
        int totalRejected = metrics.stream().mapToInt(HiringFunnelMetric::getTotalRejected).sum();
        int totalWithdrawn = metrics.stream().mapToInt(HiringFunnelMetric::getTotalWithdrawn).sum();

        BigDecimal avgConversion = metrics.stream()
                .map(HiringFunnelMetric::getOverallConversion)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(metrics.size()), 2, RoundingMode.HALF_UP);

        BigDecimal avgTimeToHire = metrics.stream()
                .map(HiringFunnelMetric::getAvgTimeToHire)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(metrics.size()), 2, RoundingMode.HALF_UP);

        // Build stage breakdown
        List<FunnelOverviewResponse.StageCount> stageBreakdown = List.of(
                new FunnelOverviewResponse.StageCount("Screening", metrics.stream().mapToInt(HiringFunnelMetric::getStageScreening).sum()),
                new FunnelOverviewResponse.StageCount("Technical", metrics.stream().mapToInt(HiringFunnelMetric::getStageTechnical).sum()),
                new FunnelOverviewResponse.StageCount("HR", metrics.stream().mapToInt(HiringFunnelMetric::getStageHr).sum()),
                new FunnelOverviewResponse.StageCount("Final", metrics.stream().mapToInt(HiringFunnelMetric::getStageFinal).sum()),
                new FunnelOverviewResponse.StageCount("Offer", metrics.stream().mapToInt(HiringFunnelMetric::getStageOffer).sum())
        );

        // Build conversion rates map from the latest metric
        HiringFunnelMetric latest = metrics.get(0);
        Map<String, BigDecimal> conversionRates = new LinkedHashMap<>();
        conversionRates.put("screeningToTechnical", latest.getScreeningToTechnical());
        conversionRates.put("technicalToHr", latest.getTechnicalToHr());
        conversionRates.put("hrToFinal", latest.getHrToFinal());
        conversionRates.put("finalToOffer", latest.getFinalToOffer());
        conversionRates.put("offerToHired", latest.getOfferToHired());

        return FunnelOverviewResponse.builder()
                .totalCandidates(totalCandidates)
                .totalHired(totalHired)
                .totalRejected(totalRejected)
                .totalWithdrawn(totalWithdrawn)
                .overallConversion(avgConversion)
                .avgTimeToHire(avgTimeToHire)
                .stageBreakdown(stageBreakdown)
                .conversionRates(conversionRates)
                .build();
    }

    /**
     * Get funnel overview for a specific pipeline.
     */
    public FunnelOverviewResponse getPipelineFunnel(UUID pipelineId, String periodType) {
        List<HiringFunnelMetric> metrics = funnelMetricRepository.findByPipelineIdAndPeriodType(pipelineId, periodType);

        if (metrics.isEmpty()) {
            return FunnelOverviewResponse.builder()
                    .totalCandidates(0)
                    .totalHired(0)
                    .totalRejected(0)
                    .totalWithdrawn(0)
                    .overallConversion(BigDecimal.ZERO)
                    .avgTimeToHire(BigDecimal.ZERO)
                    .stageBreakdown(Collections.emptyList())
                    .conversionRates(Collections.emptyMap())
                    .build();
        }

        HiringFunnelMetric metric = metrics.get(0);

        List<FunnelOverviewResponse.StageCount> stageBreakdown = List.of(
                new FunnelOverviewResponse.StageCount("Screening", metric.getStageScreening()),
                new FunnelOverviewResponse.StageCount("Technical", metric.getStageTechnical()),
                new FunnelOverviewResponse.StageCount("HR", metric.getStageHr()),
                new FunnelOverviewResponse.StageCount("Final", metric.getStageFinal()),
                new FunnelOverviewResponse.StageCount("Offer", metric.getStageOffer())
        );

        Map<String, BigDecimal> conversionRates = new LinkedHashMap<>();
        conversionRates.put("screeningToTechnical", metric.getScreeningToTechnical());
        conversionRates.put("technicalToHr", metric.getTechnicalToHr());
        conversionRates.put("hrToFinal", metric.getHrToFinal());
        conversionRates.put("finalToOffer", metric.getFinalToOffer());
        conversionRates.put("offerToHired", metric.getOfferToHired());

        return FunnelOverviewResponse.builder()
                .totalCandidates(metric.getTotalCandidates())
                .totalHired(metric.getTotalHired())
                .totalRejected(metric.getTotalRejected())
                .totalWithdrawn(metric.getTotalWithdrawn())
                .overallConversion(metric.getOverallConversion())
                .avgTimeToHire(metric.getAvgTimeToHire())
                .stageBreakdown(stageBreakdown)
                .conversionRates(conversionRates)
                .build();
    }

    /**
     * Get conversion rates for a specific pipeline within a date range.
     */
    public Map<String, BigDecimal> getConversionRates(UUID pipelineId, LocalDate startDate, LocalDate endDate) {
        List<HiringFunnelMetric> metrics = funnelMetricRepository
                .findByPipelineIdAndPeriodStartBetween(pipelineId, startDate, endDate);

        if (metrics.isEmpty()) {
            return Collections.emptyMap();
        }

        // Average conversion rates across the period
        Map<String, BigDecimal> rates = new LinkedHashMap<>();
        rates.put("screeningToTechnical", avgRate(metrics, HiringFunnelMetric::getScreeningToTechnical));
        rates.put("technicalToHr", avgRate(metrics, HiringFunnelMetric::getTechnicalToHr));
        rates.put("hrToFinal", avgRate(metrics, HiringFunnelMetric::getHrToFinal));
        rates.put("finalToOffer", avgRate(metrics, HiringFunnelMetric::getFinalToOffer));
        rates.put("offerToHired", avgRate(metrics, HiringFunnelMetric::getOfferToHired));
        rates.put("overall", avgRate(metrics, HiringFunnelMetric::getOverallConversion));
        return rates;
    }

    /**
     * Get stage dropout analysis for a pipeline.
     */
    public List<StageDropoutResponse> getStageDropouts(UUID pipelineId) {
        List<StageDropoutAnalysis> dropouts = dropoutRepository.findByPipelineIdOrderByStageOrder(pipelineId);

        return dropouts.stream()
                .map(d -> StageDropoutResponse.builder()
                        .stageName(d.getStageName())
                        .stageOrder(d.getStageOrder())
                        .entered(d.getCandidatesEntered())
                        .passed(d.getCandidatesPassed())
                        .rejected(d.getCandidatesRejected())
                        .withdrew(d.getCandidatesWithdrew())
                        .avgDays(d.getAvgDaysInStage())
                        .dropoutRate(d.getDropoutRate())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get time-to-hire metrics for an organization.
     */
    public Map<String, BigDecimal> getTimeToHire(UUID orgId, String periodType) {
        List<HiringFunnelMetric> metrics = funnelMetricRepository.findByOrganizationIdAndPeriodType(orgId, periodType);

        if (metrics.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, BigDecimal> timeMetrics = new LinkedHashMap<>();
        timeMetrics.put("avgTimeToHire", avgRate(metrics, HiringFunnelMetric::getAvgTimeToHire));
        timeMetrics.put("avgTimeInScreening", avgRate(metrics, HiringFunnelMetric::getAvgTimeInScreening));
        timeMetrics.put("avgTimeInTechnical", avgRate(metrics, HiringFunnelMetric::getAvgTimeInTechnical));
        timeMetrics.put("avgTimeInHr", avgRate(metrics, HiringFunnelMetric::getAvgTimeInHr));
        timeMetrics.put("avgTimeInFinal", avgRate(metrics, HiringFunnelMetric::getAvgTimeInFinal));
        return timeMetrics;
    }

    /**
     * Scheduled job to recompute all hiring funnel metrics.
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @SchedulerLock(name = "HiringAnalyticsService_computeMetrics", lockAtMostFor = "PT1H", lockAtLeastFor = "PT5M")
    @Transactional
    public void computeMetrics() {
        log.info("Starting scheduled hiring funnel metrics computation...");

        LocalDate today = LocalDate.now();
        LocalDate periodStart = today.minusDays(1);
        LocalDate periodEnd = today;

        List<InterviewPipeline> activePipelines = interviewPipelineRepository.findByIsActiveTrueOrderByCreatedAtDesc();

        for (InterviewPipeline pipeline : activePipelines) {
            try {
                computePipelineMetrics(pipeline, periodStart, periodEnd, "DAILY");
                computeDropoutAnalysis(pipeline, periodStart, periodEnd);
            } catch (Exception e) {
                log.error("Error computing metrics for pipeline {}: {}", pipeline.getId(), e.getMessage(), e);
            }
        }

        log.info("Completed hiring funnel metrics computation for {} pipelines.", activePipelines.size());
    }

    /**
     * Manually trigger metrics recomputation (admin endpoint).
     */
    @Transactional
    public void triggerComputation() {
        log.info("Manually triggered hiring funnel metrics computation.");
        computeMetrics();
    }

    private void computePipelineMetrics(InterviewPipeline pipeline, LocalDate periodStart, LocalDate periodEnd, String periodType) {
        List<CandidatePipeline> candidates = candidatePipelineRepository.findByPipelineId(pipeline.getId());

        if (candidates.isEmpty()) {
            return;
        }

        List<PipelineStage> stages = pipeline.getStages();
        stages.sort(Comparator.comparingInt(PipelineStage::getOrderIndex));

        // Count candidates at each stage category
        int totalCandidates = candidates.size();
        int stageScreening = 0;
        int stageTechnical = 0;
        int stageHr = 0;
        int stageFinal = 0;
        int stageOffer = 0;

        int totalHired = 0;
        int totalRejected = 0;
        int totalWithdrawn = 0;

        // Time accumulators
        List<Long> hireTimesHours = new ArrayList<>();
        List<Long> screeningTimes = new ArrayList<>();
        List<Long> technicalTimes = new ArrayList<>();
        List<Long> hrTimes = new ArrayList<>();
        List<Long> finalTimes = new ArrayList<>();

        for (CandidatePipeline cp : candidates) {
            // Count statuses
            switch (cp.getStatus()) {
                case HIRED -> totalHired++;
                case REJECTED -> totalRejected++;
                case WITHDRAWN -> totalWithdrawn++;
                default -> { /* ACTIVE, ON_HOLD */ }
            }

            // Determine current stage position
            PipelineStage currentStage = cp.getCurrentStage();
            if (currentStage != null) {
                int order = currentStage.getOrderIndex();
                String stageName = currentStage.getName().toLowerCase();
                if (stageName.contains("screen")) {
                    stageScreening++;
                } else if (stageName.contains("technic")) {
                    stageTechnical++;
                } else if (stageName.contains("hr") || stageName.contains("human")) {
                    stageHr++;
                } else if (stageName.contains("final")) {
                    stageFinal++;
                } else if (stageName.contains("offer")) {
                    stageOffer++;
                } else {
                    // Assign by order index (not yet implemented - stage name didn't match conventions)
                }
            }

            // Calculate time-to-hire for completed hires
            if (cp.getStatus() == CandidatePipelineStatus.HIRED && cp.getCompletedAt() != null && cp.getStartedAt() != null) {
                long hours = Duration.between(cp.getStartedAt(), cp.getCompletedAt()).toHours();
                hireTimesHours.add(hours);
            }

            // Calculate time in each stage from progress records
            for (CandidateStageProgress progress : cp.getStageProgress()) {
                if (progress.getStartedAt() != null && progress.getCompletedAt() != null) {
                    long hours = Duration.between(progress.getStartedAt(), progress.getCompletedAt()).toHours();
                    String progressStageName = progress.getStage().getName().toLowerCase();
                    if (progressStageName.contains("screen")) {
                        screeningTimes.add(hours);
                    } else if (progressStageName.contains("technic")) {
                        technicalTimes.add(hours);
                    } else if (progressStageName.contains("hr") || progressStageName.contains("human")) {
                        hrTimes.add(hours);
                    } else if (progressStageName.contains("final")) {
                        finalTimes.add(hours);
                    }
                }
            }
        }

        // Calculate conversion rates
        // For ordered stages, count how many candidates reached or passed each stage
        int[] stageCounts = countCandidatesPerStage(candidates, stages);
        BigDecimal screeningToTechnical = calcConversion(stageCounts, 0, 1);
        BigDecimal technicalToHr = calcConversion(stageCounts, 1, 2);
        BigDecimal hrToFinal = calcConversion(stageCounts, 2, 3);
        BigDecimal finalToOffer = calcConversion(stageCounts, 3, 4);
        BigDecimal offerToHired = totalCandidates > 0
                ? BigDecimal.valueOf(totalHired).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalCandidates), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal overallConversion = totalCandidates > 0
                ? BigDecimal.valueOf(totalHired).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalCandidates), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        HiringFunnelMetric metric = HiringFunnelMetric.builder()
                .organizationId(null) // Pipeline-level; org can be derived if needed
                .pipelineId(pipeline.getId())
                .pipelineName(pipeline.getName())
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .periodType(periodType)
                .totalCandidates(totalCandidates)
                .stageScreening(stageScreening)
                .stageTechnical(stageTechnical)
                .stageHr(stageHr)
                .stageFinal(stageFinal)
                .stageOffer(stageOffer)
                .totalHired(totalHired)
                .totalRejected(totalRejected)
                .totalWithdrawn(totalWithdrawn)
                .screeningToTechnical(screeningToTechnical)
                .technicalToHr(technicalToHr)
                .hrToFinal(hrToFinal)
                .finalToOffer(finalToOffer)
                .offerToHired(offerToHired)
                .overallConversion(overallConversion)
                .avgTimeToHire(avgOf(hireTimesHours))
                .avgTimeInScreening(avgOf(screeningTimes))
                .avgTimeInTechnical(avgOf(technicalTimes))
                .avgTimeInHr(avgOf(hrTimes))
                .avgTimeInFinal(avgOf(finalTimes))
                .computedAt(Instant.now())
                .build();

        funnelMetricRepository.save(metric);
    }

    private void computeDropoutAnalysis(InterviewPipeline pipeline, LocalDate periodStart, LocalDate periodEnd) {
        List<CandidatePipeline> candidates = candidatePipelineRepository.findByPipelineId(pipeline.getId());
        List<PipelineStage> stages = pipeline.getStages();
        stages.sort(Comparator.comparingInt(PipelineStage::getOrderIndex));

        // Delete existing dropout analysis for this pipeline to replace with fresh data
        dropoutRepository.deleteByPipelineId(pipeline.getId());

        for (int i = 0; i < stages.size(); i++) {
            PipelineStage stage = stages.get(i);

            int entered = 0;
            int passed = 0;
            int rejected = 0;
            int withdrew = 0;
            List<Long> daysInStage = new ArrayList<>();

            for (CandidatePipeline cp : candidates) {
                for (CandidateStageProgress progress : cp.getStageProgress()) {
                    if (progress.getStage().getId().equals(stage.getId())) {
                        entered++;

                        if (progress.getStatus() == StageStatus.COMPLETED) {
                            passed++;
                        } else if (progress.getStatus() == StageStatus.REJECTED) {
                            rejected++;
                        }

                        if (cp.getStatus() == CandidatePipelineStatus.WITHDRAWN
                                && cp.getCurrentStage() != null
                                && cp.getCurrentStage().getId().equals(stage.getId())) {
                            withdrew++;
                        }

                        if (progress.getStartedAt() != null && progress.getCompletedAt() != null) {
                            long days = Duration.between(progress.getStartedAt(), progress.getCompletedAt()).toDays();
                            daysInStage.add(days);
                        }
                    }
                }
            }

            BigDecimal dropoutRate = entered > 0
                    ? BigDecimal.valueOf(rejected + withdrew)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(entered), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal avgDays = daysInStage.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(daysInStage.stream().mapToLong(Long::longValue).average().orElse(0))
                        .setScale(2, RoundingMode.HALF_UP);

            StageDropoutAnalysis analysis = StageDropoutAnalysis.builder()
                    .organizationId(null)
                    .pipelineId(pipeline.getId())
                    .stageName(stage.getName())
                    .stageOrder(stage.getOrderIndex())
                    .candidatesEntered(entered)
                    .candidatesPassed(passed)
                    .candidatesRejected(rejected)
                    .candidatesWithdrew(withdrew)
                    .avgDaysInStage(avgDays)
                    .dropoutRate(dropoutRate)
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .computedAt(Instant.now())
                    .build();

            dropoutRepository.save(analysis);
        }
    }

    /**
     * Count how many candidates reached each stage (by order index).
     */
    private int[] countCandidatesPerStage(List<CandidatePipeline> candidates, List<PipelineStage> stages) {
        int[] counts = new int[stages.size()];

        for (CandidatePipeline cp : candidates) {
            for (CandidateStageProgress progress : cp.getStageProgress()) {
                for (int i = 0; i < stages.size(); i++) {
                    if (stages.get(i).getId().equals(progress.getStage().getId())) {
                        counts[i]++;
                        break;
                    }
                }
            }
        }
        return counts;
    }

    private BigDecimal calcConversion(int[] stageCounts, int fromIdx, int toIdx) {
        if (toIdx >= stageCounts.length || stageCounts[fromIdx] == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(stageCounts[toIdx])
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(stageCounts[fromIdx]), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal avgOf(List<Long> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        double avg = values.stream().mapToLong(Long::longValue).average().orElse(0);
        return BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal avgRate(List<HiringFunnelMetric> metrics, java.util.function.Function<HiringFunnelMetric, BigDecimal> extractor) {
        List<BigDecimal> values = metrics.stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return values.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    @SuppressWarnings("unused")
    private void categorizeByOrder(int order, int totalStages, CandidatePipeline cp,
                                   java.util.function.Function<Void, Integer> s,
                                   java.util.function.Function<Void, Integer> t,
                                   java.util.function.Function<Void, Integer> h,
                                   java.util.function.Function<Void, Integer> f,
                                   java.util.function.Function<Void, Integer> o) {
        // Fallback stage categorization by position ratio
        // This is a best-effort classification when stage names don't match conventions
    }
}
