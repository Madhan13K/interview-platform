package com.interview_platform_backend.interview_platform_backend.cdn.service;

import com.interview_platform_backend.interview_platform_backend.cdn.dto.CdnAssetResponse;
import com.interview_platform_backend.interview_platform_backend.cdn.dto.CdnPurgeRequest;
import com.interview_platform_backend.interview_platform_backend.cdn.entity.CdnAsset;
import com.interview_platform_backend.interview_platform_backend.cdn.repository.CdnAssetRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CdnService {

    private static final Logger log = LoggerFactory.getLogger(CdnService.class);

    private final CdnAssetRepository cdnAssetRepository;

    @Value("${app.cdn.base-url:https://cdn.interview-platform.app}")
    private String cdnBaseUrl;

    @Value("${app.cdn.enabled:false}")
    private boolean cdnEnabled;

    @Transactional
    public CdnAssetResponse registerAsset(UUID orgId, String assetKey, String originalUrl, String contentType, long size) {
        log.info("Registering CDN asset: {} for organization: {}", assetKey, orgId);

        String checksum = computeChecksum(assetKey + originalUrl);
        String cdnUrl = cdnBaseUrl + "/" + assetKey;

        CdnAsset asset = CdnAsset.builder()
                .organizationId(orgId)
                .assetKey(assetKey)
                .originalUrl(originalUrl)
                .cdnUrl(cdnUrl)
                .contentType(contentType)
                .sizeBytes(size)
                .checksum(checksum)
                .cacheControl("public, max-age=31536000")
                .status(cdnEnabled ? CdnAsset.Status.CACHED : CdnAsset.Status.PENDING)
                .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                .build();

        CdnAsset saved = cdnAssetRepository.save(asset);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public String getCdnUrl(String assetKey) {
        CdnAsset asset = cdnAssetRepository.findByAssetKey(assetKey)
                .orElseThrow(() -> new RuntimeException("CDN asset not found: " + assetKey));

        asset.setLastAccessed(Instant.now());
        return cdnEnabled ? asset.getCdnUrl() : asset.getOriginalUrl();
    }

    @Transactional
    public void purgeAssets(CdnPurgeRequest request) {
        if (request.isPurgeAll()) {
            log.warn("Purging ALL CDN assets");
            List<CdnAsset> allCached = cdnAssetRepository.findByStatus(CdnAsset.Status.CACHED);
            allCached.forEach(asset -> asset.setStatus(CdnAsset.Status.INVALIDATED));
            cdnAssetRepository.saveAll(allCached);
        } else if (request.getAssetKeys() != null && !request.getAssetKeys().isEmpty()) {
            log.info("Purging {} CDN assets", request.getAssetKeys().size());
            for (String key : request.getAssetKeys()) {
                cdnAssetRepository.findByAssetKey(key).ifPresent(asset -> {
                    asset.setStatus(CdnAsset.Status.INVALIDATED);
                    cdnAssetRepository.save(asset);
                });
            }
        }
    }

    @Transactional(readOnly = true)
    public List<CdnAssetResponse> getAssetsByOrg(UUID orgId) {
        return cdnAssetRepository.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
    }

    public Map<String, String> generateCacheHeaders(String assetKey) {
        CdnAsset asset = cdnAssetRepository.findByAssetKey(assetKey)
                .orElseThrow(() -> new RuntimeException("CDN asset not found: " + assetKey));

        return Map.of(
                HttpHeaders.CACHE_CONTROL, asset.getCacheControl(),
                HttpHeaders.ETAG, "\"" + asset.getChecksum() + "\"",
                "X-CDN-Status", asset.getStatus().name()
        );
    }

    private CdnAssetResponse toResponse(CdnAsset asset) {
        return CdnAssetResponse.builder()
                .id(asset.getId())
                .assetKey(asset.getAssetKey())
                .cdnUrl(asset.getCdnUrl())
                .contentType(asset.getContentType())
                .sizeBytes(asset.getSizeBytes())
                .status(asset.getStatus())
                .cacheControl(asset.getCacheControl())
                .expiresAt(asset.getExpiresAt())
                .build();
    }

    private String computeChecksum(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
