package com.interview_platform_backend.interview_platform_backend.jobposting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Job Board Auto-Posting Service.
 * Automated distribution to LinkedIn, Indeed, Glassdoor via their posting APIs.
 */
@Service
public class JobBoardPostingService {

    private static final Logger log = LoggerFactory.getLogger(JobBoardPostingService.class);

    @Value("${app.job-boards.linkedin.access-token:}")
    private String linkedInAccessToken;

    @Value("${app.job-boards.indeed.employer-id:}")
    private String indeedEmployerId;

    @Value("${app.job-boards.indeed.api-key:}")
    private String indeedApiKey;

    @Value("${app.job-boards.glassdoor.api-key:}")
    private String glassdoorApiKey;

    private final RestClient restClient = RestClient.create();

    /**
     * Post a job to multiple boards simultaneously.
     */
    public Map<String, PostingResult> postToAllBoards(JobPostingRequest request) {
        log.info("Auto-posting job '{}' to all configured boards", request.title());
        return Map.of(
                "linkedin", postToLinkedIn(request),
                "indeed", postToIndeed(request),
                "glassdoor", postToGlassdoor(request)
        );
    }

    public PostingResult postToLinkedIn(JobPostingRequest request) {
        if (linkedInAccessToken == null || linkedInAccessToken.isBlank()) {
            return new PostingResult("linkedin", false, null, "LinkedIn access token not configured");
        }
        try {
            Map<String, Object> body = Map.of(
                    "title", request.title(),
                    "description", Map.of("text", request.description()),
                    "location", request.location(),
                    "employmentStatus", request.employmentType(),
                    "companyApplyUrl", request.applyUrl()
            );

            var response = restClient.post()
                    .uri("https://api.linkedin.com/v2/simpleJobPostings")
                    .header("Authorization", "Bearer " + linkedInAccessToken)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String postingId = response != null ? String.valueOf(response.get("id")) : null;
            log.info("Job posted to LinkedIn: {}", postingId);
            return new PostingResult("linkedin", true, postingId, null);
        } catch (Exception e) {
            log.error("LinkedIn posting failed: {}", e.getMessage());
            return new PostingResult("linkedin", false, null, e.getMessage());
        }
    }

    public PostingResult postToIndeed(JobPostingRequest request) {
        if (indeedApiKey == null || indeedApiKey.isBlank()) {
            return new PostingResult("indeed", false, null, "Indeed API key not configured");
        }
        try {
            Map<String, Object> body = Map.of(
                    "title", request.title(),
                    "description", request.description(),
                    "location", request.location(),
                    "jobType", request.employmentType(),
                    "salary", request.salaryRange() != null ? request.salaryRange() : "",
                    "employer", indeedEmployerId
            );

            var response = restClient.post()
                    .uri("https://apis.indeed.com/v1/jobs")
                    .header("Authorization", "Bearer " + indeedApiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String postingId = response != null ? String.valueOf(response.get("id")) : null;
            log.info("Job posted to Indeed: {}", postingId);
            return new PostingResult("indeed", true, postingId, null);
        } catch (Exception e) {
            log.error("Indeed posting failed: {}", e.getMessage());
            return new PostingResult("indeed", false, null, e.getMessage());
        }
    }

    public PostingResult postToGlassdoor(JobPostingRequest request) {
        if (glassdoorApiKey == null || glassdoorApiKey.isBlank()) {
            return new PostingResult("glassdoor", false, null, "Glassdoor API key not configured");
        }
        try {
            Map<String, Object> body = Map.of(
                    "jobTitle", request.title(),
                    "jobDescription", request.description(),
                    "location", request.location(),
                    "jobType", request.employmentType()
            );

            var response = restClient.post()
                    .uri("https://api.glassdoor.com/api/v1/jobs")
                    .header("X-Api-Key", glassdoorApiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String postingId = response != null ? String.valueOf(response.get("id")) : null;
            log.info("Job posted to Glassdoor: {}", postingId);
            return new PostingResult("glassdoor", true, postingId, null);
        } catch (Exception e) {
            log.error("Glassdoor posting failed: {}", e.getMessage());
            return new PostingResult("glassdoor", false, null, e.getMessage());
        }
    }

    public record JobPostingRequest(String title, String description, String location,
                                     String employmentType, String salaryRange, String applyUrl) {}

    public record PostingResult(String board, boolean success, String postingId, String errorMessage) {}
}
