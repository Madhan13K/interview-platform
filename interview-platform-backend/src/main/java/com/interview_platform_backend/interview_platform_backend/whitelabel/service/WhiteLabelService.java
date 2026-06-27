package com.interview_platform_backend.interview_platform_backend.whitelabel.service;

import com.interview_platform_backend.interview_platform_backend.whitelabel.dto.WhiteLabelConfigRequest;
import com.interview_platform_backend.interview_platform_backend.whitelabel.dto.WhiteLabelConfigResponse;
import com.interview_platform_backend.interview_platform_backend.whitelabel.entity.WhiteLabelConfig;
import com.interview_platform_backend.interview_platform_backend.whitelabel.repository.WhiteLabelRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WhiteLabelService {

    private static final Logger log = LoggerFactory.getLogger(WhiteLabelService.class);

    private final WhiteLabelRepository whiteLabelRepository;

    @Transactional(readOnly = true)
    public WhiteLabelConfigResponse getConfig(UUID orgId) {
        WhiteLabelConfig config = whiteLabelRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new RuntimeException("White-label config not found for organization: " + orgId));
        return toResponse(config);
    }

    @Transactional
    public WhiteLabelConfigResponse createOrUpdate(UUID orgId, WhiteLabelConfigRequest request) {
        WhiteLabelConfig config = whiteLabelRepository.findByOrganizationId(orgId)
                .orElse(WhiteLabelConfig.builder().organizationId(orgId).build());

        config.setBrandName(request.getBrandName());
        config.setLogoUrl(request.getLogoUrl());
        config.setFaviconUrl(request.getFaviconUrl());
        config.setPrimaryColor(request.getPrimaryColor());
        config.setSecondaryColor(request.getSecondaryColor());
        config.setAccentColor(request.getAccentColor());
        config.setCustomDomain(request.getCustomDomain());
        config.setEmailFromName(request.getEmailFromName());
        config.setEmailFooterHtml(request.getEmailFooterHtml());
        config.setLoginPageTitle(request.getLoginPageTitle());
        config.setLoginPageSubtitle(request.getLoginPageSubtitle());
        config.setDashboardWelcomeText(request.getDashboardWelcomeText());
        config.setCustomCss(request.getCustomCss());

        if (request.getEnabled() != null) {
            config.setEnabled(request.getEnabled());
        }

        WhiteLabelConfig saved = whiteLabelRepository.save(config);
        log.info("White-label config saved for organization: {}", orgId);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID orgId) {
        WhiteLabelConfig config = whiteLabelRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new RuntimeException("White-label config not found for organization: " + orgId));
        whiteLabelRepository.delete(config);
        log.info("White-label config deleted for organization: {}", orgId);
    }

    @Transactional(readOnly = true)
    public WhiteLabelConfigResponse getByDomain(String domain) {
        WhiteLabelConfig config = whiteLabelRepository.findByCustomDomain(domain)
                .orElseThrow(() -> new RuntimeException("White-label config not found for domain: " + domain));
        return toResponse(config);
    }

    @Transactional(readOnly = true)
    public WhiteLabelConfigResponse resolveConfig(HttpServletRequest request) {
        String host = request.getHeader("Host");
        if (host == null || host.isBlank()) {
            throw new RuntimeException("Host header is missing from request");
        }

        // Strip port if present
        String domain = host.contains(":") ? host.substring(0, host.indexOf(':')) : host;
        log.debug("Resolving white-label config for domain: {}", domain);

        return whiteLabelRepository.findByCustomDomain(domain)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("No white-label config found for host: " + domain));
    }

    private WhiteLabelConfigResponse toResponse(WhiteLabelConfig config) {
        return WhiteLabelConfigResponse.builder()
                .id(config.getId())
                .organizationId(config.getOrganizationId())
                .brandName(config.getBrandName())
                .logoUrl(config.getLogoUrl())
                .faviconUrl(config.getFaviconUrl())
                .primaryColor(config.getPrimaryColor())
                .secondaryColor(config.getSecondaryColor())
                .accentColor(config.getAccentColor())
                .customDomain(config.getCustomDomain())
                .emailFromName(config.getEmailFromName())
                .emailFooterHtml(config.getEmailFooterHtml())
                .loginPageTitle(config.getLoginPageTitle())
                .loginPageSubtitle(config.getLoginPageSubtitle())
                .dashboardWelcomeText(config.getDashboardWelcomeText())
                .customCss(config.getCustomCss())
                .enabled(config.isEnabled())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
