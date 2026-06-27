package com.interview_platform_backend.interview_platform_backend.iso27001;

import com.interview_platform_backend.interview_platform_backend.iso27001.entity.IsmsPolicy;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.IsmsPolicy.PolicyCategory;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment.Impact;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment.Likelihood;
import com.interview_platform_backend.interview_platform_backend.iso27001.repository.IsmsPolicyRepository;
import com.interview_platform_backend.interview_platform_backend.iso27001.repository.RiskAssessmentRepository;
import com.interview_platform_backend.interview_platform_backend.iso27001.service.Iso27001Service;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ISO 27001 Service Tests")
class Iso27001ServiceTest {

    @Mock private IsmsPolicyRepository policyRepository;
    @Mock private RiskAssessmentRepository riskRepository;
    @InjectMocks private Iso27001Service service;

    @Test
    @DisplayName("should create ISMS policy")
    void createPolicy() {
        IsmsPolicy policy = IsmsPolicy.builder()
                .policyNumber("ISP-001")
                .title("Access Control Policy")
                .category(PolicyCategory.ACCESS_CONTROL)
                .version("1.0")
                .content("All users must use MFA...")
                .owner(UUID.randomUUID())
                .build();

        when(policyRepository.save(any(IsmsPolicy.class))).thenAnswer(invocation -> {
            IsmsPolicy saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.createPolicy(policy);
        assertThat(result).isNotNull();
        assertThat(result.getPolicyNumber()).isEqualTo("ISP-001");
        assertThat(result.getStatus()).isEqualTo(IsmsPolicy.PolicyStatus.DRAFT);
        verify(policyRepository).save(any(IsmsPolicy.class));
    }

    @Test
    @DisplayName("should create risk assessment")
    void createRiskAssessment() {
        RiskAssessment risk = RiskAssessment.builder()
                .riskTitle("Data breach via API")
                .description("Unauthorized access to PII")
                .category("SECURITY")
                .likelihood(Likelihood.HIGH)
                .impact(Impact.HIGH)
                .currentControls("Rate limiting + WAF")
                .owner(UUID.randomUUID())
                .build();

        when(riskRepository.save(any(RiskAssessment.class))).thenAnswer(invocation -> {
            RiskAssessment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.createRiskAssessment(risk);
        assertThat(result).isNotNull();
        assertThat(result.getRiskScore()).isGreaterThan(0);
        assertThat(result.getStatus()).isEqualTo(RiskAssessment.RiskStatus.IDENTIFIED);
        verify(riskRepository).save(any(RiskAssessment.class));
    }

    @Test
    @DisplayName("should calculate risk matrix")
    void getRiskMatrix() {
        when(riskRepository.findAll()).thenReturn(Collections.emptyList());

        Map<String, Object> matrix = service.getRiskMatrix();
        assertThat(matrix).isNotNull();
        assertThat(matrix).containsKey("matrix");
        assertThat(matrix).containsKey("totalRisks");
        assertThat(matrix.get("totalRisks")).isEqualTo(0);
    }
}
