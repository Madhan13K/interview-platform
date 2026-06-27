package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StageDropoutResponse {

    private String stageName;
    private Integer stageOrder;
    private Integer entered;
    private Integer passed;
    private Integer rejected;
    private Integer withdrew;
    private BigDecimal avgDays;
    private BigDecimal dropoutRate;
}
