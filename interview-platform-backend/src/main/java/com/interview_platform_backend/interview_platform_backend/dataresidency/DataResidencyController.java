package com.interview_platform_backend.interview_platform_backend.dataresidency;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/data-residency")
@PreAuthorize("hasRole('ADMIN')")
public class DataResidencyController {

    private final DataResidencyService residencyService;

    public DataResidencyController(DataResidencyService residencyService) {
        this.residencyService = residencyService;
    }

    @GetMapping("/region")
    public ResponseEntity<Map<String, String>> getRegion(@RequestParam String countryCode) {
        String region = residencyService.getStorageRegion(countryCode);
        return ResponseEntity.ok(Map.of("countryCode", countryCode, "region", region, "bucket", residencyService.getRegionalBucket(region)));
    }

    @GetMapping("/validate-transfer")
    public ResponseEntity<DataResidencyService.DataTransferValidation> validateTransfer(
            @RequestParam String sourceCountry, @RequestParam String destinationCountry) {
        return ResponseEntity.ok(residencyService.validateTransfer(sourceCountry, destinationCountry));
    }

    @GetMapping("/compliance")
    public ResponseEntity<Map<String, Object>> getCompliance(@RequestParam String orgCountry) {
        return ResponseEntity.ok(residencyService.getComplianceSummary(orgCountry));
    }
}
