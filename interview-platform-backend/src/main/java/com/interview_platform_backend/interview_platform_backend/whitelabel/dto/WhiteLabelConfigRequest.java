package com.interview_platform_backend.interview_platform_backend.whitelabel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteLabelConfigRequest {

    @NotBlank(message = "Brand name is required")
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

    private Boolean enabled;
}
