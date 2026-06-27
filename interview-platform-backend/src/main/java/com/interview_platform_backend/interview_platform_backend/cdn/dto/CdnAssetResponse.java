package com.interview_platform_backend.interview_platform_backend.cdn.dto;

import com.interview_platform_backend.interview_platform_backend.cdn.entity.CdnAsset;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdnAssetResponse {

    private UUID id;
    private String assetKey;
    private String cdnUrl;
    private String contentType;
    private long sizeBytes;
    private CdnAsset.Status status;
    private String cacheControl;
    private Instant expiresAt;
}
