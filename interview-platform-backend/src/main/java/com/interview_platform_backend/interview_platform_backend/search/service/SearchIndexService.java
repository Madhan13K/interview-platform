package com.interview_platform_backend.interview_platform_backend.search.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.search.document.CandidateDocument;
import com.interview_platform_backend.interview_platform_backend.search.document.InterviewDocument;
import com.interview_platform_backend.interview_platform_backend.search.repository.CandidateSearchRepository;
import com.interview_platform_backend.interview_platform_backend.search.repository.InterviewSearchRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.search.enabled", havingValue = "true", matchIfMissing = false)
public class SearchIndexService {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexService.class);
    private static final String SEARCH_INDEX_EVENTS_TOPIC = "search-index-events";

    private final InterviewSearchRepository interviewSearchRepository;
    private final CandidateSearchRepository candidateSearchRepository;
    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public SearchIndexService(InterviewSearchRepository interviewSearchRepository,
                              CandidateSearchRepository candidateSearchRepository,
                              InterviewRepository interviewRepository,
                              UserRepository userRepository,
                              KafkaTemplate<String, Object> kafkaTemplate,
                              ObjectMapper objectMapper) {
        this.interviewSearchRepository = interviewSearchRepository;
        this.candidateSearchRepository = candidateSearchRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Publishes an index event to the search-index-events Kafka topic.
     * This is the ONLY public entry point for triggering indexing from other services.
     */
    public void publishIndexEvent(String entityType, UUID entityId) {
        Map<String, String> event = Map.of(
                "entityType", entityType,
                "entityId", entityId.toString()
        );
        kafkaTemplate.send(SEARCH_INDEX_EVENTS_TOPIC, entityId.toString(), event);
        log.debug("Published index event: entityType={}, entityId={}", entityType, entityId);
    }

    @KafkaListener(topics = {"search-index-events", "interview-events"}, groupId = "search-indexer")
    public void handleIndexEvent(String message) {
        log.debug("Received index event: {}", message);
        try {
            JsonNode event = objectMapper.readTree(message);
            String entityType = event.has("entityType") ? event.get("entityType").asText() : null;
            String entityId = event.has("entityId") ? event.get("entityId").asText() : null;

            if (entityType != null && entityId != null) {
                UUID id = UUID.fromString(entityId);
                switch (entityType) {
                    case "interview" -> indexInterview(id);
                    case "candidate" -> indexCandidate(id);
                    default -> log.warn("Unknown entity type in index event: {}", entityType);
                }
            } else {
                // Legacy interview-events topic: reindex all interviews
                reindexAllInterviews();
            }
        } catch (Exception e) {
            log.error("Failed to process index event: {}", message, e);
        }
    }

    @WithSpan("search-index-interview")
    private void indexInterview(@SpanAttribute("interview.id") UUID interviewId) {
        interviewRepository.findById(interviewId).ifPresent(interview -> {
            InterviewDocument doc = mapInterviewToDocument(interview);
            interviewSearchRepository.save(doc);
            log.debug("Indexed interview: {}", interviewId);
        });
    }

    @WithSpan("search-index-candidate")
    private void indexCandidate(@SpanAttribute("candidate.id") UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            CandidateDocument doc = mapUserToCandidateDocument(user);
            candidateSearchRepository.save(doc);
            log.debug("Indexed candidate: {}", userId);
        });
    }

    @WithSpan("search-reindex-all-interviews")
    public void reindexAllInterviews() {
        log.info("Starting full interview reindex...");
        List<Interview> interviews = interviewRepository.findAll();
        List<InterviewDocument> docs = interviews.stream()
                .map(this::mapInterviewToDocument)
                .toList();
        interviewSearchRepository.saveAll(docs);
        log.info("Reindexed {} interviews", docs.size());
    }

    @WithSpan("search-reindex-all-candidates")
    public void reindexAllCandidates() {
        log.info("Starting full candidate reindex...");
        List<User> users = userRepository.findAll();
        List<CandidateDocument> docs = users.stream()
                .map(this::mapUserToCandidateDocument)
                .toList();
        candidateSearchRepository.saveAll(docs);
        log.info("Reindexed {} candidates", docs.size());
    }

    public void deleteInterviewIndex(UUID interviewId) {
        interviewSearchRepository.deleteById(interviewId.toString());
    }

    public void deleteCandidateIndex(UUID userId) {
        candidateSearchRepository.deleteById(userId.toString());
    }

    private InterviewDocument mapInterviewToDocument(Interview interview) {
        InterviewDocument.CandidateInfo candidateInfo = null;
        if (interview.getCandidate() != null) {
            User c = interview.getCandidate();
            candidateInfo = InterviewDocument.CandidateInfo.builder()
                    .id(c.getId().toString())
                    .name((c.getFirstName() != null ? c.getFirstName() : "") + " " + (c.getLastName() != null ? c.getLastName() : ""))
                    .email(c.getEmail())
                    .build();
        }

        InterviewDocument.UserInfo scheduledByInfo = null;
        if (interview.getScheduledBy() != null) {
            User s = interview.getScheduledBy();
            scheduledByInfo = InterviewDocument.UserInfo.builder()
                    .id(s.getId().toString())
                    .name((s.getFirstName() != null ? s.getFirstName() : "") + " " + (s.getLastName() != null ? s.getLastName() : ""))
                    .email(s.getEmail())
                    .build();
        }

        return InterviewDocument.builder()
                .id(interview.getId().toString())
                .title(interview.getTitle())
                .description(interview.getDescription())
                .status(interview.getStatus() != null ? interview.getStatus().name() : null)
                .type(interview.getType() != null ? interview.getType().name() : null)
                .mode(interview.getMode() != null ? interview.getMode().name() : null)
                .candidate(candidateInfo)
                .scheduledBy(scheduledByInfo)
                .startTime(interview.getStartTime())
                .endTime(interview.getEndTime())
                .timeZone(interview.getTimeZone())
                .createdAt(interview.getCreatedAt())
                .build();
    }

    private CandidateDocument mapUserToCandidateDocument(User user) {
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " +
                (user.getLastName() != null ? user.getLastName() : "")).trim();

        return CandidateDocument.builder()
                .id(user.getId().toString())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(fullName)
                .email(user.getEmail())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
