package com.interview_platform_backend.interview_platform_backend.marketplace.controller;

import com.interview_platform_backend.interview_platform_backend.marketplace.dto.InstallPluginRequest;
import com.interview_platform_backend.interview_platform_backend.marketplace.dto.MarketplacePluginResponse;
import com.interview_platform_backend.interview_platform_backend.marketplace.entity.PluginInstallation;
import com.interview_platform_backend.interview_platform_backend.marketplace.service.MarketplaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    @GetMapping("/plugins")
    public ResponseEntity<Page<MarketplacePluginResponse>> listPlugins(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(marketplaceService.listPlugins(category, search, page, size));
    }

    @GetMapping("/plugins/{slug}")
    public ResponseEntity<MarketplacePluginResponse> getPlugin(@PathVariable String slug) {
        return ResponseEntity.ok(marketplaceService.getPlugin(slug));
    }

    @PostMapping("/install")
    public ResponseEntity<PluginInstallation> installPlugin(
            @RequestParam UUID orgId,
            @RequestParam UUID userId,
            @RequestBody InstallPluginRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(marketplaceService.installPlugin(orgId, request, userId));
    }

    @DeleteMapping("/uninstall/{pluginId}")
    public ResponseEntity<Void> uninstallPlugin(
            @RequestParam UUID orgId,
            @PathVariable UUID pluginId) {
        marketplaceService.uninstallPlugin(orgId, pluginId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/plugins/{pluginId}/config")
    public ResponseEntity<PluginInstallation> updatePluginConfig(
            @RequestParam UUID orgId,
            @PathVariable UUID pluginId,
            @RequestBody Map<String, Object> config) {
        return ResponseEntity.ok(marketplaceService.updatePluginConfig(orgId, pluginId, config));
    }

    @GetMapping("/installed")
    public ResponseEntity<List<PluginInstallation>> getInstalledPlugins(@RequestParam UUID orgId) {
        return ResponseEntity.ok(marketplaceService.getInstalledPlugins(orgId));
    }
}
