package com.interview_platform_backend.interview_platform_backend.offernegotiation.service;

import com.interview_platform_backend.interview_platform_backend.offernegotiation.entity.OfferNegotiation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OfferNegotiationService {

    private static final Logger log = LoggerFactory.getLogger(OfferNegotiationService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public OfferNegotiation startNegotiation(OfferNegotiation negotiation) {
        log.info("Starting offer negotiation for candidate={} offer={}", negotiation.getCandidateId(), negotiation.getOfferId());
        entityManager.persist(negotiation);
        return negotiation;
    }

    @Transactional
    public OfferNegotiation submitCounterOffer(UUID negotiationId, String counterOffer) {
        OfferNegotiation negotiation = entityManager.find(OfferNegotiation.class, negotiationId);
        if (negotiation == null) {
            throw new IllegalArgumentException("Negotiation not found: " + negotiationId);
        }
        negotiation.setCounterOffer(counterOffer);
        negotiation.setStatus(OfferNegotiation.Status.COUNTER_OFFERED);
        negotiation.setRounds(negotiation.getRounds() + 1);
        log.info("Counter offer submitted for negotiation {}. Round: {}", negotiationId, negotiation.getRounds());
        return entityManager.merge(negotiation);
    }

    @Transactional
    public OfferNegotiation getAISuggestion(UUID negotiationId) {
        OfferNegotiation negotiation = entityManager.find(OfferNegotiation.class, negotiationId);
        if (negotiation == null) {
            throw new IllegalArgumentException("Negotiation not found: " + negotiationId);
        }

        log.info("Getting AI suggestion for negotiation {}", negotiationId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", "openai/gpt-4o",
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a compensation negotiation advisor. Analyze the offer details and provide strategic recommendations."),
                            Map.of("role", "user", "content", "Current offer: " + negotiation.getCurrentOffer() +
                                    "\nCounter offer: " + negotiation.getCounterOffer() +
                                    "\nCompeting offers: " + negotiation.getCompetingOffers() +
                                    "\nRound: " + negotiation.getRounds() +
                                    "\nProvide a recommendation.")
                    )
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl + "/chat/completions", HttpMethod.POST, request, Map.class);

            if (response.getBody() != null) {
                negotiation.setAiSuggestion(response.getBody().toString());
            }
        } catch (Exception e) {
            log.error("AI suggestion failed for negotiation {}: {}", negotiationId, e.getMessage());
            negotiation.setAiSuggestion("AI suggestion unavailable: " + e.getMessage());
        }

        return entityManager.merge(negotiation);
    }

    @Transactional
    public OfferNegotiation resolveNegotiation(UUID negotiationId, OfferNegotiation.Status resolution) {
        OfferNegotiation negotiation = entityManager.find(OfferNegotiation.class, negotiationId);
        if (negotiation == null) {
            throw new IllegalArgumentException("Negotiation not found: " + negotiationId);
        }
        negotiation.setStatus(resolution);
        negotiation.setResolvedAt(Instant.now());
        log.info("Negotiation {} resolved with status {}", negotiationId, resolution);
        return entityManager.merge(negotiation);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<OfferNegotiation> listByCandidate(UUID candidateId) {
        return entityManager.createQuery("SELECT n FROM OfferNegotiation n WHERE n.candidateId = :candidateId ORDER BY n.createdAt DESC")
                .setParameter("candidateId", candidateId)
                .getResultList();
    }

    @Transactional(readOnly = true)
    public OfferNegotiation getById(UUID id) {
        return entityManager.find(OfferNegotiation.class, id);
    }
}
