package com.interview_platform_backend.interview_platform_backend.cdn.controller;

import com.interview_platform_backend.interview_platform_backend.cdn.dto.CdnAssetResponse;
import com.interview_platform_backend.interview_platform_backend.cdn.dto.CdnPurgeRequest;
import com.interview_platform_backend.interview_platform_backend.cdn.service.CdnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cdn")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CdnController {

    private final CdnService cdnService;

    @GetMapping("/assets")
    public ResponseEntity<List<CdnAssetResponse>> listAssets(@RequestParam UUID orgId) {
        return ResponseEntity.ok(cdnService.getAssetsByOrg(orgId));
    }

    @PostMapping("/assets")
    public ResponseEntity<CdnAssetResponse> registerAsset(@RequestBody Map<String, Object> request) {
        UUID orgId = UUID.fromString((String) request.get("orgId"));
        String assetKey = (String) request.get("assetKey");
        String originalUrl = (String) request.get("originalUrl");
        String contentType = (String) request.get("contentType");
        long size = ((Number) request.get("size")).longValue();

        return ResponseEntity.ok(cdnService.registerAsset(orgId, assetKey, originalUrl, contentType, size));
    }

    @PostMapping("/purge")
    public ResponseEntity<Void> purgeAssets(@RequestBody CdnPurgeRequest request) {
        cdnService.purgeAssets(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/{assetKey}/url")
    public ResponseEntity<Map<String, String>> getCdnUrl(@PathVariable String assetKey) {
        String url = cdnService.getCdnUrl(assetKey);
        return ResponseEntity.ok(Map.of("cdnUrl", url));
    }
}
