package com.interview_platform_backend.interview_platform_backend.cdn.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdnPurgeRequest {

    private List<String> assetKeys;

    @Builder.Default
    private boolean purgeAll = false;
}
