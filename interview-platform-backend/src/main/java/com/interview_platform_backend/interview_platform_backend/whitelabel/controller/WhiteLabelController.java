package com.interview_platform_backend.interview_platform_backend.whitelabel.controller;

import com.interview_platform_backend.interview_platform_backend.whitelabel.dto.WhiteLabelConfigRequest;
import com.interview_platform_backend.interview_platform_backend.whitelabel.dto.WhiteLabelConfigResponse;
import com.interview_platform_backend.interview_platform_backend.whitelabel.service.WhiteLabelService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/white-label")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class WhiteLabelController {

    private final WhiteLabelService whiteLabelService;

    @GetMapping("/{orgId}")
    public ResponseEntity<WhiteLabelConfigResponse> getConfig(@PathVariable UUID orgId) {
        return ResponseEntity.ok(whiteLabelService.getConfig(orgId));
    }

    @PutMapping("/{orgId}")
    public ResponseEntity<WhiteLabelConfigResponse> createOrUpdate(
            @PathVariable UUID orgId,
            @Valid @RequestBody WhiteLabelConfigRequest request) {
        return ResponseEntity.ok(whiteLabelService.createOrUpdate(orgId, request));
    }

    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> delete(@PathVariable UUID orgId) {
        whiteLabelService.delete(orgId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resolve")
    public ResponseEntity<WhiteLabelConfigResponse> resolveConfig(HttpServletRequest request) {
        return ResponseEntity.ok(whiteLabelService.resolveConfig(request));
    }
}
