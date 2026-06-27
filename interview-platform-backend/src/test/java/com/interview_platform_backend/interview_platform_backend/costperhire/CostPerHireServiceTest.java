package com.interview_platform_backend.interview_platform_backend.costperhire;

import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost;
import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost.CostType;
import com.interview_platform_backend.interview_platform_backend.costperhire.repository.HiringCostRepository;
import com.interview_platform_backend.interview_platform_backend.costperhire.service.CostPerHireService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Cost Per Hire Service Tests")
class CostPerHireServiceTest {

    @Mock private HiringCostRepository costRepository;
    @InjectMocks private CostPerHireService service;

    @Test
    @DisplayName("should add hiring cost")
    void addCost() {
        UUID orgId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();

        HiringCost cost = HiringCost.builder()
                .organizationId(orgId)
                .jobPositionId(jobId)
                .costType(CostType.AGENCY_FEE)
                .amount(5000.0)
                .currency("USD")
                .description("Recruiter fee")
                .createdBy(UUID.randomUUID())
                .build();

        when(costRepository.save(any(HiringCost.class))).thenAnswer(invocation -> {
            HiringCost saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.addCost(cost);
        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualTo(5000.0);
        assertThat(result.getCostType()).isEqualTo(CostType.AGENCY_FEE);
        assertThat(result.getCurrency()).isEqualTo("USD");
        verify(costRepository).save(any(HiringCost.class));
    }

    @Test
    @DisplayName("should add hiring cost with different cost type")
    void addCostWithDifferentType() {
        UUID orgId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();

        HiringCost cost = HiringCost.builder()
                .organizationId(orgId)
                .jobPositionId(jobId)
                .costType(CostType.JOB_BOARD)
                .amount(2500.0)
                .currency("USD")
                .description("LinkedIn posting")
                .build();

        when(costRepository.save(any(HiringCost.class))).thenAnswer(invocation -> {
            HiringCost saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.addCost(cost);
        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualTo(2500.0);
        assertThat(result.getCostType()).isEqualTo(CostType.JOB_BOARD);
        verify(costRepository).save(any(HiringCost.class));
    }
}
