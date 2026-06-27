package com.interview_platform_backend.interview_platform_backend.multiregion;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/regions")
@ConditionalOnProperty(name = "app.multi-region.enabled", havingValue = "true")
@PreAuthorize("hasRole('ADMIN')")
public class MultiRegionController {
    private final RegionRoutingService routingService;

    public MultiRegionController(RegionRoutingService routingService) {
        this.routingService = routingService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(routingService.getRegionStatus());
    }

    @GetMapping("/resolve")
    public ResponseEntity<Map<String, String>> resolveRegion(@RequestParam String countryCode) {
        String region = routingService.resolveRegion(countryCode);
        return ResponseEntity.ok(Map.of("country", countryCode, "region", region, "endpoint", routingService.getRegionEndpoint(region), "isLocal", String.valueOf(routingService.isLocalRegion(region))));
    }
}
