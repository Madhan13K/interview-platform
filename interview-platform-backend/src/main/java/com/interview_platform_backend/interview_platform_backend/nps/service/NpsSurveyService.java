package com.interview_platform_backend.interview_platform_backend.nps.service;

import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsSurvey;
import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsSurvey.NpsCategory;
import com.interview_platform_backend.interview_platform_backend.nps.entity.NpsTrend;
import com.interview_platform_backend.interview_platform_backend.nps.repository.NpsSurveyRepository;
import com.interview_platform_backend.interview_platform_backend.nps.repository.NpsTrendRepository;
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
@Transactional
public class NpsSurveyService {

    private static final Logger log = LoggerFactory.getLogger(NpsSurveyService.class);

    private final NpsSurveyRepository surveyRepository;
    private final NpsTrendRepository trendRepository;

    public NpsSurvey sendSurvey(UUID interviewId, UUID candidateId) {
        log.info("Sending NPS survey for interview [{}] to candidate [{}]", interviewId, candidateId);

        NpsSurvey survey = NpsSurvey.builder()
                .interviewId(interviewId)
                .candidateId(candidateId)
                .score(0)
                .sentAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        NpsSurvey saved = surveyRepository.save(survey);
        log.info("NPS survey [{}] sent successfully", saved.getId());
        return saved;
    }

    public NpsSurvey recordResponse(UUID surveyId, int score, String feedback) {
        log.info("Recording NPS response for survey [{}]: score={}", surveyId, score);

        NpsSurvey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("NPS survey not found: " + surveyId));

        survey.setScore(score);
        survey.setFeedback(feedback);
        survey.setRespondedAt(Instant.now());

        NpsSurvey saved = surveyRepository.save(survey);
        log.info("NPS response recorded for survey [{}]: category={}", surveyId, saved.getCategory());
        return saved;
    }

    @Transactional(readOnly = true)
    public NpsTrend calculateNps(UUID orgId, Instant since) {
        log.info("Calculating NPS for org [{}] since [{}]", orgId, since);

        List<NpsSurvey> surveys = surveyRepository.findByCreatedAtAfter(since);

        long promoters = surveys.stream().filter(s -> s.getCategory() == NpsCategory.PROMOTER).count();
        long passives = surveys.stream().filter(s -> s.getCategory() == NpsCategory.PASSIVE).count();
        long detractors = surveys.stream().filter(s -> s.getCategory() == NpsCategory.DETRACTOR).count();
        long total = surveys.size();

        double npsScore = total > 0 ? ((double) (promoters - detractors) / total) * 100 : 0;

        NpsTrend trend = NpsTrend.builder()
                .organizationId(orgId)
                .period(since.toString())
                .promoterCount((int) promoters)
                .passiveCount((int) passives)
                .detractorCount((int) detractors)
                .npsScore(npsScore)
                .responseRate(0.0)
                .sampleSize((int) total)
                .correlationToOfferAcceptance(0.0)
                .calculatedAt(Instant.now())
                .build();

        log.info("NPS calculated for org [{}]: score={}, sample={}", orgId, npsScore, total);
        return trend;
    }

    @Transactional(readOnly = true)
    public List<NpsTrend> getTrends(UUID orgId) {
        log.debug("Fetching NPS trends for org [{}]", orgId);
        return trendRepository.findByOrganizationIdOrderByCalculatedAtDesc(orgId);
    }

    @Transactional(readOnly = true)
    public double getCorrelationToOfferAcceptance(UUID orgId) {
        log.debug("Calculating correlation to offer acceptance for org [{}]", orgId);
        List<NpsTrend> trends = trendRepository.findByOrganizationIdOrderByCalculatedAtDesc(orgId);
        if (trends.isEmpty()) {
            return 0.0;
        }
        return trends.get(0).getCorrelationToOfferAcceptance();
    }
}
