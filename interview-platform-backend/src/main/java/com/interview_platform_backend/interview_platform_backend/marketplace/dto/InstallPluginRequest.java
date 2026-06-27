package com.interview_platform_backend.interview_platform_backend.marketplace.dto;

import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallPluginRequest {

    private UUID pluginId;

    private Map<String, Object> configuration;
}
