package com.interview_platform_backend.interview_platform_backend.ipwhitelist.controller;

import com.interview_platform_backend.interview_platform_backend.ipwhitelist.entity.IpWhitelistEntry;
import com.interview_platform_backend.interview_platform_backend.ipwhitelist.service.IpWhitelistService;
import com.interview_platform_backend.interview_platform_backend.security.jwt.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/ip-whitelist")
@PreAuthorize("hasAnyRole('ADMIN')")
public class IpWhitelistController {

    private final IpWhitelistService ipWhitelistService;

    public IpWhitelistController(IpWhitelistService ipWhitelistService) {
        this.ipWhitelistService = ipWhitelistService;
    }

    @PostMapping
    public ResponseEntity<IpWhitelistEntry> addEntry(
            @PathVariable UUID orgId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        IpWhitelistEntry entry = ipWhitelistService.addEntry(
                orgId,
                request.get("ipAddress"),
                request.get("description"),
                userDetails.getUserId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }

    @GetMapping
    public ResponseEntity<List<IpWhitelistEntry>> getWhitelist(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ipWhitelistService.getWhitelist(orgId));
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> removeEntry(@PathVariable UUID orgId, @PathVariable UUID entryId) {
        ipWhitelistService.removeEntry(entryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkIp(
            @PathVariable UUID orgId,
            @RequestParam String ip) {
        boolean allowed = ipWhitelistService.isIpAllowed(orgId, ip);
        return ResponseEntity.ok(Map.of("allowed", allowed));
    }
}
