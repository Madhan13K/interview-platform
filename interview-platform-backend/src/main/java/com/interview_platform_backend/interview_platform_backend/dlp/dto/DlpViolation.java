package com.interview_platform_backend.interview_platform_backend.dlp.dto;

import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpPolicy;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DlpViolation {

    private UUID policyId;
    private String policyName;
    private DlpPolicy.DataType dataType;
    private DlpPolicy.DlpAction action;
    private DlpPolicy.Severity severity;
    private String matchedSnippet;
    private int matchCount;
}
