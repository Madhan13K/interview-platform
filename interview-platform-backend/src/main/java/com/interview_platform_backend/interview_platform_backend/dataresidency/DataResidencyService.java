package com.interview_platform_backend.interview_platform_backend.dataresidency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Multi-Region Data Residency Service.
 * Ensures compliance with GDPR Article 44+ by keeping EU data in EU regions.
 * Routes data operations to region-specific storage based on user/org location.
 */
@Service
public class DataResidencyService {

    private static final Logger log = LoggerFactory.getLogger(DataResidencyService.class);

    @Value("${app.data-residency.default-region:us-east-1}")
    private String defaultRegion;

    @Value("${app.data-residency.eu-region:eu-west-1}")
    private String euRegion;

    @Value("${app.data-residency.ap-region:ap-southeast-1}")
    private String apRegion;

    private static final Map<String, List<String>> REGION_COUNTRY_MAP = Map.of(
            "EU", List.of("DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI", "SE", "DK", "PL", "CZ", "RO", "HU", "BG", "HR", "SK", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "GR"),
            "UK", List.of("GB"),
            "AP", List.of("JP", "AU", "SG", "IN", "KR", "NZ"),
            "US", List.of("US", "CA", "MX")
    );

    /**
     * Determine the data storage region for a given country code.
     */
    public String getStorageRegion(String countryCode) {
        if (countryCode == null) return defaultRegion;
        String upper = countryCode.toUpperCase();

        if (REGION_COUNTRY_MAP.get("EU").contains(upper) || REGION_COUNTRY_MAP.get("UK").contains(upper)) {
            return euRegion;
        }
        if (REGION_COUNTRY_MAP.get("AP").contains(upper)) {
            return apRegion;
        }
        return defaultRegion;
    }

    /**
     * Get the S3 bucket name for a specific region.
     */
    public String getRegionalBucket(String region) {
        return "interview-platform-" + region;
    }

    /**
     * Get the database connection info for a specific region.
     */
    public Map<String, String> getRegionalDatabase(String region) {
        // In production, this would return actual connection details per region
        return Map.of(
                "region", region,
                "host", region + ".db.interview-platform.internal",
                "port", "5432",
                "database", "interview_platform_" + region.replace("-", "_")
        );
    }

    /**
     * Validate if data transfer between regions is compliant.
     */
    public DataTransferValidation validateTransfer(String sourceCountry, String destinationCountry) {
        String sourceRegion = getStorageRegion(sourceCountry);
        String destRegion = getStorageRegion(destinationCountry);

        boolean sameRegion = sourceRegion.equals(destRegion);
        boolean euToNonEu = sourceRegion.equals(euRegion) && !destRegion.equals(euRegion);

        String status;
        String requirement;

        if (sameRegion) {
            status = "ALLOWED";
            requirement = "No additional requirements - same region";
        } else if (euToNonEu) {
            status = "REQUIRES_SCC";
            requirement = "Standard Contractual Clauses (SCC) required per GDPR Article 46. " +
                    "Ensure adequacy decision exists or implement appropriate safeguards.";
        } else {
            status = "ALLOWED_WITH_NOTICE";
            requirement = "Transfer allowed. Update privacy notice to inform data subjects.";
        }

        return new DataTransferValidation(sourceCountry, destinationCountry, sourceRegion, destRegion, status, requirement);
    }

    /**
     * Get compliance summary for an organization.
     */
    public Map<String, Object> getComplianceSummary(String orgCountry) {
        String region = getStorageRegion(orgCountry);
        boolean isEU = region.equals(euRegion);

        return Map.of(
                "primaryRegion", region,
                "gdprApplicable", isEU,
                "dataStorageLocation", getRegionalBucket(region),
                "crossBorderRestrictions", isEU ? "EU data must remain in EU unless SCC in place" : "Standard privacy policy applies",
                "retentionPolicy", "Configurable per entity type",
                "encryptionAtRest", true,
                "encryptionInTransit", true
        );
    }

    public record DataTransferValidation(String sourceCountry, String destCountry, String sourceRegion,
                                          String destRegion, String status, String requirement) {}
}
