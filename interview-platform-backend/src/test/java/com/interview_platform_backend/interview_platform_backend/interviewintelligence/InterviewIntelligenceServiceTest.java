package com.interview_platform_backend.interview_platform_backend.interviewintelligence;

import com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity.InterviewInsight;
import com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity.InterviewInsight.InsightType;
import com.interview_platform_backend.interview_platform_backend.interviewintelligence.repository.InterviewInsightRepository;
import com.interview_platform_backend.interview_platform_backend.interviewintelligence.service.InterviewIntelligenceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Interview Intelligence Service Tests")
class InterviewIntelligenceServiceTest {

    @Mock private InterviewInsightRepository insightRepository;
    @InjectMocks private InterviewIntelligenceService service;

    @Test
    @DisplayName("should generate insights for organization")
    void generateInsights() {
        UUID orgId = UUID.randomUUID();
        Instant since = Instant.now().minusSeconds(86400 * 30);

        when(insightRepository.findByOrganizationIdAndGeneratedAtAfter(eq(orgId), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(insightRepository.save(any(InterviewInsight.class))).thenAnswer(invocation -> {
            InterviewInsight saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        List<InterviewInsight> insights = service.generateInsights(orgId, since);
        assertThat(insights).isNotNull();
        assertThat(insights).isNotEmpty();
        assertThat(insights.get(0).getInsightType()).isEqualTo(InsightType.FAILURE_POINT);
        verify(insightRepository).save(any(InterviewInsight.class));
    }

    @Test
    @DisplayName("should return existing insights when available")
    void generateInsightsReturnsExisting() {
        UUID orgId = UUID.randomUUID();
        Instant since = Instant.now().minusSeconds(86400 * 30);

        InterviewInsight existing = InterviewInsight.builder()
                .id(UUID.randomUUID())
                .organizationId(orgId)
                .insightType(InsightType.BEST_QUESTION)
                .metric("top_question_score")
                .value(0.92)
                .sampleSize(50)
                .confidence(0.88)
                .period("2026-Q2")
                .generatedAt(Instant.now())
                .build();

        when(insightRepository.findByOrganizationIdAndGeneratedAtAfter(eq(orgId), any(Instant.class)))
                .thenReturn(List.of(existing));

        List<InterviewInsight> insights = service.generateInsights(orgId, since);
        assertThat(insights).hasSize(1);
        assertThat(insights.get(0).getInsightType()).isEqualTo(InsightType.BEST_QUESTION);
    }
}
