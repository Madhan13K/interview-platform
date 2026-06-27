package com.interview_platform_backend.interview_platform_backend.marketplace.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.marketplace.dto.InstallPluginRequest;
import com.interview_platform_backend.interview_platform_backend.marketplace.dto.MarketplacePluginResponse;
import com.interview_platform_backend.interview_platform_backend.marketplace.entity.MarketplacePlugin;
import com.interview_platform_backend.interview_platform_backend.marketplace.entity.PluginInstallation;
import com.interview_platform_backend.interview_platform_backend.marketplace.repository.MarketplacePluginRepository;
import com.interview_platform_backend.interview_platform_backend.marketplace.repository.PluginInstallationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private static final Logger log = LoggerFactory.getLogger(MarketplaceService.class);

    private final MarketplacePluginRepository pluginRepository;
    private final PluginInstallationRepository installationRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<MarketplacePluginResponse> listPlugins(String category, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "installCount"));

        Page<MarketplacePlugin> plugins;

        if (search != null && !search.isBlank()) {
            plugins = pluginRepository.findByStatusAndNameContainingIgnoreCase(
                    MarketplacePlugin.Status.PUBLISHED, search, pageable);
        } else if (category != null && !category.isBlank()) {
            MarketplacePlugin.Category cat = MarketplacePlugin.Category.valueOf(category.toUpperCase());
            plugins = pluginRepository.findByStatusAndCategory(
                    MarketplacePlugin.Status.PUBLISHED, cat, pageable);
        } else {
            plugins = pluginRepository.findByStatus(MarketplacePlugin.Status.PUBLISHED, pageable);
        }

        return plugins.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public MarketplacePluginResponse getPlugin(String slug) {
        MarketplacePlugin plugin = pluginRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Plugin not found: " + slug));
        return toResponse(plugin);
    }

    @Transactional
    public PluginInstallation installPlugin(UUID orgId, InstallPluginRequest request, UUID userId) {
        UUID pluginId = request.getPluginId();

        if (installationRepository.existsByPluginIdAndOrganizationId(pluginId, orgId)) {
            throw new RuntimeException("Plugin already installed for this organization");
        }

        MarketplacePlugin plugin = pluginRepository.findById(pluginId)
                .orElseThrow(() -> new RuntimeException("Plugin not found: " + pluginId));

        String configJson = serializeConfig(request.getConfiguration());

        PluginInstallation installation = PluginInstallation.builder()
                .pluginId(pluginId)
                .organizationId(orgId)
                .installedBy(userId)
                .configuration(configJson)
                .enabled(true)
                .build();

        PluginInstallation saved = installationRepository.save(installation);

        // Increment install count
        plugin.setInstallCount(plugin.getInstallCount() + 1);
        pluginRepository.save(plugin);

        log.info("Plugin {} installed for organization {} by user {}", pluginId, orgId, userId);
        return saved;
    }

    @Transactional
    public void uninstallPlugin(UUID orgId, UUID pluginId) {
        List<PluginInstallation> installations = installationRepository.findByOrganizationId(orgId).stream()
                .filter(i -> i.getPluginId().equals(pluginId))
                .toList();

        if (installations.isEmpty()) {
            throw new RuntimeException("Plugin not installed for this organization");
        }

        installationRepository.deleteAll(installations);

        // Decrement install count
        pluginRepository.findById(pluginId).ifPresent(plugin -> {
            plugin.setInstallCount(Math.max(0, plugin.getInstallCount() - 1));
            pluginRepository.save(plugin);
        });

        log.info("Plugin {} uninstalled for organization {}", pluginId, orgId);
    }

    @Transactional
    public PluginInstallation updatePluginConfig(UUID orgId, UUID pluginId, Map<String, Object> config) {
        PluginInstallation installation = installationRepository.findByOrganizationId(orgId).stream()
                .filter(i -> i.getPluginId().equals(pluginId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Plugin installation not found"));

        installation.setConfiguration(serializeConfig(config));
        return installationRepository.save(installation);
    }

    @Transactional(readOnly = true)
    public List<PluginInstallation> getInstalledPlugins(UUID orgId) {
        return installationRepository.findByOrganizationId(orgId);
    }

    public void triggerPluginWebhook(UUID pluginId, String eventType, Map<String, Object> payload) {
        MarketplacePlugin plugin = pluginRepository.findById(pluginId)
                .orElseThrow(() -> new RuntimeException("Plugin not found: " + pluginId));

        if (plugin.getWebhookUrl() == null || plugin.getWebhookUrl().isBlank()) {
            log.warn("Plugin {} has no webhook URL configured", pluginId);
            return;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> webhookPayload = Map.of(
                    "eventType", eventType,
                    "pluginId", pluginId.toString(),
                    "timestamp", System.currentTimeMillis(),
                    "data", payload
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(webhookPayload, headers);
            restTemplate.postForEntity(plugin.getWebhookUrl(), entity, String.class);
            log.info("Webhook triggered for plugin {} with event {}", pluginId, eventType);
        } catch (Exception e) {
            log.error("Failed to trigger webhook for plugin {}: {}", pluginId, e.getMessage());
        }
    }

    private MarketplacePluginResponse toResponse(MarketplacePlugin plugin) {
        return MarketplacePluginResponse.builder()
                .id(plugin.getId())
                .name(plugin.getName())
                .slug(plugin.getSlug())
                .description(plugin.getDescription())
                .shortDescription(plugin.getShortDescription())
                .vendorName(plugin.getVendorName())
                .vendorEmail(plugin.getVendorEmail())
                .vendorUrl(plugin.getVendorUrl())
                .version(plugin.getVersion())
                .category(plugin.getCategory())
                .iconUrl(plugin.getIconUrl())
                .screenshotUrls(plugin.getScreenshotUrls())
                .documentationUrl(plugin.getDocumentationUrl())
                .webhookUrl(plugin.getWebhookUrl())
                .configSchema(plugin.getConfigSchema())
                .pricing(plugin.getPricing())
                .monthlyPrice(plugin.getMonthlyPrice())
                .status(plugin.getStatus())
                .installCount(plugin.getInstallCount())
                .rating(plugin.getRating())
                .reviewCount(plugin.getReviewCount())
                .createdAt(plugin.getCreatedAt())
                .updatedAt(plugin.getUpdatedAt())
                .publishedAt(plugin.getPublishedAt())
                .build();
    }

    private String serializeConfig(Map<String, Object> config) {
        if (config == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize plugin configuration", e);
        }
    }
}
