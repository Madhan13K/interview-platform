package com.interview_platform_backend.interview_platform_backend.whitelabel.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteLabelConfigResponse {

    private UUID id;
    private UUID organizationId;
    private String brandName;
    private String logoUrl;
    private String faviconUrl;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String customDomain;
    private String emailFromName;
    private String emailFooterHtml;
    private String loginPageTitle;
    private String loginPageSubtitle;
    private String dashboardWelcomeText;
    private String customCss;
    private boolean enabled;
    private Instant createdAt;
    private Instant updatedAt;
}
