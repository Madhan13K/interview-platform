package com.interview_platform_backend.interview_platform_backend.backgroundcheck;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/**
 * Background Check Integration Service.
 * Supports Checkr and Sterling APIs for automated background checks post-offer.
 */
@Service
@ConditionalOnProperty(name = "app.background-check.enabled", havingValue = "true")
public class BackgroundCheckService {

    private static final Logger log = LoggerFactory.getLogger(BackgroundCheckService.class);

    @Value("${app.background-check.provider:checkr}")
    private String provider;

    @Value("${app.background-check.api-key:}")
    private String apiKey;

    @Value("${app.background-check.checkr.base-url:https://api.checkr.com/v1}")
    private String checkrBaseUrl;

    @Value("${app.background-check.sterling.base-url:https://api.sterlingcheck.com/v2}")
    private String sterlingBaseUrl;

    private final RestClient restClient = RestClient.create();

    /**
     * Initiate a background check for a candidate after offer acceptance.
     */
    public BackgroundCheckResult initiateCheck(String candidateEmail, String candidateName, String packageType) {
        log.info("Initiating {} background check for {} (package: {})", provider, candidateEmail, packageType);

        if ("checkr".equalsIgnoreCase(provider)) {
            return initiateCheckr(candidateEmail, candidateName, packageType);
        } else if ("sterling".equalsIgnoreCase(provider)) {
            return initiateSterling(candidateEmail, candidateName, packageType);
        }

        throw new UnsupportedOperationException("Unsupported background check provider: " + provider);
    }

    /**
     * Poll/check status of an existing background check.
     */
    public BackgroundCheckResult getStatus(String checkId) {
        log.info("Checking status for background check: {}", checkId);

        if ("checkr".equalsIgnoreCase(provider)) {
            return getCheckrStatus(checkId);
        } else if ("sterling".equalsIgnoreCase(provider)) {
            return getSterlingStatus(checkId);
        }

        throw new UnsupportedOperationException("Unsupported provider: " + provider);
    }

    private BackgroundCheckResult initiateCheckr(String email, String name, String packageType) {
        try {
            // Checkr API: Create candidate, then create invitation
            Map<String, Object> candidateBody = Map.of(
                    "email", email,
                    "first_name", name.split(" ")[0],
                    "last_name", name.contains(" ") ? name.substring(name.indexOf(" ") + 1) : ""
            );

            var response = restClient.post()
                    .uri(checkrBaseUrl + "/candidates")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((apiKey + ":").getBytes()))
                    .header("Content-Type", "application/json")
                    .body(candidateBody)
                    .retrieve()
                    .body(Map.class);

            String candidateId = response != null ? (String) response.get("id") : null;

            // Create invitation with package
            Map<String, Object> invitationBody = Map.of(
                    "candidate_id", candidateId,
                    "package", packageType != null ? packageType : "tasker_standard"
            );

            var inviteResponse = restClient.post()
                    .uri(checkrBaseUrl + "/invitations")
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((apiKey + ":").getBytes()))
                    .header("Content-Type", "application/json")
                    .body(invitationBody)
                    .retrieve()
                    .body(Map.class);

            String invitationId = inviteResponse != null ? (String) inviteResponse.get("id") : null;

            log.info("Checkr background check initiated: candidateId={}, invitationId={}", candidateId, invitationId);
            return new BackgroundCheckResult(invitationId, "PENDING", provider, null);

        } catch (Exception e) {
            log.error("Checkr API call failed: {}", e.getMessage());
            return new BackgroundCheckResult(null, "FAILED", provider, e.getMessage());
        }
    }

    private BackgroundCheckResult initiateSterling(String email, String name, String packageType) {
        try {
            Map<String, Object> body = Map.of(
                    "candidateEmail", email,
                    "candidateName", name,
                    "screeningPackage", packageType != null ? packageType : "standard"
            );

            var response = restClient.post()
                    .uri(sterlingBaseUrl + "/screenings")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String screeningId = response != null ? (String) response.get("id") : null;
            log.info("Sterling background check initiated: screeningId={}", screeningId);
            return new BackgroundCheckResult(screeningId, "PENDING", provider, null);

        } catch (Exception e) {
            log.error("Sterling API call failed: {}", e.getMessage());
            return new BackgroundCheckResult(null, "FAILED", provider, e.getMessage());
        }
    }

    private BackgroundCheckResult getCheckrStatus(String checkId) {
        try {
            var response = restClient.get()
                    .uri(checkrBaseUrl + "/reports/" + checkId)
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder().encodeToString((apiKey + ":").getBytes()))
                    .retrieve()
                    .body(Map.class);

            String status = response != null ? (String) response.get("status") : "unknown";
            return new BackgroundCheckResult(checkId, status.toUpperCase(), provider, null);
        } catch (Exception e) {
            return new BackgroundCheckResult(checkId, "ERROR", provider, e.getMessage());
        }
    }

    private BackgroundCheckResult getSterlingStatus(String checkId) {
        try {
            var response = restClient.get()
                    .uri(sterlingBaseUrl + "/screenings/" + checkId)
                    .header("Authorization", "Bearer " + apiKey)
                    .retrieve()
                    .body(Map.class);

            String status = response != null ? (String) response.get("status") : "unknown";
            return new BackgroundCheckResult(checkId, status.toUpperCase(), provider, null);
        } catch (Exception e) {
            return new BackgroundCheckResult(checkId, "ERROR", provider, e.getMessage());
        }
    }

    public record BackgroundCheckResult(String checkId, String status, String provider, String errorMessage) {}
}
