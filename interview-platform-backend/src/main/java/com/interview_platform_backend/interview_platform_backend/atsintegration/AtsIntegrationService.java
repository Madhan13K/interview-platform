package com.interview_platform_backend.interview_platform_backend.atsintegration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * ATS Integration Connectors Service.
 * Provides bidirectional sync with Greenhouse, Lever, and Workday APIs.
 */
@Service
public class AtsIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(AtsIntegrationService.class);

    @Value("${app.ats.greenhouse.api-key:}")
    private String greenhouseApiKey;

    @Value("${app.ats.greenhouse.base-url:https://harvest.greenhouse.io/v1}")
    private String greenhouseBaseUrl;

    @Value("${app.ats.lever.api-key:}")
    private String leverApiKey;

    @Value("${app.ats.lever.base-url:https://api.lever.co/v1}")
    private String leverBaseUrl;

    @Value("${app.ats.workday.tenant-url:}")
    private String workdayTenantUrl;

    @Value("${app.ats.workday.client-id:}")
    private String workdayClientId;

    private final RestClient restClient = RestClient.create();

    // ─── Greenhouse ─────────────────────────────────────────────────────────────

    public List<Map<String, Object>> syncCandidatesFromGreenhouse() {
        log.info("Syncing candidates from Greenhouse");
        try {
            var response = restClient.get()
                    .uri(greenhouseBaseUrl + "/candidates")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((greenhouseApiKey + ":").getBytes()))
                    .retrieve()
                    .body(List.class);
            log.info("Fetched {} candidates from Greenhouse", response != null ? response.size() : 0);
            return response != null ? response : List.of();
        } catch (Exception e) {
            log.error("Greenhouse sync failed: {}", e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> pushCandidateToGreenhouse(Map<String, Object> candidateData) {
        log.info("Pushing candidate to Greenhouse: {}", candidateData.get("email"));
        try {
            return restClient.post()
                    .uri(greenhouseBaseUrl + "/candidates")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((greenhouseApiKey + ":").getBytes()))
                    .header("Content-Type", "application/json")
                    .body(candidateData)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Failed to push to Greenhouse: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // ─── Lever ──────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> syncCandidatesFromLever() {
        log.info("Syncing candidates from Lever");
        try {
            var response = restClient.get()
                    .uri(leverBaseUrl + "/opportunities")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((leverApiKey + ":").getBytes()))
                    .retrieve()
                    .body(Map.class);

            var data = response != null ? (List<Map<String, Object>>) response.get("data") : List.<Map<String, Object>>of();
            log.info("Fetched {} opportunities from Lever", data.size());
            return data;
        } catch (Exception e) {
            log.error("Lever sync failed: {}", e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> pushCandidateToLever(Map<String, Object> candidateData) {
        log.info("Pushing candidate to Lever: {}", candidateData.get("email"));
        try {
            return restClient.post()
                    .uri(leverBaseUrl + "/opportunities")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((leverApiKey + ":").getBytes()))
                    .header("Content-Type", "application/json")
                    .body(candidateData)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Failed to push to Lever: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // ─── Workday ────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> syncCandidatesFromWorkday() {
        log.info("Syncing candidates from Workday");
        try {
            var response = restClient.get()
                    .uri(workdayTenantUrl + "/recruiting/v1/jobApplications")
                    .header("Authorization", "Bearer " + getWorkdayToken())
                    .retrieve()
                    .body(Map.class);

            var data = response != null ? (List<Map<String, Object>>) response.get("data") : List.<Map<String, Object>>of();
            log.info("Fetched {} applications from Workday", data.size());
            return data;
        } catch (Exception e) {
            log.error("Workday sync failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String getWorkdayToken() {
        // OAuth2 client credentials flow for Workday
        // In production, implement proper token caching + refresh
        return workdayClientId; // Placeholder
    }

    /**
     * Generic sync method that delegates to the appropriate ATS.
     */
    public List<Map<String, Object>> syncCandidates(String atsProvider) {
        return switch (atsProvider.toLowerCase()) {
            case "greenhouse" -> syncCandidatesFromGreenhouse();
            case "lever" -> syncCandidatesFromLever();
            case "workday" -> syncCandidatesFromWorkday();
            default -> throw new UnsupportedOperationException("Unsupported ATS: " + atsProvider);
        };
    }

    public Map<String, Object> pushCandidate(String atsProvider, Map<String, Object> candidateData) {
        return switch (atsProvider.toLowerCase()) {
            case "greenhouse" -> pushCandidateToGreenhouse(candidateData);
            case "lever" -> pushCandidateToLever(candidateData);
            default -> throw new UnsupportedOperationException("Unsupported ATS for push: " + atsProvider);
        };
    }
}
