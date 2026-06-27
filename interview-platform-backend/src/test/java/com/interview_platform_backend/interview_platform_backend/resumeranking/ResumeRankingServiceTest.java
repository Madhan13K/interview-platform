package com.interview_platform_backend.interview_platform_backend.resumeranking;

import com.interview_platform_backend.interview_platform_backend.resumeranking.entity.ResumeRank;
import com.interview_platform_backend.interview_platform_backend.resumeranking.service.ResumeRankingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Resume Ranking Service Tests")
class ResumeRankingServiceTest {

    @Mock private EntityManager entityManager;
    @InjectMocks private ResumeRankingService service;

    @Test
    @DisplayName("should get rankings for job position")
    void getRankings() {
        UUID jobId = UUID.randomUUID();
        TypedQuery<ResumeRank> query = mock(TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(ResumeRank.class))).thenReturn(query);
        when(query.setParameter(eq("jobId"), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of(
            ResumeRank.builder().fitScore(92.5).overallRank(1).build(),
            ResumeRank.builder().fitScore(85.0).overallRank(2).build()
        ));

        List<ResumeRank> rankings = service.getRankings(jobId);

        assertThat(rankings).hasSize(2);
        assertThat(rankings.get(0).getFitScore()).isEqualTo(92.5);
    }
}
